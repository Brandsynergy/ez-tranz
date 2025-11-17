# EZ TRANZ - Complete Feature Documentation

**Version:** 2.0  
**Last Updated:** November 17, 2025  
**Status:** Production Ready ✅

## 🎯 Core Features

### 1. Mobile Payment Terminal
- QR code generation for customer payments
- Multi-currency support (15 currencies)
- Dynamic amount validation per currency
- Real-time payment status polling
- Stripe integration for payment processing

### 2. Customer Experience
- **Phone Number Recognition**: Returning customers identified by phone
- **One-Tap Payment**: Saved cards for instant checkout (no CVC needed)
- **Card Saving**: Secure card storage via Stripe
- **Receipt Sharing**: WhatsApp, Email, SMS sharing options
- **Clean Success Screen**: Premium, uncluttered design

### 3. Security & Fraud Prevention

#### Location Tracking (3-Tier System)
1. **GPS First**: Attempts precise GPS location (5 seconds)
2. **IP Fallback**: Uses IP geolocation (always works)
3. **VPN Detection**: Flags suspicious VPN/proxy connections

**Location Data Captured:**
- City, Region, Country
- Network Provider (ISP)
- VPN/Proxy indicators
- Latitude/Longitude (when available)

#### VPN/Proxy Detection
- Detects: VPN services, hosting providers, datacenters, proxies, cloud platforms
- Flags transactions for manual review
- Shows warning to customer during payment
- Displays ISP organization name on receipts

**Detection Keywords:**
- "vpn", "proxy", "hosting", "datacenter", "cloud"

### 4. Merchant Dashboard

#### Transaction Management
- View all transactions with status
- Filter and search capabilities
- Transaction details modal
- Reset transaction history

#### Receipt System
- **Print receipts**: Mobile-optimized printing
- **Email receipts**: Via Resend API
- **Branded receipts**: Merchant logo and colors
- **Location display**: GPS map or IP location with ISP

#### Branding Customization
- Business name
- Logo upload (with automatic sizing)
- Primary and secondary colors
- Receipt footer customization
- Phone, email, address

#### Bank Account Management
- Add/remove payout accounts
- Default account selection
- Account verification display

### 5. Stripe Connect Integration
- Direct charges to merchant accounts
- Platform fee collection
- Automatic payout handling
- Test and live mode support

## 🗂️ File Structure

```
mobile-payment-terminal/
├── server.js                 # Main Express server
├── mockDatabase.js           # In-memory database
├── package.json              # Dependencies
├── .env                      # Environment variables
├── public/
│   ├── index.html           # Payment terminal UI
│   ├── pay.html             # Customer payment page
│   ├── merchant-dashboard.html # Merchant dashboard
│   ├── merchant-login.html  # Merchant login
│   ├── app.js               # Frontend JavaScript
│   ├── styles.css           # Global styles
│   ├── manifest.json        # PWA manifest
│   └── sw.js                # Service worker
└── FEATURES.md              # This file
```

## 🔧 Environment Variables

### Required
```env
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PUBLISHABLE_KEY=pk_test_...
SESSION_SECRET=your-random-secret-key
```

### Optional (Email & Location)
```env
RESEND_API_KEY=re_...
RECEIPT_FROM_EMAIL=receipts@yourdomain.com
GOOGLE_MAPS_API_KEY=AIza...
```

### Optional (Production)
```env
NODE_ENV=production
PORT=3000
```

## 📊 Database Schema

### Merchants
```javascript
{
  id: string,
  email: string,
  password: string (hashed),
  businessName: string,
  phone: string,
  address: string,
  logoUrl: string,
  primaryColor: string,
  secondaryColor: string,
  receiptFooter: string,
  stripeAccountId: string,
  createdAt: string
}
```

### Transactions
```javascript
{
  id: string,
  merchantId: string,
  amount: number,
  currency: string,
  status: 'pending' | 'completed' | 'failed',
  customerPhone: string,
  paymentMethod: string,
  last4: string,
  cardBrand: string,
  location: {
    type: 'ip' | 'gps',
    city: string,
    region: string,
    country: string,
    latitude: number,
    longitude: number,
    ip: string,
    org: string,
    isVPN: boolean,
    timestamp: string
  },
  createdAt: string
}
```

### Customers
```javascript
{
  phone: string,
  merchantId: string,
  stripeCustomerId: string,
  paymentMethodId: string,
  last4: string,
  cardBrand: string,
  createdAt: string
}
```

