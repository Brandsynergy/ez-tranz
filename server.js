require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { Resend } = require('resend');

// Validate Stripe key
if (!process.env.STRIPE_SECRET_KEY) {
  console.error('❌ ERROR: STRIPE_SECRET_KEY environment variable is not set!');
  console.error('Please add your Stripe secret key to environment variables.');
  process.exit(1);
}

const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

// Initialize Resend for email sending
const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

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
app.use(express.json({ limit: '10mb' })); // Increase limit for logo uploads

// Cookie parser for sessions
const cookieParser = require('cookie-parser');
app.use(cookieParser());

// Import mock database
const db = require('./mockDatabase');

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
    const { amount, currency = 'usd', merchantId } = req.body;

    console.log('✅ Creating payment session for amount:', amount, currency);

    // Generate a simple session ID (no Stripe Checkout needed anymore)
    const sessionId = 'pay_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    
    console.log('✅ Payment session created:', sessionId);

    // Store session for tracking
    paymentSessions.set(sessionId, {
      amount,
      currency,
      merchantId: merchantId || null,
      status: 'pending',
      created: Date.now(),
      ip: req.ip || req.connection.remoteAddress,
      dailyLimitKey: req.dailyLimitKey
    });

    // Update daily limit counter
    const currentTotal = dailyLimitMap.get(req.dailyLimitKey) || 0;
    dailyLimitMap.set(req.dailyLimitKey, currentTotal + parseFloat(amount));
    console.log(`📊 Daily total for ${req.dailyLimitKey}: $${(currentTotal + parseFloat(amount)).toFixed(2)}`);

    // Return session ID - frontend will create payment URL
    const paymentUrl = merchantId 
      ? `/pay.html?session_id=${sessionId}&amount=${amount}&currency=${currency}&merchant_id=${merchantId}`
      : `/pay.html?session_id=${sessionId}&amount=${amount}&currency=${currency}`;
    
    res.json({
      sessionId: sessionId,
      paymentUrl: paymentUrl,
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
    
    // Check our in-memory session store
    const session = paymentSessions.get(sessionId);
    
    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }
    
    res.json({
      status: session.status === 'completed' ? 'paid' : 'pending',
      amount: session.amount,
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

// ==========================================
// MERCHANT AUTHENTICATION & DASHBOARD APIS
// ==========================================

// Middleware to check if merchant is authenticated
function requireAuth(req, res, next) {
  const sessionId = req.cookies.merchantSession;
  console.log('🔐 Auth check - Session:', sessionId ? 'EXISTS' : 'MISSING');
  
  if (!sessionId) {
    console.log('❌ Auth failed: No session cookie');
    return res.status(401).json({ error: 'Not authenticated. Please login again.' });
  }
  
  const merchantId = db.validateSession(sessionId);
  console.log('🔐 Validated merchant ID:', merchantId || 'INVALID');
  
  if (!merchantId) {
    console.log('❌ Auth failed: Session expired or invalid');
    res.clearCookie('merchantSession');
    return res.status(401).json({ error: 'Session expired. Please login again.' });
  }
  
  req.merchantId = merchantId;
  console.log('✅ Auth successful for merchant:', merchantId);
  next();
}

// Merchant Signup
app.post('/api/merchant/signup', async (req, res) => {
  try {
    const { email, password, businessName } = req.body;
    
    if (!email || !password || !businessName) {
      return res.status(400).json({ error: 'All fields are required' });
    }
    
    const merchant = await db.createMerchant(email, password, businessName);
    const sessionId = db.createSession(merchant.id);
    
    res.cookie('merchantSession', sessionId, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    });
    
    res.json({ success: true, merchant });
  } catch (error) {
    console.error('Signup error:', error);
    res.status(400).json({ error: error.message });
  }
});

// Merchant Login
app.post('/api/merchant/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password required' });
    }
    
    const merchant = await db.authenticateMerchant(email, password);
    if (!merchant) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    const sessionId = db.createSession(merchant.id);
    
    res.cookie('merchantSession', sessionId, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    });
    
    res.json({ success: true, merchant });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
});

