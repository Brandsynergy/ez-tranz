# ⚡ Quick Start - Email Receipts

## ✅ What's Done
- SMS removed ✓
- WhatsApp working ✓
- Email ready (just needs API key) ✓

---

## 🔴 URGENT: Add Your Resend API Key

### Step 1: Get API Key (2 minutes)
1. Go to https://resend.com
2. Sign up (free)
3. Go to **API Keys** tab
4. Click **Create API Key**
5. Copy the key (starts with `re_`)

### Step 2: Update .env File
Open `.env` and replace this line:
```bash
RESEND_API_KEY=re_YourResendAPIKeyHere
```

With your real key:
```bash
RESEND_API_KEY=re_abc123xyz...  # Paste your actual key
```

Keep this line as-is (for testing):
```bash
RECEIPT_FROM_EMAIL=onboarding@resend.dev
```

### Step 3: Restart
```bash
npm start
```

---

## 🧪 Test It

1. Make a test payment
2. Go to Dashboard → Transactions
3. Click **📧 Email** button
4. Enter your email
5. Check inbox

---

## 📱 Receipt Sharing Options

### Merchant Dashboard:
- 🖨️ **Print** - Opens receipt in new window
- 📧 **Email** - Sends via Resend (needs API key)

### Customer Success Screen:
- 📄 **View Receipt** - Opens detailed receipt
- 💚 **WhatsApp** - Share via WhatsApp (no setup needed)
- 📧 **Email** - Opens email client with receipt text

---

**Current Status:**
- ✅ Code is ready
- ⚠️ Just add Resend API key to `.env`
- ✅ Everything else works

**Full guide:** See [EMAIL_SETUP.md](./EMAIL_SETUP.md)
