# Email & SMS Receipt Setup Guide

## 🚨 IMPORTANT: Both services need to be configured for receipts to work!

Your app now has **full email and SMS functionality**, but you need to add your API credentials.

---

## 📧 Email Setup (Resend)

### Step 1: Sign Up
1. Go to **https://resend.com**
2. Create a free account (100 emails/day free tier)
3. Verify your email address

### Step 2: Get API Key
1. Go to **API Keys** in the Resend dashboard
2. Click **Create API Key**
3. Give it a name (e.g., "EZ TRANZ Production")
4. Copy the API key (starts with `re_...`)

### Step 3: Set Up Domain (for production)
1. Go to **Domains** in Resend dashboard
2. Add your domain (e.g., `eztranz.com`)
3. Add DNS records to your domain registrar
4. Wait for verification (usually 5-10 minutes)

### Step 4: Update .env File
```bash
RESEND_API_KEY=re_abc123xyz...  # Your real API key
RECEIPT_FROM_EMAIL=receipts@yourdomain.com  # Your verified domain email
```

**For testing (no domain needed):**
```bash
RESEND_API_KEY=re_abc123xyz...  # Your real API key
RECEIPT_FROM_EMAIL=onboarding@resend.dev  # Resend's test email
```

---

## 📱 SMS Setup (Twilio)

### Step 1: Sign Up
1. Go to **https://twilio.com/try-twilio**
2. Create a free account ($15 free credit)
3. Verify your phone number

### Step 2: Get Credentials
1. Go to **Console Dashboard** (https://console.twilio.com)
2. Find your **Account SID** (starts with `AC...`)
3. Find your **Auth Token** (click to reveal)
4. Copy both values

### Step 3: Get Phone Number
1. In Twilio console, go to **Phone Numbers** → **Manage** → **Buy a number**
2. Select your country
3. Choose a number with **SMS capability**
4. Click **Buy** (uses free credit)
5. Copy your Twilio phone number (format: `+1234567890`)

### Step 4: Update .env File
```bash
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=your_auth_token_here
TWILIO_PHONE_NUMBER=+1234567890  # Your Twilio number
```

**Important:** Phone numbers must be in **E.164 format** (e.g., `+1234567890`)

---

## 🔄 Restart Server

After updating `.env`, restart your server:
```bash
npm start
```

---

## ✅ Testing

### Test Email
1. Go to Merchant Dashboard → Transactions
2. Click **📧 Email** on any transaction
3. Enter your email address
4. Check your inbox (and spam folder)

### Test SMS
1. Go to Merchant Dashboard → Transactions
2. Click **💬 SMS** on any transaction
3. Enter phone number with country code (e.g., `+12345678900`)
4. Check your phone for the SMS

---

## 💰 Pricing

### Resend
- **Free Tier:** 100 emails/day, 3,000/month
- **Paid Plans:** Start at $20/month for 50,000 emails

### Twilio
- **Free Trial:** $15 credit (≈ 750 SMS in US)
- **Pay-as-you-go:** $0.0079/SMS (US), varies by country
- **Toll-Free Numbers:** $2/month + $0.0225/SMS

---

## 🛠️ Troubleshooting

### Email not sending?
✅ Check if `RESEND_API_KEY` is set correctly (not placeholder)  
✅ Check if `RECEIPT_FROM_EMAIL` matches your verified domain  
✅ For testing, use `onboarding@resend.dev`  
✅ Check server logs for error messages  

### SMS not sending?
✅ Check all three Twilio variables are set  
✅ Phone number must be in E.164 format (`+country_code + number`)  
✅ Check Twilio account has credit  
✅ Verify Twilio number has SMS capability  
✅ Check server logs for error messages  

### Still not working?
Press **Ctrl+Shift+D** in the merchant dashboard to see system diagnostics.

---

## 📍 What's Included

✅ **Email receipts** with full branding, logo, and location maps  
✅ **SMS receipts** with transaction details  
✅ **VPN/Proxy detection** warnings in receipts  
✅ **ISP tracking** for fraud prevention  
✅ **GPS location** or IP-based location on every receipt  

---

**Questions?** Check server console logs for detailed error messages.