// Merchant Logout
app.post('/api/merchant/logout', (req, res) => {
  const sessionId = req.cookies.merchantSession;
  if (sessionId) {
    db.deleteSession(sessionId);
  }
  res.clearCookie('merchantSession');
  res.json({ success: true });
});

// Get Current Merchant
app.get('/api/merchant/me', requireAuth, (req, res) => {
  const merchant = db.getMerchantById(req.merchantId);
  if (!merchant) {
    return res.status(404).json({ error: 'Merchant not found' });
  }
  res.json(merchant);
});

// Get Merchant Settings (Branding)
// If authenticated, return merchant's settings; otherwise return demo merchant settings for public terminal
app.get('/api/merchant/settings', (req, res) => {
  const sessionId = req.cookies.merchantSession;
  console.log('📝 Settings API - Session cookie:', sessionId ? 'EXISTS' : 'MISSING');
  let merchantId = null;
  
  if (sessionId) {
    merchantId = db.validateSession(sessionId);
    console.log('📝 Validated merchant ID:', merchantId || 'INVALID SESSION');
  }
  
  // If not authenticated, use demo merchant for public terminal
  if (!merchantId) {
    merchantId = db.getDemoMerchantId();
    console.log('📝 Using demo merchant ID:', merchantId);
  }
  
  const settings = db.getMerchantSettings(merchantId);
  console.log('📝 Returning settings for:', settings ? settings.businessName : 'NOT FOUND');
  if (!settings) {
    return res.status(404).json({ error: 'Settings not found' });
  }
  res.json(settings);
});

// Update Merchant Settings (Branding)
app.put('/api/merchant/settings', requireAuth, (req, res) => {
  try {
    console.log('🔧 Update settings request for merchant:', req.merchantId);
    console.log('🔧 Update payload keys:', Object.keys(req.body));
    console.log('🔧 Logo size:', req.body.logo ? req.body.logo.length : 'N/A');
    
    const updates = req.body;
    const settings = db.updateMerchantSettings(req.merchantId, updates);
    
    console.log('✅ Settings updated successfully');
    res.json(settings);
  } catch (error) {
    console.error('❌ Update settings error:', error);
    console.error('❌ Error stack:', error.stack);
    res.status(400).json({ error: error.message || 'Failed to update settings' });
  }
});

// Get Transaction Stats
app.get('/api/merchant/stats', requireAuth, (req, res) => {
  const stats = db.getTransactionStats(req.merchantId);
  res.json(stats);
});

// Get Transaction History
app.get('/api/merchant/transactions', requireAuth, (req, res) => {
  const { limit, offset, currency, startDate, endDate } = req.query;
  const options = {
    limit: limit ? parseInt(limit) : 50,
    offset: offset ? parseInt(offset) : 0,
    currency,
    startDate,
    endDate
  };
  const result = db.getMerchantTransactions(req.merchantId, options);
  res.json(result);
});

// Reset all transactions (delete all transaction history)
app.post('/api/merchant/reset-transactions', requireAuth, (req, res) => {
  try {
    db.clearMerchantTransactions(req.merchantId);
    console.log(`🗑️ Cleared all transactions for merchant: ${req.merchantId}`);
    res.json({ success: true, message: 'All transactions deleted' });
  } catch (error) {
    console.error('Error resetting transactions:', error);
    res.status(500).json({ error: 'Failed to reset transactions' });
  }
});

// ==========================================
// BANK ACCOUNT APIS
// ==========================================

// Get Bank Accounts
app.get('/api/merchant/bank-accounts', requireAuth, (req, res) => {
  try {
    const accounts = db.getBankAccounts(req.merchantId);
    res.json({ accounts });
  } catch (error) {
    console.error('Error fetching bank accounts:', error);
    res.status(500).json({ error: 'Failed to fetch bank accounts' });
  }
});

