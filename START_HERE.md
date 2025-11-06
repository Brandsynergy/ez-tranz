# 🚀 EZ TRANZ - Start Here!

Welcome! You're about to launch your mobile payment terminal. Follow these simple steps:

## ⚡️ Quick Start (3 Minutes)

### 1️⃣ Get Stripe Keys (2 minutes)

Go to: **https://dashboard.stripe.com/register**

- Sign up for free
- Click "Developers" → "API keys"
- Copy both keys (starts with `pk_test_` and `sk_test_`)

### 2️⃣ Create `.env` File

In this folder, create a file named `.env` and paste:

```
STRIPE_SECRET_KEY=sk_test_YOUR_KEY_HERE
STRIPE_PUBLISHABLE_KEY=pk_test_YOUR_KEY_HERE
```

*(Replace with your actual keys)*

### 3️⃣ Update `public/app.js`

Open `public/app.js` and find line 2:

```javascript
const STRIPE_PUBLISHABLE_KEY = 'pk_test_...';
```

Replace with YOUR publishable key.

### 4️⃣ Run the App

In Terminal:

```bash
npm start
```

Then open: **http://localhost:3000**

---

## 🧪 Test Payment

Use Stripe test card:
- **Card**: 4242 4242 4242 4242
- **Expiry**: 12/25 (any future date)
- **CVC**: 123 (any 3 digits)

---

## 📱 Deploy to Internet

Once it works locally, check **README.md** for deployment steps to Render.com!

---

## ❓ Stuck?

1. Make sure Node.js is installed: `node --version`
2. Check that `.env` file exists and has correct keys
3. Look at `README.md` for detailed troubleshooting

---

**You've got this! 🎉**
