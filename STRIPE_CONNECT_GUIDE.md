# Stripe Connect Implementation Guide

## 🎯 Overview

This guide explains how to set up **Stripe Connect** for EZ TRANZ, enabling each merchant to use their own Stripe account for payments.

## 📋 Prerequisites

Before implementing Stripe Connect, you need:

1. **Platform Stripe Account** - This is YOUR Stripe account (the platform owner)
2. **Stripe Connect Application** - Created in your Stripe Dashboard
3. **OAuth Credentials** - Client ID from Stripe Connect

---

## 🔧 Step 1: Set Up Stripe Connect Application

### 1.1 Create Connect Application

1. Go to: https://dashboard.stripe.com/settings/applications
2. Click **"+ New"** to create a new Connect application
3. Fill in the details:
   - **Application name**: EZ TRANZ
   - **Type**: Standard (recommended) or Express
   - **Redirect URIs**: Add these:
     - Development: `http://localhost:3000/api/stripe/callback`
     - Production: `https://your-app.onrender.com/api/stripe/callback`
4. Click **"Create application"**

### 1.2 Get Your Credentials

After creating the application, you'll see:
- **Client ID** (starts with `ca_...`)
- **Publishable Key** (starts with `pk_live_...` or `pk_test_...`)
- **Secret Key** (starts with `sk_live_...` or `sk_test_...`)

**Save these - you'll need them!**

---

## 🔑 Step 2: Update Environment Variables

Update your `.env` file with the following:

```bash
# Platform Stripe Keys (YOUR account - for Connect platform)
STRIPE_SECRET_KEY=sk_test_your_platform_secret_key_here
STRIPE_PUBLISHABLE_KEY=pk_test_your_platform_publishable_key_here

# Stripe Connect OAuth
STRIPE_CLIENT_ID=ca_your_client_id_here

# Application URLs
APP_URL=http://localhost:3000  # Change to your production URL
FRONTEND_URL=http://localhost:3000  # Same as above

# Server Configuration
PORT=3000
NODE_ENV=development  # Change to 'production' when deployed
```

---

## 💻 Step 3: Understand the Flow

### How Stripe Connect Works:

```
1. Merchant clicks "Connect with Stripe" in dashboard
   ↓
2. Redirected to Stripe OAuth page
   ↓
3. Merchant logs into Stripe (or creates account)
   ↓
4. Merchant authorizes your platform
   ↓
5. Stripe redirects back to your callback URL with authorization code
   ↓
6. Your server exchanges code for Stripe Account ID
   ↓
7. Save Stripe Account ID to merchant's record
   ↓
8. ✅ Merchant's payments now go to their account!
```

---

## 🏗️ Step 4: Implementation (Already Done)

The following has been implemented in the codebase:

### 4.1 Database Schema ✅
- Added `stripeAccountId` to merchant records
- Added `stripeAccountStatus` (not_connected, pending, connected)

### 4.2 API Endpoints (To Be Added)
- `GET /api/stripe/connect-url` - Generate OAuth URL for merchant
- `GET /api/stripe/callback` - Handle OAuth callback from Stripe
- `GET /api/stripe/account-status` - Check merchant's connection status
- `POST /api/stripe/disconnect` - Allow merchant to disconnect

### 4.3 Payment Processing (To Be Updated)
- All payment endpoints will use merchant's Stripe Account ID
- Platform can optionally take application fees

---

## 🎨 Step 5: User Interface

### Dashboard - Stripe Connect Status

Merchants will see one of these states:

**1. Not Connected:**
```
┌─────────────────────────────────────────┐
│ 🔌 Connect Your Stripe Account          │
│                                          │
│ Connect your Stripe account to receive  │
│ payments directly.                       │
│                                          │
│  [Connect with Stripe] ← Blue Button    │
└─────────────────────────────────────────┘
```

**2. Connected:**
```
┌─────────────────────────────────────────┐
│ ✅ Stripe Connected                      │
│                                          │
│ Account: acct_xxxxxxxxxxxxx              │
│ Status: Active                           │
│                                          │
│  [Disconnect]  [View on Stripe]          │
└─────────────────────────────────────────┘
```

---

## 💰 Step 6: Payment Flow with Connect

### Before Connect (Current):
```
Customer → EZ TRANZ Platform Stripe → Platform Owner
```

### After Connect (World-Class):
```
Customer → Merchant's Stripe Account → Merchant
                     ↓
            (Optional) Platform Fee → Platform Owner
```

---

## 🔒 Step 7: Security Considerations

### Best Practices:
1. **Never share Stripe Secret Keys** between merchants
2. **Use HTTPS** in production (Render provides this)
3. **Validate webhook signatures** from Stripe
4. **Store Account IDs securely** in encrypted database
5. **Implement proper session management**

---

## 🧪 Step 8: Testing

### Test Mode:
1. Use test API keys from Stripe
2. Create test Connect account
3. Use test cards: `4242 4242 4242 4242`

### Live Mode:
1. Complete Stripe account verification
2. Switch to live API keys
3. Update environment variables in Render

---

## 📊 Step 9: Platform Fees (Optional)

If you want to charge a fee for your platform:

```javascript
// In payment intent creation
const paymentIntent = await stripe.paymentIntents.create({
  amount: 10000, // $100.00
  currency: 'usd',
  application_fee_amount: 500, // $5.00 platform fee (5%)
}, {
  stripeAccount: merchantStripeAccountId // Route to merchant
});
```

**Fee Options:**
- Percentage: 2.5% - 5% per transaction
- Fixed: $0.50 per transaction
- Hybrid: $0.30 + 2.9% (like Stripe)

---

## 🚀 Step 10: Deployment Checklist

Before going live:

- [ ] Stripe Connect application created
- [ ] OAuth redirect URLs configured (dev + prod)
- [ ] Environment variables set in Render
- [ ] Database supports stripeAccountId field
- [ ] Connect UI added to merchant dashboard
- [ ] Payment processing updated to use connected accounts
- [ ] Webhooks configured and tested
- [ ] Error handling for disconnected accounts
- [ ] Documentation updated for merchants

---

## 📚 Additional Resources

- [Stripe Connect Docs](https://stripe.com/docs/connect)
- [OAuth Flow Guide](https://stripe.com/docs/connect/oauth-reference)
- [Testing Connect](https://stripe.com/docs/connect/testing)
- [Account Types](https://stripe.com/docs/connect/accounts)

---

## 🆘 Common Issues

### Issue: "Invalid client_id"
**Solution:** Double-check your Client ID starts with `ca_` and is from Stripe Dashboard

### Issue: "Redirect URI mismatch"
**Solution:** Ensure redirect URI in Stripe matches exactly (including http/https)

### Issue: "Payment fails after connecting"
**Solution:** Verify merchant's Stripe account is fully activated and verified

---

## 📝 Next Steps

1. **Set up Stripe Connect application** in your Stripe Dashboard
2. **Add OAuth endpoints** to server.js (next commit)
3. **Update dashboard UI** with Connect button
4. **Test with test account**
5. **Deploy to production**

---

**Need Help?** Contact Stripe Support or refer to their excellent documentation.

This implementation will make EZ TRANZ a **true world-class multi-merchant platform**! 🌟