// Add Bank Account
app.post('/api/merchant/bank-accounts', requireAuth, (req, res) => {
  try {
    const accountData = req.body;
    
    // Validate required fields
    if (!accountData.accountHolderName || !accountData.bankName || 
        !accountData.accountNumber || !accountData.routingNumber) {
      return res.status(400).json({ error: 'All bank account fields are required' });
    }
    
    const account = db.createBankAccount(req.merchantId, accountData);
    res.json({ success: true, account });
  } catch (error) {
    console.error('Error creating bank account:', error);
    res.status(400).json({ error: error.message });
  }
});

// Set Default Bank Account
app.put('/api/merchant/bank-accounts/:id/set-default', requireAuth, (req, res) => {
  try {
    db.setDefaultBankAccount(req.merchantId, req.params.id);
    res.json({ success: true });
  } catch (error) {
    console.error('Error setting default account:', error);
    res.status(400).json({ error: error.message });
  }
});

// Delete Bank Account
app.delete('/api/merchant/bank-accounts/:id', requireAuth, (req, res) => {
  try {
    db.deleteBankAccount(req.merchantId, req.params.id);
    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting bank account:', error);
    res.status(400).json({ error: error.message });
  }
});

// ==========================================
// STRIPE CONNECT ENDPOINTS
// ==========================================

// Get Stripe Connect OAuth URL
app.get('/api/stripe/connect-url', requireAuth, async (req, res) => {
  try {
    if (!process.env.STRIPE_CLIENT_ID) {
      return res.status(500).json({ error: 'Stripe Connect not configured. Please contact support.' });
    }
    
    const state = req.merchantId; // Use merchant ID as state parameter for security
    
    const params = new URLSearchParams({
      response_type: 'code',
      client_id: process.env.STRIPE_CLIENT_ID,
      scope: 'read_write',
      redirect_uri: `${process.env.APP_URL || 'http://localhost:3000'}/api/stripe/callback`,
      state: state,
      'stripe_user[business_type]': 'individual'
    });
    
    const connectUrl = `https://connect.stripe.com/oauth/authorize?${params.toString()}`;
    
    console.log(`🔗 Generated Stripe Connect URL for merchant: ${req.merchantId}`);
    res.json({ url: connectUrl });
  } catch (error) {
    console.error('❌ Error generating connect URL:', error);
    res.status(500).json({ error: 'Failed to generate connect URL' });
  }
});

// Handle Stripe OAuth callback
app.get('/api/stripe/callback', async (req, res) => {
  try {
    const { code, state, error } = req.query;
    const merchantId = state;
    
    // Handle OAuth errors
    if (error) {
      console.error(`❌ Stripe OAuth error: ${error}`);
      return res.redirect('/merchant-dashboard.html?stripe_error=' + error);
    }
    
    if (!code) {
      console.error('❌ No authorization code received');
      return res.redirect('/merchant-dashboard.html?stripe_error=no_code');
    }
    
    console.log(`🔐 Processing Stripe Connect callback for merchant: ${merchantId}`);
    
    // Exchange authorization code for Stripe Account ID
    const response = await stripe.oauth.token({
      grant_type: 'authorization_code',
      code: code,
    });
    
    const stripeAccountId = response.stripe_user_id;
    
    // Save to database
    db.updateMerchantStripeAccount(merchantId, stripeAccountId, 'connected');
    
    console.log(`✅ Merchant ${merchantId} successfully connected Stripe account: ${stripeAccountId}`);
    
    // Redirect back to dashboard with success message
    res.redirect('/merchant-dashboard.html?stripe_connected=success');
  } catch (error) {
    console.error('❌ OAuth callback error:', error);
    res.redirect('/merchant-dashboard.html?stripe_error=connection_failed');
  }
});

// Get Stripe Connect account status
app.get('/api/stripe/account-status', requireAuth, async (req, res) => {
  try {
    const stripeInfo = db.getMerchantStripeAccount(req.merchantId);
    
    if (!stripeInfo) {
      return res.json({ 
        stripeAccountId: null, 
        stripeAccountStatus: 'not_connected' 
      });
    }
    
    res.json(stripeInfo);
  } catch (error) {
    console.error('❌ Error getting account status:', error);
    res.status(500).json({ error: 'Failed to get status' });
  }
});

