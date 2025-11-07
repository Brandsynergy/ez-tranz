require('dotenv').config();
const express = require('express');
const cors = require('cors');

// Validate Stripe key
if (!process.env.STRIPE_SECRET_KEY) {
  console.error('❌ ERROR: STRIPE_SECRET_KEY environment variable is not set!');
  console.error('Please add your Stripe secret key to environment variables.');
  process.exit(1);
}

const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

const app = express();
const PORT = process.env.PORT || 3000;

// ==========================================
// SECURITY CONFIGURATIONS
// ==========================================

// Transaction limits for fraud prevention
const TRANSACTION_LIMITS = {
  MIN_AMOUNT: 0.50,      // Minimum $0.50 (default)
  MAX_AMOUNT: 999999.99, // Maximum per transaction
  DAILY_LIMIT: 10000     // Maximum $10,000 per day per IP (in USD equivalent)
};

// Stripe minimum amounts by currency (to avoid processing errors)
// These are based on Stripe's minimum charge amounts
const CURRENCY_MINIMUMS = {
  'usd': 0.50,     // $0.50
  'eur': 0.50,     // €0.50
  'gbp': 0.30,     // £0.30
  'cad': 0.50,     // C$0.50
  'aud': 0.50,     // A$0.50
  'jpy': 50,       // ¥50
  'chf': 0.50,     // Fr 0.50
  'cny': 3,        // ¥3
  'inr': 50,       // ₹50
  'mxn': 10,       // $10
  'brl': 2,        // R$2
  'zar': 8,        // R8
  'ngn': 500,      // ₦500 (minimum ~£0.30 equivalent)
  'kes': 50,       // KSh50
  'ghs': 5         // ₵5
};

// Rate limiting: Track requests per IP
const rateLimitMap = new Map();
const dailyLimitMap = new Map();

// Security middleware: Rate limiting
function rateLimiter(req, res, next) {
  const ip = req.ip || req.connection.remoteAddress;
  const now = Date.now();
  const windowMs = 60 * 1000; // 1 minute window
  const maxRequests = 10; // Max 10 requests per minute

  if (!rateLimitMap.has(ip)) {
    rateLimitMap.set(ip, []);
  }

  const requests = rateLimitMap.get(ip).filter(time => now - time < windowMs);
  
  if (requests.length >= maxRequests) {
    console.warn(`⚠️  Rate limit exceeded for IP: ${ip}`);
    return res.status(429).json({ 
      error: 'Too many requests. Please wait a moment and try again.' 
    });
  }

  requests.push(now);
  rateLimitMap.set(ip, requests);
  next();
}

// Security middleware: Daily transaction limit per IP
function dailyLimitChecker(req, res, next) {
  const ip = req.ip || req.connection.remoteAddress;
  const today = new Date().toDateString();
  const key = `${ip}-${today}`;

  if (!dailyLimitMap.has(key)) {
    dailyLimitMap.set(key, 0);
  }

  const dailyTotal = dailyLimitMap.get(key);
  const requestAmount = parseFloat(req.body.amount) || 0;

  if (dailyTotal + requestAmount > TRANSACTION_LIMITS.DAILY_LIMIT) {
    console.warn(`⚠️  Daily limit exceeded for IP: ${ip}`);
    return res.status(429).json({ 
      error: 'Daily transaction limit reached. Please try again tomorrow.' 
    });
  }

  // Store amount temporarily for updating after successful payment
  req.dailyLimitKey = key;
  next();
}

// Security middleware: Validate transaction amount
function validateAmount(req, res, next) {
  const { amount, currency = 'usd' } = req.body;
  const numAmount = parseFloat(amount);
  const currencyLower = currency.toLowerCase();

  if (!amount || isNaN(numAmount)) {
    return res.status(400).json({ error: 'Invalid amount format' });
  }

  // Get currency-specific minimum or use default
  const minAmount = CURRENCY_MINIMUMS[currencyLower] || TRANSACTION_LIMITS.MIN_AMOUNT;

  if (numAmount < minAmount) {
    // Get currency symbol for error message
    const currencySymbols = {
      usd: '$', eur: '€', gbp: '£', ngn: '₦', inr: '₹', jpy: '¥',
      cad: 'C$', aud: 'A$', brl: 'R$', mxn: '$', zar: 'R', 
      kes: 'KSh', ghs: '₵', chf: 'Fr', cny: '¥'
    };
    const symbol = currencySymbols[currencyLower] || '';
    
    return res.status(400).json({ 
      error: `Minimum transaction amount for ${currency.toUpperCase()} is ${symbol}${minAmount}` 
    });
  }

  if (numAmount > TRANSACTION_LIMITS.MAX_AMOUNT) {
    return res.status(400).json({ 
      error: `Maximum transaction amount is ${TRANSACTION_LIMITS.MAX_AMOUNT}` 
    });
  }

  next();
}

