# Stripe Connect Implementation Status

## ✅ COMPLETED - Phase 1: Foundation

### Database Schema Updated
- ✅ Added `stripeAccountId` field to merchant records
- ✅ Added `stripeAccountStatus` field (not_connected | pending | connected)
- ✅ Created `updateMerchantStripeAccount()` function
- ✅ Created `getMerchantStripeAccount()` function
- ✅ Exported new functions from mockDatabase module

### Documentation Created
- ✅ Complete `STRIPE_CONNECT_GUIDE.md` with step-by-step setup instructions
- ✅ Updated `.env.example` with Stripe Connect variables
- ✅ Explained OAuth flow and payment routing

---

## 🚧 TODO - Phase 2: Backend Implementation

To complete Stripe Connect, you need to:

### 1. Set Up Stripe Connect Application
**Action Required:** Go to Stripe Dashboard and create Connect app
- URL: https://dashboard.stripe.com/settings/applications
- Get your `STRIPE_CLIENT_ID` (starts with `ca_`)
- Configure redirect URIs

### 2. Add Environment Variables
Add to your `.env` file (and Render environment variables):
```bash
STRIPE_CLIENT_ID=ca_your_actual_client_id
APP_URL=https://your-app.onrender.com
FRONTEND_URL=https://your-app.onrender.com
```

### 3. Implement OAuth Endpoints (Code Ready to Add)

Add these endpoints to `server.js`:

```javascript
// ==========================================
// STRIPE CONNECT ENDPOINTS
// ==========================================

// Get Stripe Connect OAuth URL
app.get('/api/stripe/connect-url', requireAuth, async (req, res) => {
  try {
    const state = req.merchantId; // Use merchant ID as state parameter
    
    const params = new URLSearchParams({
      response_type: 'code',
      client_id: process.env.STRIPE_CLIENT_ID,
      scope: 'read_write',
      redirect_uri: `${process.env.APP_URL}/api/stripe/callback`,
      state: state
    });
    
    const connectUrl = `https://connect.stripe.com/oauth/authorize?${params.toString()}`;
    
    res.json({ url: connectUrl });
  } catch (error) {
    console.error('Error generating connect URL:', error);
    res.status(500).json({ error: 'Failed to generate connect URL' });
  }
});

// Handle Stripe OAuth callback
app.get('/api/stripe/callback', async (req, res) => {
  try {
    const { code, state } = req.query;
    const merchantId = state;
    
    if (!code) {
      return res.redirect('/merchant-dashboard.html?error=no_code');
    }
    
    // Exchange authorization code for account ID
    const response = await stripe.oauth.token({
      grant_type: 'authorization_code',
      code: code,
    });
    
    const stripeAccountId = response.stripe_user_id;
    
    // Save to database
    db.updateMerchantStripeAccount(merchantId, stripeAccountId, 'connected');
    
    console.log(`✅ Merchant ${merchantId} connected Stripe account: ${stripeAccountId}`);
    
    // Redirect back to dashboard
    res.redirect('/merchant-dashboard.html?stripe_connected=success');
  } catch (error) {
    console.error('OAuth callback error:', error);
    res.redirect('/merchant-dashboard.html?error=connection_failed');
  }
});

// Get Stripe Connect status
app.get('/api/stripe/account-status', requireAuth, async (req, res) => {
  try {
    const stripeInfo = db.getMerchantStripeAccount(req.merchantId);
    res.json(stripeInfo);
  } catch (error) {
    console.error('Error getting account status:', error);
    res.status(500).json({ error: 'Failed to get status' });
  }
});

// Disconnect Stripe account
app.post('/api/stripe/disconnect', requireAuth, async (req, res) => {
  try {
    db.updateMerchantStripeAccount(req.merchantId, null, 'not_connected');
    res.json({ success: true });
  } catch (error) {
    console.error('Error disconnecting:', error);
    res.status(500).json({ error: 'Failed to disconnect' });
  }
});
```

### 4. Update Payment Processing

Modify payment endpoints to use merchant's Stripe account:

```javascript
// In /create-payment-session and payment endpoints
const merchantStripeInfo = db.getMerchantStripeAccount(merchantId);

if (!merchantStripeInfo || !merchantStripeInfo.stripeAccountId) {
  return res.status(400).json({ 
    error: 'Merchant has not connected Stripe account' 
  });
}