// Disconnect Stripe account
app.post('/api/stripe/disconnect', requireAuth, async (req, res) => {
  try {
    console.log(`🔓 Disconnecting Stripe account for merchant: ${req.merchantId}`);
    
    db.updateMerchantStripeAccount(req.merchantId, null, 'not_connected');
    
    console.log(`✅ Successfully disconnected Stripe account`);
    res.json({ success: true });
  } catch (error) {
    console.error('❌ Error disconnecting:', error);
    res.status(500).json({ error: 'Failed to disconnect' });
  }
});

// ==========================================
// CUSTOMER PAYMENT APIS (Saved Cards)
// ==========================================

// Check if customer exists by phone number
app.get('/api/customer/check', async (req, res) => {
  try {
    const { phone, merchantId } = req.query;
    if (!phone) {
      return res.status(400).json({ error: 'Phone number required' });
    }
    
    console.log('🔍 Checking customer with phone:', phone, 'merchantId:', merchantId);
    
    // Check local DB with merchantId
    // Note: Customers are stored on PLATFORM account, scoped by merchantId in our DB
    let customer = db.getCustomerByPhone(phone, merchantId);
    
    // If not in local DB, search Stripe platform account
    if (!customer) {
      console.log('🔍 Customer not in local DB, checking Stripe platform...');
      const stripeCustomers = await stripe.customers.search({
        query: `phone:'${phone}'`,
      });
      
      if (stripeCustomers.data.length > 0) {
        const stripeCustomer = stripeCustomers.data[0];
        console.log('✅ Found customer in Stripe:', stripeCustomer.id);
        
        // Get payment methods from platform account
        const paymentMethods = await stripe.paymentMethods.list({
          customer: stripeCustomer.id,
          type: 'card',
        });
        
        if (paymentMethods.data.length > 0) {
          const card = paymentMethods.data[0].card;
          
          // Save to local DB for faster future lookups
          customer = db.createOrUpdateCustomer(
            phone,
            stripeCustomer.id,
            card.last4,
            card.brand,
            merchantId,
            null  // stripeAccountId - always null for platform accounts
          );
          
          console.log('✅ Customer restored to local DB');
        }
      }
    }
    
    if (customer) {
      console.log('✅ Customer exists with card ending in', customer.last4);
      res.json({
        exists: true,
        customer: {
          phoneNumber: customer.phoneNumber,
          last4: customer.last4,
          cardBrand: customer.cardBrand
        }
      });
    } else {
      console.log('❌ Customer not found');
      res.json({ exists: false });
    }
  } catch (error) {
    console.error('Check customer error:', error);
    res.status(500).json({ error: 'Failed to check customer' });
  }
});

