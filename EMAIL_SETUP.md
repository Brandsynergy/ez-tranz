# Email Receipt Setup Guide

## 📧 How to Enable Email Receipts

Your app is configured to send receipts via **email** (Resend) and **WhatsApp**.

### Step 1: Get Resend API Key

1. Go to **https://resend.com**
2. Sign up for free (100 emails/day)
3. Click **API Keys** in the dashboard
4. Create a new API key
5. Copy the key (starts with `re_...`)

### Step 2: Update .env File

Open `.env` and update:

```bash
RESEND_API_KEY=re_abc123xyz...  # Paste your real API key here
RECEIPT_FROM_EMAIL=onboarding@resend.dev  # Use this for testing
```

**For Production (with your own domain):**
```bash
RESEND_API_KEY=re_abc123xyz...
RECEIPT_FROM_EMAIL=receipts@yourdomain.com
```

You'll need to verify your domain in Resend dashboard first.

### Step 3: Restart Server

```bash
npm start
```

---

## ✅ Testing Email

1. Go to **Merchant Dashboard** → **Transactions**
2. Click **📧 Email** button on any transaction
3. Enter your email address
4. Check your inbox (and spam folder)

---

## 💰 Pricing

- **Free Tier:** 100 emails/day, 3,000/month
- **Paid Plans:** Start at $20/month for 50,000 emails

---

## 📱 WhatsApp Share

WhatsApp sharing is **already enabled** - no configuration needed!

Customers can share receipts via WhatsApp from the payment success screen.

---

## 🛠️ Troubleshooting

### Email not sending?

✅ Check `RESEND_API_KEY` is set correctly (not placeholder `re_YourResendAPIKeyHere`)  
✅ Use `onboarding@resend.dev` for testing (no domain verification needed)  
✅ Check server console logs for error messages  
✅ Verify Resend account is active and has remaining quota  

### Check if it's working

Look for this in server logs when sending email:
```
✅ Receipt sent successfully to user@email.com - Email ID: xxxxxxxx
```

If you see error messages, copy them and check Resend dashboard.

---

**Questions?** Check the server console for detailed error messages.
