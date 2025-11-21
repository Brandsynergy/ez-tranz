# 🚨 Email Not Arriving - Diagnostic Guide

## Problem
Email shows "Receipt sent to nnamdionye@gmail.com" but **NOT arriving** in Gmail inbox or spam.

## Most Likely Causes (in order)

### 1. 🔴 CRITICAL: Resend Domain/Sandbox Issue

**The Problem:**
- Resend's free tier uses `onboarding@resend.dev` 
- This email has **STRICT LIMITS** and Gmail may filter it
- **Resend may be in sandbox mode** - only sends to verified emails

**How to Check:**
1. Go to: **https://resend.com/emails**
2. Login to your Resend account
3. Check the "Emails" tab - do you see the email there?
4. If it shows as "Delivered" but not in Gmail: Gmail filtered it
5. If it shows as "Bounced" or "Failed": See reason

**How to Fix:**
```bash
# Option A: Add recipient to allowed list (sandbox mode)
1. Go to https://resend.com/settings/domains
2. If domain says "Sandbox" - you're in sandbox mode
3. Add nnamdionye@gmail.com to allowed recipients

# Option B: Verify a custom domain (BEST SOLUTION)
1. Go to https://resend.com/domains
2. Click "Add Domain"
3. Add your domain (e.g. yourdomain.com)
4. Add DNS records they provide
5. Wait for verification (5-30 minutes)
6. Update RECEIPT_FROM_EMAIL to receipts@yourdomain.com
```

### 2. ⚠️ Gmail Filtering/Blocking

**The Problem:**
- Gmail sees email from `onboarding@resend.dev` as suspicious
- Silently discards (not even in spam)

**How to Check:**
```bash
# In Gmail:
1. Search: from:onboarding@resend.dev
2. Check ALL folders (Spam, Trash, Promotions, Updates)
3. Check Gmail filters: Settings → Filters and Blocked Addresses
```

**How to Fix:**
```bash
# Whitelist the sender:
1. Gmail Settings → Filters and Blocked Addresses
2. Create new filter
3. From: onboarding@resend.dev
4. Never send to Spam + Always mark as important
5. Create filter

# Then try sending again
```

### 3. 🔐 API Key Issues

**The Problem:**
- API key is invalid, expired, or quota exceeded

**How to Check:**
```bash
# Run this command:
cd /Users/mediad/mobile-payment-terminal
node check-resend-status.js
```

**Expected Output:**
```
✅ Resend API Connection Successful!
```

**If you see errors:**
- 401 = Invalid API key (regenerate at resend.com/api-keys)
- 429 = Rate limit (100/day, 3000/month)
- 403 = Forbidden (domain not verified)

### 4. 📧 Email Address Typo

**The Problem:**
- Typo in the email address

**How to Check:**
Double-check: `nnamdionye@gmail.com` (not `nnamdionye` or wrong domain)

---

## 🔧 IMMEDIATE ACTION PLAN

### Step 1: Check Resend Dashboard (MOST IMPORTANT)
```bash
1. Go to: https://resend.com/emails
2. Look for recent email to nnamdionye@gmail.com
3. Check status:
   - ✅ "Delivered" = Email sent successfully (Gmail filtered it)
   - ❌ "Bounced" = Email rejected (see reason)
   - ❌ "Failed" = Sending failed (see error)
   - ⏳ "Pending" = Still sending (wait 2-3 minutes)
```

### Step 2: Check Sandbox Mode
```bash
1. Go to: https://resend.com/settings/domains  
2. If domain shows "Sandbox" or "Test Mode":
   → You're in sandbox mode!
   → Only verified recipient emails will receive emails
   → Add nnamdionye@gmail.com to allowed recipients
```

### Step 3: Run Diagnostics Locally
```bash
cd /Users/mediad/mobile-payment-terminal
node check-resend-status.js
```

### Step 4: Check Render Logs
```bash
1. Go to: https://dashboard.render.com
2. Click your "ez-tranz" service
3. Click "Logs" tab
4. Look for recent email send attempts
5. Should see:
   📧 Sending email with Resend...
   ✅ Resend API accepted email - ID: xxxxxxxx
```

---

## 🎯 SOLUTIONS (Choose One)

### Solution A: Fix Sandbox Mode (QUICK - 2 minutes)
```bash
1. Go to https://resend.com/domains
2. Click on "resend.dev" domain
3. Add to "Allowed Recipients": nnamdionye@gmail.com
4. Try sending email again
5. Should work immediately
```

### Solution B: Verify Custom Domain (BEST - 30 minutes)
```bash
1. Go to https://resend.com/domains
2. Click "Add Domain"
3. Enter your domain: yourdomain.com
4. Add DNS records (TXT, MX, CNAME) to your domain
5. Wait for verification (green checkmark)
6. Update Render environment variable:
   RECEIPT_FROM_EMAIL=receipts@yourdomain.com
7. Restart Render service
8. Emails will now come from your domain (more trusted)
```

### Solution C: Try Different Email Provider (ALTERNATIVE)
If Resend doesn't work, you can switch to:
- SendGrid (100 emails/day free)
- Mailgun (5,000 emails/month free)
- Postmark (100 emails/month free)

---

## 🧪 TEST AFTER FIXING

```bash
# After implementing a solution:
1. Wait 2-3 minutes for changes to propagate
2. Go to merchant dashboard
3. Send test email
4. Check Gmail inbox AND spam
5. Check Resend dashboard for delivery status
```

---

## 📊 Current Status Check

Run these commands to see current state:

```bash
cd /Users/mediad/mobile-payment-terminal

# Check Resend API
node check-resend-status.js

# Check production email config
node test-render-email.js

# Test email generation (no send)
node test-email-html.js
```

---

## 💡 Why This Happens

**Resend's Free Tier Restrictions:**
1. **Sandbox Mode**: Only sends to pre-approved emails
2. **onboarding@resend.dev**: Gmail doesn't trust this sender
3. **No SPF/DKIM**: Without custom domain, emails lack authentication
4. **Rate Limits**: 100/day, 3000/month

**Gmail's Protection:**
- Aggressively filters unknown senders
- Requires SPF, DKIM, DMARC for trust
- May silently discard (not even spam)

---

## ✅ Success Indicators

You'll know it's fixed when:
1. ✅ Email appears in Gmail inbox
2. ✅ Resend dashboard shows "Delivered"
3. ✅ No bounce messages
4. ✅ Email looks professional (not spammy)

---

## 🆘 Still Not Working?

If nothing works:
1. Try sending to a different email (not Gmail)
2. Check Resend account status (not suspended)
3. Verify API key is active
4. Check Render environment variables match Resend
5. Contact Resend support: support@resend.com

---

**MOST LIKELY FIX:** Check Resend dashboard → Domains → Add nnamdionye@gmail.com to sandbox allowed recipients