// Save new customer card and process payment
app.post('/api/customer/save-and-pay', async (req, res) => {
  try {
    const { phone, paymentMethodId, sessionId, amount, currency, merchantId } = req.body;
    
    if (!phone || !paymentMethodId || !amount) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    
    // Get merchant's Stripe Connect account
    let stripeAccountId = null;
    if (merchantId) {
      const merchantStripe = db.getMerchantStripeAccount(merchantId);
      if (merchantStripe && merchantStripe.stripeAccountId) {
        stripeAccountId = merchantStripe.stripeAccountId;
        console.log(`🔗 Using merchant's connected account: ${stripeAccountId}`);
      }
    }
    
    // ALWAYS create customer on PLATFORM account (not connected account)
    // This is the correct Stripe Connect pattern for Direct Charges
    const stripeCustomer = await stripe.customers.create({
      phone,
      payment_method: paymentMethodId,
      invoice_settings: {
        default_payment_method: paymentMethodId,
      },
    });
    
    console.log(`✅ Customer created on platform: ${stripeCustomer.id}`);
    
    // Attach payment method to platform customer
    await stripe.paymentMethods.attach(paymentMethodId, {
      customer: stripeCustomer.id,
    });
    
    console.log(`✅ Payment method attached: ${paymentMethodId}`);
    
    // Create payment intent using Direct Charges pattern
    // Customer and PM on platform, but payment goes to connected account
    const paymentIntentOptions = {
      amount: Math.round(amount * 100),
      currency: currency || 'usd',
      customer: stripeCustomer.id,
      payment_method: paymentMethodId,
      confirm: true,
      setup_future_usage: 'off_session',
    };
    
    // If merchant has connected account, use Direct Charges
    if (stripeAccountId) {
      paymentIntentOptions.transfer_data = {
        destination: stripeAccountId,
      };
      paymentIntentOptions.application_fee_amount = Math.round(amount * 100 * 0.01); // 1% platform fee
      console.log(`🔗 Creating Direct Charge to connected account: ${stripeAccountId}`);
    }
    
    const paymentIntent = await stripe.paymentIntents.create(paymentIntentOptions);
    
    // Get card details
    const paymentMethod = await stripe.paymentMethods.retrieve(paymentMethodId);
    
    // Save customer to database with merchantId and stripeAccountId
    db.createOrUpdateCustomer(
      phone,
      stripeCustomer.id,
      paymentMethod.card.last4,
      paymentMethod.card.brand,
      merchantId,
      null  // Always null - customers on platform
    );
    
    // Save transaction to database
    if (merchantId) {
      db.createTransaction(merchantId, {
        amount: parseFloat(amount),
        currency: (currency || 'usd').toUpperCase(),
        status: 'completed',
        paymentIntentId: paymentIntent.id,
        customerPhone: phone,
        customerEmail: req.body.customerEmail || null,
        last4: paymentMethod.card.last4,
        cardBrand: paymentMethod.card.brand,
        location: req.body.location || null
      });
      console.log('✅ Transaction saved to database');
    }
    
    // Mark session as completed
    if (paymentSessions.has(sessionId)) {
      const session = paymentSessions.get(sessionId);
      session.status = 'completed';
      session.paymentIntentId = paymentIntent.id;
      paymentSessions.set(sessionId, session);
    }
    
    console.log('✅ New customer card saved and payment completed:', phone);
    
    res.json({
      success: true,
      paymentIntentId: paymentIntent.id
    });
  } catch (error) {
    console.error('Save and pay error:', error);
    res.status(400).json({ error: error.message || 'Payment failed' });
  }
});

// Pay with saved card - no CVC needed for returning customers
app.post('/api/customer/pay-with-saved', async (req, res) => {
  try {
    const { phone, sessionId, amount, currency, merchantId } = req.body;
    
    if (!phone || !amount) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    
    console.log('💳 Processing payment for returning customer:', phone);
    
    // Get merchant's Stripe Connect account
    let stripeAccountId = null;
    if (merchantId) {
      const merchantStripe = db.getMerchantStripeAccount(merchantId);
      if (merchantStripe && merchantStripe.stripeAccountId) {
        stripeAccountId = merchantStripe.stripeAccountId;
        console.log(`🔗 Using merchant's connected account: ${stripeAccountId}`);
      }
    }
    
    // Get customer from database with merchantId
    const customer = db.getCustomerByPhone(phone, merchantId);
    if (!customer) {
      return res.status(404).json({ error: 'Customer not found' });
    }
    
    // Get customer's payment methods from platform Stripe account
    const paymentMethods = await stripe.paymentMethods.list({
      customer: customer.stripeCustomerId,
      type: 'card',
    });
    
    if (paymentMethods.data.length === 0) {
      return res.status(400).json({ error: 'No saved payment method found' });
    }
    
    const paymentMethodId = paymentMethods.data[0].id;
    
    // Create payment intent using Direct Charges pattern
    const paymentIntentOptions = {
      amount: Math.round(amount * 100),
      currency: currency || 'usd',
      customer: customer.stripeCustomerId,
      payment_method: paymentMethodId,
      off_session: true,
      confirm: true
    };
    
    // If merchant has connected account, use Direct Charges
    if (stripeAccountId) {
      paymentIntentOptions.transfer_data = {
        destination: stripeAccountId,
      };
      paymentIntentOptions.application_fee_amount = Math.round(amount * 100 * 0.01); // 1% platform fee
      console.log(`🔗 Creating Direct Charge to connected account: ${stripeAccountId}`);
    }
    
    const paymentIntent = await stripe.paymentIntents.create(paymentIntentOptions);
    
    // Get card details for transaction record
    const paymentMethod = await stripe.paymentMethods.retrieve(paymentMethodId);
    
    // Save transaction to database
    if (merchantId) {
      db.createTransaction(merchantId, {
        amount: parseFloat(amount),
        currency: (currency || 'usd').toUpperCase(),
        status: 'completed',
        paymentIntentId: paymentIntent.id,
        customerPhone: phone,
        customerEmail: req.body.customerEmail || null,
        last4: paymentMethod.card.last4,
        cardBrand: paymentMethod.card.brand,
        location: req.body.location || null
      });
      console.log('✅ Transaction saved to database');
    }
    
    // Mark session as completed
    if (paymentSessions.has(sessionId)) {
      const session = paymentSessions.get(sessionId);
      session.status = 'completed';
      session.paymentIntentId = paymentIntent.id;
      paymentSessions.set(sessionId, session);
    }
    
    console.log('✅ Payment completed with saved card:', phone);
    
    res.json({
      success: true,
      paymentIntentId: paymentIntent.id
    });
  } catch (error) {
    console.error('Pay with saved card error:', error);
    res.status(400).json({ error: error.message || 'Payment failed' });
  }
});