## 🛡️ Security Features

### Transaction Limits
- Minimum: $0.50 (varies by currency)
- Maximum: $999,999.99 per transaction
- Daily limit: $10,000 per IP address

### Rate Limiting
- 10 requests per minute per IP
- Prevents abuse and DDoS attacks

### Payment Security
- HTTPS enforcement in production
- Security headers (HSTS, XSS Protection, etc.)
- Stripe's PCI compliance
- No card data stored locally

### Session Management
- HTTP-only session cookies
- Secure cookie flag in production
- Session-based merchant authentication

## 🎨 Design System

### Colors
```css
--brand-primary: #6366f1 (Indigo)
--brand-secondary: #8b5cf6 (Purple)
```

### Typography
- Font: System fonts (-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto)
- Headings: 700 weight
- Body: 400 weight

### Spacing
- Base unit: 4px
- Common: 8px, 12px, 16px, 20px, 24px, 32px

## 🚀 Recent Updates (November 2025)

### Location Tracking System
- ✅ GPS location capture with iOS Safari compatibility
- ✅ IP geolocation fallback (ipapi.co)
- ✅ VPN/Proxy detection
- ✅ ISP network provider display
- ✅ Google Maps integration

### UI/UX Improvements
- ✅ Redesigned success screen (cleaner, less crowded)
- ✅ Collapsible share options
- ✅ Side-by-side action buttons
- ✅ Premium visual hierarchy

### Fraud Prevention
- ✅ VPN detection (NordVPN, ExpressVPN, etc.)
- ✅ Hosting provider detection (AWS, Google Cloud, etc.)
- ✅ ISP organization tracking
- ✅ Transaction location verification

## 📝 API Endpoints

### Public Endpoints
- `POST /create-payment-session` - Create payment session
- `GET /payment-status/:sessionId` - Check payment status
- `POST /api/customer/check` - Check if customer exists
- `POST /api/customer/save-and-pay` - Save card and pay
- `POST /api/customer/pay-with-saved` - Pay with saved card
- `GET /api/merchant/settings` - Get merchant branding (public)

### Authenticated Endpoints (Merchant)
- `POST /api/merchant/login` - Login
- `POST /api/merchant/logout` - Logout
- `GET /api/merchant/me` - Get current merchant
- `GET /api/merchant/stats` - Dashboard statistics
- `GET /api/merchant/transactions` - List transactions
- `PUT /api/merchant/settings` - Update settings
- `GET /api/merchant/receipt/:txnId` - Get receipt HTML
- `POST /api/merchant/receipt/:txnId/send` - Email receipt
- `GET /api/merchant/bank-accounts` - List accounts
- `POST /api/merchant/bank-accounts` - Add account
- `DELETE /api/merchant/bank-accounts/:id` - Remove account
- `GET /api/stripe/account-status` - Stripe Connect status
- `GET /api/stripe/connect-url` - Get Stripe Connect URL
- `GET /api/stripe/callback` - Stripe Connect callback

## 🧪 Testing

### Demo Credentials
- Email: `demo@eztranz.com`
- Password: `demo123`

### Test Cards (Stripe)
- Success: `4242 4242 4242 4242`
- Decline: `4000 0000 0000 0002`
- Any future date, any CVC

## 🌐 Deployment

### Current Deployment
- Platform: Render.com
- URL: https://ez-tranz.onrender.com
- Auto-deploy: Enabled (main branch)

### Requirements
- Node.js ≥18.0.0
- npm dependencies installed
- Environment variables configured

## 📞 Support & Maintenance

### Monitoring
- Check Render logs for errors
- Monitor Stripe dashboard for payment issues
- Review flagged VPN transactions

### Backup Strategy
- Git repository (GitHub)
- Environment variables documented
- Regular commits with descriptive messages

## 🔮 Future Enhancements (Roadmap)

- [ ] Real database (PostgreSQL)
- [ ] Customer portal
- [ ] Refund processing
- [ ] Invoice generation
- [ ] Analytics dashboard
- [ ] Multi-merchant support
- [ ] Mobile app (iOS/Android)
- [ ] Webhook handlers
- [ ] Custom domain support
- [ ] Advanced fraud detection (ML-based)

---

**⚠️ IMPORTANT: This file documents the production-ready state of EZ TRANZ. Any future changes should be documented here to maintain a complete feature record.**
