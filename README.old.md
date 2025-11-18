# 💳 EZ TRANZ - Mobile Payment Terminal

A world-class, beautifully simple mobile payment app that turns any phone into a payment terminal. No bulky POS machines needed!

## ✨ Features

- 📱 **Mobile-First Design** - Works perfectly on phones and tablets
- 💨 **Lightning Fast** - Enter amount, tap, and you're done
- 🔒 **Secure Payments** - Powered by Stripe
- 📲 **Installable App** - Works like a native app (PWA)
- 💳 **Multiple Payment Methods** - Credit cards, Apple Pay, Google Pay
- 🎨 **Beautiful Interface** - Simple and intuitive design
- 🏦 **Bank Account Management** - Configure payout accounts
- 📧 **Receipt Sharing** - Share receipts via WhatsApp, Email, SMS
- 💳 **Saved Cards** - Returning customers can pay with saved cards
- 🎨 **Custom Branding** - Add your logo and brand colors

---

## 🚀 Quick Start Guide (For Non-Coders)

### Step 1: Get Your Stripe Keys 🔑

Think of Stripe keys like passwords for your payment system.

1. Go to: https://dashboard.stripe.com/register
2. Create a free account
3. After signing in, click **"Developers"** in the menu
4. Click **"API keys"**
5. You'll see two keys:
   - **Publishable key** (starts with `pk_test_...`)
   - **Secret key** (starts with `sk_test_...`) - Click "Reveal test key"
   
⚠️ **IMPORTANT**: Keep these keys safe! Don't share them with anyone.

---

### Step 2: Update Your App Keys 🔧

1. Create a file called `.env` (in the main folder)
2. Add these two lines (using YOUR keys):
   ```
   STRIPE_SECRET_KEY=sk_test_your_secret_key_here
   STRIPE_PUBLISHABLE_KEY=pk_test_your_publishable_key_here
   ```

---

### Step 3: Test Locally (On Your Computer) 💻

1. Open **Terminal** (on Mac)
2. Type these commands one by one:

```bash
cd /Users/mediad/mobile-payment-terminal
npm install
npm start
```

3. Open your browser and go to: http://localhost:3000
4. You should see **EZ TRANZ**! 🎉

**To test payments**, use Stripe's test card:
- Card number: `4242 4242 4242 4242`
- Expiry: Any future date (e.g., 12/25)
- CVC: Any 3 digits (e.g., 123)

---

### Step 4: Deploy to Render.com 🌍

Now let's put your app online so anyone can use it!

#### A. Connect Your Code to GitHub

1. Go to: https://github.com/new
2. Name your repository: `ez-tranz`
3. Click **"Create repository"**
4. In Terminal, run these commands:

```bash
cd /Users/mediad/mobile-payment-terminal
git init
git add .
git commit -m "Initial commit - EZ TRANZ"
git branch -M main
git remote add origin https://github.com/YOUR-USERNAME/ez-tranz.git
git push -u origin main
```

*(Replace `YOUR-USERNAME` with your GitHub username)*

#### B. Deploy on Render.com

1. Go to: https://dashboard.render.com
2. Sign in with your GitHub account
3. Click **"New +"** → **"Web Service"**
4. Connect your GitHub repository: **ez-tranz**
5. Render will automatically detect settings from `render.yaml`
6. Click **"Advanced"** and add your environment variables:
   - `STRIPE_SECRET_KEY` = your secret key
   - `STRIPE_PUBLISHABLE_KEY` = your publishable key
7. Click **"Create Web Service"**

⏳ **Wait 2-3 minutes** for deployment to complete.

8. Once done, you'll get a URL like: `https://ez-tranz.onrender.com`

🎉 **YOUR APP IS LIVE!**

---

## 📱 Install on Your Phone

1. Open the app URL on your phone browser
2. On iPhone:
   - Tap the **Share** button
   - Tap **"Add to Home Screen"**
3. On Android:
   - Tap the **Menu** (3 dots)
   - Tap **"Add to Home Screen"**

Now it works just like a real app! 📲

---

## 💡 How to Use

1. **Open the app**
2. **Enter payment amount** using the number pad
3. **Tap "Charge"**
4. **Customer scans QR code** and enters payment details
5. **Payment confirmed** - Download or share receipt!
6. **Success!** ✓

---

## 🔐 Going Live (Real Payments)

When you're ready for real money (not test mode):

1. Go to Stripe Dashboard
2. Complete your business verification
3. Switch from "Test mode" to "Live mode"
4. Copy your **LIVE keys** (they start with `pk_live_` and `sk_live_`)
5. Update your keys in Render.com environment variables (both keys)

---

## 🆘 Troubleshooting

### "Payment failed"
- Check that your Stripe keys are correct
- Make sure you're using test card: `4242 4242 4242 4242`

### "Server error"
- Check that environment variables are set in Render.com
- Check the logs in Render dashboard

### "App won't install on phone"
- Make sure you're using HTTPS (Render provides this automatically)
- Try refreshing the page

---

## 📞 Need Help?

- **Stripe Docs**: https://stripe.com/docs
- **Render Docs**: https://render.com/docs

---

## 🎯 What You Built

Congratulations! You've created a professional mobile payment terminal that:
- Accepts credit cards, Apple Pay, and Google Pay
- Works on any device
- Processes payments securely
- Manages bank accounts for payouts
- Shares receipts via multiple channels
- Supports custom branding
- Looks amazing
- Costs almost nothing to run

You did it! 🚀

---

**Made with ❤️ for simplicity**