// ==========================================
// RECEIPT ENDPOINTS
// ==========================================

// Get receipt data for a transaction
app.get('/api/merchant/receipt/:transactionId', requireAuth, (req, res) => {
  try {
    const { transactionId } = req.params;
    const transaction = db.getTransactionById(req.merchantId, transactionId);
    
    if (!transaction) {
      return res.status(404).json({ error: 'Transaction not found' });
    }
    
    const merchantSettings = db.getMerchantSettings(req.merchantId);
    
    // Generate receipt HTML
    const receiptHtml = generateReceiptHtml(transaction, merchantSettings);
    
    res.json({
      transaction,
      merchantSettings,
      receiptHtml
    });
  } catch (error) {
    console.error('Error fetching receipt:', error);
    res.status(500).json({ error: 'Failed to fetch receipt' });
  }
});

// Send receipt via email
app.post('/api/merchant/receipt/:transactionId/send', requireAuth, async (req, res) => {
  try {
    const { transactionId } = req.params;
    const { email } = req.body;
    
    if (!email) {
      return res.status(400).json({ error: 'Email address required' });
    }
    
    const transaction = db.getTransactionById(req.merchantId, transactionId);
    
    if (!transaction) {
      return res.status(404).json({ error: 'Transaction not found' });
    }
    
    const merchantSettings = db.getMerchantSettings(req.merchantId);
    
    // Check if Resend is configured
    if (!resend || !process.env.RESEND_API_KEY || process.env.RESEND_API_KEY === 're_YourResendAPIKeyHere') {
      console.log(`📧 Email not configured - Would send receipt for transaction ${transactionId} to ${email}`);
      console.log(`Receipt for ${merchantSettings.businessName} - $${transaction.amount} ${transaction.currency}`);
      
      return res.json({ 
        success: true, 
        message: `Receipt preview ready (email not configured yet)`,
        note: 'To enable email sending: Sign up at resend.com and add RESEND_API_KEY to your environment variables'
      });
    }
    
    // Generate receipt HTML
    const receiptHtml = generateReceiptHtml(transaction, merchantSettings);
    
    // Send email via Resend
    const fromEmail = process.env.RECEIPT_FROM_EMAIL || 'receipts@eztranz.com';
    const result = await resend.emails.send({
      from: fromEmail,
      to: email,
      subject: `Payment Receipt from ${merchantSettings.businessName || 'EZ TRANZ'}`,
      html: receiptHtml
    });
    
    console.log(`✅ Receipt sent successfully to ${email} - Email ID: ${result.id}`);
    
    res.json({ 
      success: true, 
      message: `Receipt sent to ${email}`,
      emailId: result.id
    });
  } catch (error) {
    console.error('❌ Error sending receipt:', error);
    
    // Provide helpful error messages
    let errorMessage = 'Failed to send receipt';
    if (error.message && error.message.includes('API key')) {
      errorMessage = 'Email service not configured correctly. Please check your RESEND_API_KEY.';
    } else if (error.message) {
      errorMessage = error.message;
    }
    
    res.status(500).json({ error: errorMessage });
  }
});