// Use connected account for payments
const paymentIntent = await stripe.paymentIntents.create({
  amount: Math.round(amount * 100),
  currency: currency,
  // ... other params
}, {
  stripeAccount: merchantStripeInfo.stripeAccountId // ← KEY PART
});
```

---

## 🎨 TODO - Phase 3: Frontend UI

### Add to Merchant Dashboard

1. **Create new tab: "Payment Setup"** or add to "Settings"
2. **Show connection status**
3. **Add "Connect with Stripe" button**

Sample UI code for `merchant-dashboard.html`:

```html
<!-- Add to navigation -->
<li class="nav-item">
    <a href="#" class="nav-link" data-tab="stripe-connect">
        <span>🔌</span><span>Payment Setup</span>
    </a>
</li>

<!-- Add new tab content -->
<div id="stripe-connect-tab" class="tab-content">
    <div class="settings-card">
        <h2 class="settings-title">Stripe Account Connection</h2>
        
        <!-- Not Connected State -->
        <div id="stripe-not-connected" style="display:none;">
            <p style="color: #6b7280; margin-bottom: 20px;">
                Connect your Stripe account to start receiving payments directly.
            </p>
            <button id="connect-stripe-btn" class="btn-primary">
                🔌 Connect with Stripe
            </button>
        </div>
        
        <!-- Connected State -->
        <div id="stripe-connected" style="display:none;">
            <div style="background: #d1fae5; padding: 16px; border-radius: 8px; margin-bottom: 16px;">
                <p style="color: #065f46; font-weight: 600;">✅ Stripe Account Connected</p>
                <p style="color: #065f46; font-size: 14px; margin-top: 8px;">
                    Account ID: <code id="stripe-account-id"></code>
                </p>
            </div>
            <button id="disconnect-stripe-btn" class="btn-primary" style="background: #ef4444;">
                Disconnect Stripe
            </button>
        </div>
    </div>
</div>
```

JavaScript to handle:

```javascript
// Check Stripe connection status
async function checkStripeConnection() {
    try {
        const response = await fetch('/api/stripe/account-status');
        const data = await response.json();
        
        if (data.stripeAccountId) {
            document.getElementById('stripe-connected').style.display = 'block';
            document.getElementById('stripe-not-connected').style.display = 'none';
            document.getElementById('stripe-account-id').textContent = data.stripeAccountId;
        } else {
            document.getElementById('stripe-connected').style.display = 'none';
            document.getElementById('stripe-not-connected').style.display = 'block';
        }
    } catch (error) {
        console.error('Error checking Stripe status:', error);
    }
}

// Connect Stripe button
document.getElementById('connect-stripe-btn').addEventListener('click', async () => {
    try {
        const response = await fetch('/api/stripe/connect-url');
        const data = await response.json();
        window.location.href = data.url; // Redirect to Stripe OAuth
    } catch (error) {
        console.error('Error connecting Stripe:', error);
    }
});

// Disconnect button
document.getElementById('disconnect-stripe-btn').addEventListener('click', async () => {
    if (!confirm('Are you sure you want to disconnect your Stripe account?')) return;
    
    try {
        await fetch('/api/stripe/disconnect', { method: 'POST' });
        await checkStripeConnection(); // Refresh status
    } catch (error) {
        console.error('Error disconnecting:', error);
    }
});

// Check on page load
checkStripeConnection();
```

---

## 🎯 Current State

**What Works Now:**
- ✅ Database ready to store Stripe account IDs
- ✅ Helper functions created
- ✅ Complete documentation provided

**What's Needed:**
- ⏳ Stripe Connect application setup (5 minutes)
- ⏳ Add environment variables (2 minutes)
- ⏳ Add OAuth endpoints to server.js (copy-paste ready)
- ⏳ Update payment processing (5 lines of code)
- ⏳ Add UI to dashboard (copy-paste ready)

**Estimated Time to Complete:** 30-45 minutes

---

## 🚀 Testing Plan

1. **Local Testing:**
   - Set up Connect app in Stripe test mode
   - Test OAuth flow
   - Create test payment with connected account

2. **Production Deployment:**
   - Update Render environment variables
   - Test with real Stripe account
   - Verify payments go to merchant's account

---

## 💡 Benefits After Implementation

- ✅ Each merchant uses their own Stripe account
- ✅ Payments go directly to merchants
- ✅ Professional OAuth flow (like Shopify, Uber)
- ✅ Optional platform fees capability
- ✅ Scalable to thousands of merchants
- ✅ **TRUE WORLD-CLASS MULTI-MERCHANT PLATFORM**

---

## 📞 Need Help?

Refer to:
- `STRIPE_CONNECT_GUIDE.md` - Complete setup guide
- [Stripe Connect Docs](https://stripe.com/docs/connect)
- [OAuth Reference](https://stripe.com/docs/connect/oauth-reference)

---

**Next Steps:** Follow the TODO items above to complete the implementation.
