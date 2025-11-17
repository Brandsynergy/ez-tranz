# EZ TRANZ - Mobile Payment Terminal

**Version 2.0 - Production Ready** ✅

A world-class mobile payment terminal with GPS location tracking, VPN fraud detection, and premium merchant dashboard.

## 🚀 Quick Start

```bash
# Install dependencies
npm install

# Run locally
npm start

# Server runs on http://localhost:3000
```

## 🌐 Live Demo

- **URL**: https://ez-tranz.onrender.com
- **Demo Login**: demo@eztranz.com / demo123
- **Test Card**: 4242 4242 4242 4242

## ✨ Key Features

### Payment Processing
- QR code payment links
- Multi-currency (15 currencies)
- One-tap payment for returning customers
- Stripe integration

### Security & Fraud Prevention
- **GPS Location Tracking** (with iOS Safari support)
- **IP Geolocation Fallback** (always works)
- **VPN/Proxy Detection** (flags suspicious transactions)
- **ISP Tracking** (shows network provider)

### Merchant Dashboard
- Transaction management
- Branded receipts (print & email)
- Bank account management
- Stripe Connect integration

## 📁 Documentation

See **[FEATURES.md](./FEATURES.md)** for complete documentation including:
- Full feature list
- API endpoints
- Database schema
- Security details
- Deployment guide

## ⚠️ STABLE VERSION CHECKPOINT

**This version (v2.0-stable) is fully documented and production-ready.**

### Rollback Instructions
```bash
# If something breaks, restore to this stable version:
git checkout v2.0-stable
git checkout -b recovery-branch
```

### Create Backup Before Changes
```bash
git tag -a v2.1-backup -m "Backup before new changes"
git push origin v2.1-backup
```

---

**Status**: ✅ Production Ready | **Last Updated**: November 17, 2025