// Security middleware: Add security headers
app.use((req, res, next) => {
  // HTTPS enforcement (in production)
  if (process.env.NODE_ENV === 'production' && req.headers['x-forwarded-proto'] !== 'https') {
    return res.redirect(`https://${req.headers.host}${req.url}`);
  }

  // Security headers
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  
  // Strict-Transport-Security (HSTS) - Forces HTTPS
  if (process.env.NODE_ENV === 'production') {
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  }
  
  next();
});

// Request logging for security monitoring
app.use((req, res, next) => {
  const timestamp = new Date().toISOString();
  const ip = req.ip || req.connection.remoteAddress;
  console.log(`[${timestamp}] ${req.method} ${req.path} - IP: ${ip}`);
  next();
});

app.use(cors());
app.use(express.json());

// Store active payment sessions in memory
const paymentSessions = new Map();

// API Routes (MUST come before static files)
// Create payment session and return URL for QR code
app.post('/create-payment-session', 
  rateLimiter,           // Apply rate limiting
  validateAmount,        // Validate transaction amount
  dailyLimitChecker,     // Check daily limit
  async (req, res) => {
  try {
    const { amount, currency = 'usd' } = req.body;

    console.log('✅ Creating payment session for amount:', amount, currency);

    // Create Stripe Checkout session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: currency,
            product_data: {
              name: 'Payment',
              description: `EZ TRANZ Payment`,
            },
            unit_amount: Math.round(amount * 100),
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${req.headers.origin || 'https://ez-tranz.onrender.com'}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${req.headers.origin || 'https://ez-tranz.onrender.com'}/cancel`,
    });

    console.log('✅ Payment session created:', session.id);

    // Store session for status checking with security info
    paymentSessions.set(session.id, {
      amount,
      status: 'pending',
      created: Date.now(),
      ip: req.ip || req.connection.remoteAddress,
      dailyLimitKey: req.dailyLimitKey
    });

    // Update daily limit counter
    const currentTotal = dailyLimitMap.get(req.dailyLimitKey) || 0;
    dailyLimitMap.set(req.dailyLimitKey, currentTotal + parseFloat(amount));
    console.log(`📊 Daily total for ${req.dailyLimitKey}: $${(currentTotal + parseFloat(amount)).toFixed(2)}`);

    res.json({
      sessionId: session.id,
      paymentUrl: session.url,
    });
  } catch (error) {
    console.error('Error creating payment session:', error);
    console.error('Error details:', error.type, error.code, error.message);
    res.status(500).json({ error: error.message });
  }
});

// Check payment status
app.get('/payment-status/:sessionId', async (req, res) => {
  try {
    const { sessionId } = req.params;
    
    const session = await stripe.checkout.sessions.retrieve(sessionId);
    
    res.json({
      status: session.payment_status,
      amount: session.amount_total / 100,
    });
  } catch (error) {
    console.error('Error checking payment status:', error);
    res.status(500).json({ error: error.message });
  }
});

// Stripe webhook endpoint for payment verification
// Note: This endpoint needs raw body, so it must come before express.json()
app.post('/webhook', express.raw({type: 'application/json'}), async (req, res) => {
  const sig = req.headers['stripe-signature'];
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!webhookSecret) {
    console.warn('⚠️  Webhook secret not configured. Skipping signature verification.');
    return res.status(400).send('Webhook secret not configured');
  }

  let event;

  try {
    // Verify webhook signature
    event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
    console.log('✅ Webhook signature verified:', event.type);
  } catch (err) {
    console.error('❌ Webhook signature verification failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Handle the event
  switch (event.type) {
    case 'checkout.session.completed':
      const session = event.data.object;
      console.log('✅ Payment successful for session:', session.id);
      console.log(`💵 Amount: $${(session.amount_total / 100).toFixed(2)}`);
      console.log(`📧 Customer: ${session.customer_details?.email || 'N/A'}`);
      
      // Update session status in memory
      if (paymentSessions.has(session.id)) {
        const sessionData = paymentSessions.get(session.id);
        sessionData.status = 'completed';
        sessionData.completedAt = Date.now();
        paymentSessions.set(session.id, sessionData);
      }
      break;
      
    case 'checkout.session.expired':
      console.log('⚠️  Payment session expired:', event.data.object.id);
      break;
      
    default:
      console.log(`Unhandled event type: ${event.type}`);
  }

  res.json({received: true});
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    app: 'EZ TRANZ',
    security: 'enabled',
    limits: TRANSACTION_LIMITS
  });
});

// Serve static files AFTER API routes
app.use(express.static('public'));

// Clean up old sessions every hour
setInterval(() => {
  const oneHourAgo = Date.now() - (60 * 60 * 1000);
  for (const [sessionId, data] of paymentSessions.entries()) {
    if (data.created < oneHourAgo) {
      paymentSessions.delete(sessionId);
    }
  }
}, 60 * 60 * 1000);

app.listen(PORT, () => {
  console.log(`🚀 EZ TRANZ server running on port ${PORT}`);
});
