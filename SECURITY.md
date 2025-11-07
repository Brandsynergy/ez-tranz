# 🔒 EZ TRANZ Security Features

## Overview
EZ TRANZ implements multiple layers of security to protect both merchants and customers from fraud and abuse.

---

## 🛡️ Implemented Security Features

### 1. **Rate Limiting**
- **Limit**: 10 requests per minute per IP address
- **Purpose**: Prevents brute force attacks and API abuse
- **Response**: Returns 429 error when limit exceeded
- **Auto-reset**: Every 60 seconds

### 2. **Transaction Amount Limits**
- **Minimum**: $0.50 per transaction
- **Maximum**: $999.99 per transaction  
- **Daily Limit**: $10,000 per day per IP address
- **Purpose**: Prevents accidental errors and fraudulent large transactions

### 3. **Security Headers**
All responses include security headers:
- `X-Content-Type-Options: nosniff` - Prevents MIME type sniffing
- `X-Frame-Options: DENY` - Prevents clickjacking
- `X-XSS-Protection` - Enables XSS filtering
- `Referrer-Policy` - Controls referrer information
- `Strict-Transport-Security` - Forces HTTPS in production

### 4. **HTTPS Enforcement**
- Automatically redirects HTTP to HTTPS in production
- All data transmitted over encrypted connections
- SSL/TLS certificates managed by Render

### 5. **Stripe Webhook Verification**
- Verifies all payment confirmations using cryptographic signatures
- Prevents fake payment notifications
- Ensures payment integrity
- Endpoint: `/webhook`

### 6. **Request Logging**
- Logs all API requests with:
  - Timestamp
  - IP address
  - HTTP method
  - Request path
- Useful for security monitoring and fraud detection

### 7. **Input Validation**
- Validates all transaction amounts
- Sanitizes user input
- Prevents injection attacks
- Type checking on all parameters

### 8. **Session Management**
- Payment sessions auto-expire after 1 hour
- Automatic cleanup of old sessions
- Prevents memory leaks
- Tracks session status securely

---

## 🔧 Configuration

### Environment Variables Required:

```env
# Stripe Keys (Required)
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Environment
NODE_ENV=production
PORT=3000
```

### Customizing Limits

Edit these values in `server.js`:

```javascript
const TRANSACTION_LIMITS = {
  MIN_AMOUNT: 0.50,      // Minimum transaction
  MAX_AMOUNT: 999.99,    // Maximum per transaction
  DAILY_LIMIT: 10000     // Maximum per day per IP
};
```

---

## 📊 Security Monitoring

### What to Monitor:
1. **Rate limit warnings** in logs - May indicate attack attempts
2. **Daily limit exceeded** - Possible fraud or legitimate high volume
3. **Failed webhook verifications** - Potential security breach
4. **Unusual IP patterns** - Geographic anomalies

### Log Examples:

```
✅ Creating payment session for amount: 25 usd
⚠️  Rate limit exceeded for IP: 192.168.1.1
📊 Daily total for 192.168.1.1-Fri Nov 07 2025: $1250.00
✅ Payment successful for session: cs_test_...
💵 Amount: $25.00
```

---

## 🚨 Incident Response

### If you suspect fraud:

1. **Check Render logs** for suspicious patterns
2. **Review Stripe dashboard** for unusual transactions
3. **Temporarily lower limits** in `server.js` if needed
4. **Contact Stripe support** for chargebacks
5. **Update webhook secret** if compromised

---

## 🔐 Best Practices

### For Merchants:
1. ✅ Keep Stripe keys secret - Never share them
2. ✅ Use test mode keys for testing
3. ✅ Switch to live mode keys only when ready
4. ✅ Monitor your Stripe dashboard daily
5. ✅ Review Render logs regularly
6. ✅ Set up email alerts in Stripe for large transactions

### For Going Live:
1. ✅ Complete Stripe verification
2. ✅ Switch to live Stripe keys
3. ✅ Configure webhook with live endpoint
4. ✅ Test with small real transaction
5. ✅ Monitor first few days closely
6. ✅ Have customer support contact ready

---

## 🆘 Troubleshooting

### Common Issues:

**"Rate limit exceeded"**
- Wait 60 seconds and try again
- This is normal security behavior

**"Daily limit reached"**
- Limit resets at midnight (server time)
- Adjust `DAILY_LIMIT` if needed for your business

**"Webhook verification failed"**
- Check `STRIPE_WEBHOOK_SECRET` is correct
- Verify webhook endpoint in Stripe dashboard
- Ensure webhook is pointing to: `https://ez-tranz.onrender.com/webhook`

**"Transaction amount too low/high"**
- Adjust limits in `TRANSACTION_LIMITS`
- Current min: $0.50, max: $999.99

---

## 📈 Future Enhancements

Consider adding:
- [ ] Merchant authentication (login system)
- [ ] Transaction history database
- [ ] Email receipts
- [ ] Multi-currency support
- [ ] IP whitelisting for specific locations
- [ ] Two-factor authentication
- [ ] Real-time fraud detection
- [ ] Analytics dashboard

---

## 📞 Support

- **Stripe Docs**: https://stripe.com/docs/security
- **Render Docs**: https://render.com/docs/security
- **Report Security Issues**: Contact Stripe support immediately

---

**Last Updated**: November 7, 2025  
**Security Level**: Production-Ready ✅
