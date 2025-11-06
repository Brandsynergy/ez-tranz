require('dotenv').config();
const express = require('express');
const cors = require('cors');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Store active payment sessions in memory
const paymentSessions = new Map();

// Create payment session and return URL for QR code
app.post('/create-payment-session', async (req, res) => {
  try {
    const { amount, currency = 'usd' } = req.body;

    if (!amount || amount <= 0) {
      return res.status(400).json({ error: 'Invalid amount' });
    }

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

    // Store session for status checking
    paymentSessions.set(session.id, {
      amount,
      status: 'pending',
      created: Date.now(),
    });

    res.json({
      sessionId: session.id,
      paymentUrl: session.url,
    });
  } catch (error) {
    console.error('Error creating payment session:', error);
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

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', app: 'EZ TRANZ' });
});

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
