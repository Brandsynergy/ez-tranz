# 📧 Email Setup Guide - Super Simple!

## What You Need (5 minutes)

1. **Resend Account** (Free - 3,000 emails per month)
2. **API Key** from Resend
3. **Add key to Render** (where your app lives)

---

## Step 1: Sign Up for Resend (2 minutes) ✅

1. Go to: **https://resend.com/signup**
2. Enter your email
3. Check your email and click the verification link
4. You're in! 🎉

---

## Step 2: Get Your API Key (1 minute) 🔑

1. Once logged in, click **"API Keys"** in the left menu
2. Click the **"Create API Key"** button
3. Name it: `EZ TRANZ Receipts`
4. Click **Create**
5. **COPY THE KEY** - It looks like: `re_AbCd1234...`
6. **SAVE IT SOMEWHERE** - You won't see it again!

---

## Step 3: Add Your Email Domain (Optional but Recommended) 📬

### Option A: Use a free email domain (Quick Start)
Resend gives you: `onboarding@resend.dev` - **This works immediately!**

### Option B: Use your own domain (Professional)
1. In Resend, click **"Domains"**
2. Click **"Add Domain"**
3. Enter your domain (like: `eztranz.com`)
4. Add the DNS records they show you (ask your domain provider how)
5. Wait a few minutes for verification
6. Use: `receipts@yourdomain.com`

**For now, just use Option A to test!**

---

## Step 4: Add API Key to Render (2 minutes) 🚀

1. Go to: **https://dashboard.render.com**
2. Click on your **"ez-tranz"** service
3. Click **"Environment"** tab on the left
4. Click **"Add Environment Variable"**
5. Add these TWO variables:

**First Variable:**
- **Key:** `RESEND_API_KEY`
- **Value:** Paste your API key (the `re_...` thing you copied)

**Second Variable:**
- **Key:** `RECEIPT_FROM_EMAIL`
- **Value:** `onboarding@resend.dev` (or your domain email if you set one up)

6. Click **"Save Changes"**
7. Render will automatically restart your app (takes 2-3 minutes)

---

## Step 5: Test It! 🎉

1. Wait for Render to finish restarting (watch for green "Live" dot)
2. Go to your merchant dashboard
3. Go to **Transactions** tab
4. Click the **📧 Send** button on any transaction
5. Enter your email
6. Check your inbox! 📬

**The email will include:**
- Professional receipt with your branding
- Transaction details
- Google Maps location (if GPS was captured)
- Print button
- Your custom footer message

---

## Troubleshooting 🔧

### Email not sending?
- ✅ Check you copied the full API key (starts with `re_`)
- ✅ Make sure you saved it in Render environment variables
- ✅ Wait for Render to finish restarting (green dot)
- ✅ Check the server logs in Render for error messages

### Using your own domain?
You must verify your domain in Resend first by adding DNS records.
Until then, use `onboarding@resend.dev` to test!

### Emails going to spam?
- Use a verified domain (not the free `resend.dev`)
- Make sure your domain has proper SPF/DKIM records (Resend handles this)
- Recipients should whitelist your email

---

## Free Tier Limits 🎁

Resend Free Plan includes:
- ✅ **3,000 emails per month** (100 per day)
- ✅ Perfect for most small to medium businesses
- ✅ All features included
- ✅ No credit card required

**Need more?** Upgrade to their paid plan ($20/month for 50,000 emails)

---

## What Happens Without Email Setup? 📝

Don't worry! If you don't set up email:
- ✅ Everything else still works perfectly
- ✅ You can still print receipts
- ✅ The send button shows a helpful message
- ✅ Receipt data is logged in server console

So take your time! No rush! 😊

---

## Summary Checklist ✅

- [ ] Signed up for Resend account
- [ ] Got API key from Resend
- [ ] Added `RESEND_API_KEY` to Render environment
- [ ] Added `RECEIPT_FROM_EMAIL` to Render environment  
- [ ] Saved changes and waited for restart
- [ ] Tested sending a receipt
- [ ] Received email successfully!

---

**That's it! You now have professional email receipts! 🎉**

Need help? The error messages will guide you. If stuck, check the Render logs.