// Generate receipt HTML
function generateReceiptHtml(transaction, merchantSettings) {
  const currencySymbols = {
    USD: '$', EUR: '€', GBP: '£', NGN: '₦', INR: '₹', 
    JPY: '¥', CAD: 'C$', AUD: 'A$', BRL: 'R$', ZAR: 'R'
  };
  const symbol = currencySymbols[transaction.currency] || transaction.currency + ' ';
  
  const date = new Date(transaction.createdAt).toLocaleString();
  
  // Location map embed
  let locationHtml = '';
  if (transaction.location && transaction.location.latitude && transaction.location.longitude) {
    const { latitude, longitude } = transaction.location;
    const googleMapsKey = process.env.GOOGLE_MAPS_API_KEY || 'YOUR_GOOGLE_MAPS_API_KEY';
    const mapUrl = `https://www.google.com/maps/embed/v1/place?key=${googleMapsKey}&q=${latitude},${longitude}&zoom=15`;
    const linkUrl = `https://www.google.com/maps?q=${latitude},${longitude}`;
    
    locationHtml = `
      <div style="margin-top: 24px; padding-top: 24px; border-top: 2px dashed #e5e7eb;">
        <h3 style="font-size: 14px; font-weight: 600; color: #374151; margin-bottom: 12px;">📍 Transaction Location</h3>
        <div style="border-radius: 12px; overflow: hidden; margin-bottom: 12px; border: 2px solid #e5e7eb;">
          <iframe 
            width="100%" 
            height="200" 
            frameborder="0" 
            style="border:0; display: block;" 
            src="${mapUrl}" 
            allowfullscreen>
          </iframe>
        </div>
        <p style="font-size: 12px; color: #6b7280; text-align: center;">
          <a href="${linkUrl}" target="_blank" style="color: #6366f1; text-decoration: none;">View on Google Maps</a>
        </p>
      </div>
    `;
  }
  
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Receipt - ${merchantSettings.businessName}</title>
      <style>
        @media print {
          body { margin: 0; padding: 20px; }
          .no-print { display: none; }
        }
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          max-width: 600px;
          margin: 0 auto;
          padding: 40px 20px;
          background: #f9fafb;
        }
        .receipt {
          background: white;
          padding: 40px;
          border-radius: 16px;
          box-shadow: 0 4px 12px rgba(0,0,0,0.1);
        }
        .logo {
          text-align: center;
          margin-bottom: 24px;
        }
        .logo img {
          max-width: 200px;
          max-height: 80px;
          border-radius: 8px;
        }
        .business-name {
          font-size: 24px;
          font-weight: 700;
          text-align: center;
          color: #1f2937;
          margin-bottom: 8px;
        }
        .business-info {
          text-align: center;
          font-size: 14px;
          color: #6b7280;
          margin-bottom: 32px;
        }
        .receipt-title {
          font-size: 18px;
          font-weight: 600;
          text-align: center;
          color: #374151;
          margin-bottom: 24px;
          padding-bottom: 16px;
          border-bottom: 2px solid #e5e7eb;
        }
        .detail-row {
          display: flex;
          justify-content: space-between;
          padding: 12px 0;
          border-bottom: 1px solid #f3f4f6;
        }
        .detail-label {
          font-size: 14px;
          color: #6b7280;
        }
        .detail-value {
          font-size: 14px;
          color: #1f2937;
          font-weight: 600;
        }
        .amount-row {
          margin-top: 16px;
          padding: 16px;
          background: linear-gradient(135deg, ${merchantSettings.primaryColor || '#6366f1'} 0%, ${merchantSettings.secondaryColor || '#8b5cf6'} 100%);
          border-radius: 12px;
        }
        .amount-row .detail-label,
        .amount-row .detail-value {
          color: white;
          font-size: 18px;
          font-weight: 700;
        }
        .footer {
          margin-top: 32px;
          padding-top: 24px;
          border-top: 2px dashed #e5e7eb;
          text-align: center;
          font-size: 14px;
          color: #6b7280;
          line-height: 1.6;
        }
        .actions {
          margin-top: 32px;
          text-align: center;
          display: flex;
          gap: 12px;
          justify-content: center;
        }
        .btn {
          padding: 12px 24px;
          border: none;
          border-radius: 8px;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
        }
        .btn-primary {
          background: linear-gradient(135deg, ${merchantSettings.primaryColor || '#6366f1'} 0%, ${merchantSettings.secondaryColor || '#8b5cf6'} 100%);
          color: white;
        }
        .btn-secondary {
          background: white;
          color: #374151;
          border: 2px solid #e5e7eb;
        }
        .btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(0,0,0,0.1);
        }
      </style>
    </head>
    <body>
      <div class="receipt">
        ${merchantSettings.logoUrl ? `<div class="logo"><img src="${merchantSettings.logoUrl}" alt="${merchantSettings.businessName}"></div>` : ''}
        <div class="business-name">${merchantSettings.businessName || 'EZ TRANZ'}</div>
        <div class="business-info">
          ${merchantSettings.address ? merchantSettings.address + '<br>' : ''}
          ${merchantSettings.phone ? merchantSettings.phone + '<br>' : ''}
          ${merchantSettings.businessEmail || ''}
        </div>
        
        <div class="receipt-title">PAYMENT RECEIPT</div>
        
        <div class="detail-row">
          <span class="detail-label">Date & Time</span>
          <span class="detail-value">${date}</span>
        </div>
        
        <div class="detail-row">
          <span class="detail-label">Transaction ID</span>
          <span class="detail-value">${transaction.id}</span>
        </div>
        
        ${transaction.customerPhone ? `
        <div class="detail-row">
          <span class="detail-label">Customer Phone</span>
          <span class="detail-value">${transaction.customerPhone}</span>
        </div>
        ` : ''}
        
        ${transaction.last4 ? `
        <div class="detail-row">
          <span class="detail-label">Payment Method</span>
          <span class="detail-value">${transaction.cardBrand || 'Card'} •••• ${transaction.last4}</span>
        </div>
        ` : ''}
        
        <div class="amount-row detail-row">
          <span class="detail-label">Amount Paid</span>
          <span class="detail-value">${symbol}${transaction.amount.toFixed(2)}</span>
        </div>
        
        ${locationHtml}
        
        <div class="footer">
          ${merchantSettings.receiptFooter || 'Thank you for your business!'}
        </div>
      </div>
      
      <div class="actions no-print">
        <button class="btn btn-primary" onclick="window.print()">🖨️ Print Receipt</button>
        <button class="btn btn-secondary" onclick="window.close()">Close</button>
      </div>
    </body>
    </html>
  `;
}

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    app: 'EZ TRANZ',
    security: 'enabled',
    limits: TRANSACTION_LIMITS
  });
});

// Diagnostic endpoint to check configuration (only for authenticated merchants)
app.get('/api/merchant/diagnostics', requireAuth, (req, res) => {
  res.json({
    features: {
      email: {
        configured: !!resend && !!process.env.RESEND_API_KEY && process.env.RESEND_API_KEY !== 're_YourResendAPIKeyHere',
        hasApiKey: !!process.env.RESEND_API_KEY,
        fromEmail: process.env.RECEIPT_FROM_EMAIL || 'receipts@eztranz.com'
      },
      googleMaps: {
        configured: !!process.env.GOOGLE_MAPS_API_KEY && process.env.GOOGLE_MAPS_API_KEY !== 'your_google_maps_api_key_here' && process.env.GOOGLE_MAPS_API_KEY !== 'YOUR_GOOGLE_MAPS_API_KEY',
        hasApiKey: !!process.env.GOOGLE_MAPS_API_KEY
      },
      gpsLocation: {
        enabled: true,
        captureMethod: 'Browser Geolocation API'
      }
    },
    timestamp: new Date().toISOString()
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
