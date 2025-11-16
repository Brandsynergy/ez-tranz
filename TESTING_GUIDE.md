# 🧪 Complete Testing Guide - Email & GPS Location

## 🎯 What We're Testing
1. ✅ Email sending with Resend
2. ✅ GPS location capture
3. ✅ Google Maps on receipts

---

## ⚡ STEP 1: Check System Status (NEW!)

### After Render finishes deploying:

1. **Go to your merchant dashboard**
2. **Open browser console**: 
   - Mac: `Cmd + Option + J` (Chrome)
   - Mac: `Cmd + Option + C` (Safari)
3. **Press: `Ctrl + Shift + D`**
4. **You'll see a popup showing:**
   - ✅ Email configured? YES/NO
   - ✅ Google Maps configured? YES/NO
   - ✅ GPS enabled? YES/NO

**This tells you EXACTLY what's working!**

---

## 📧 STEP 2: Test Email Sending

### Make sure you have in Render Environment Variables:
- `RESEND_API_KEY` = your key (starts with `re_...`)
- `RECEIPT_FROM_EMAIL` = `onboarding@resend.dev`

### Test it:
1. Go to **Transactions** tab
2. Click **📧 Send** on ANY transaction
3. Enter your email address
4. Click OK
5. **Check your inbox!** (Check spam folder too)

### Expected Result:
✅ Email arrives with professional receipt
✅ Shows your business branding
✅ All transaction details included

### If it doesn't work:
- Check diagnostics (Ctrl+Shift+D)
- Verify API keys in Render
- Check browser console for errors

---

## 📍 STEP 3: Test GPS Location Capture

**IMPORTANT: This only works on NEW transactions!**

### Step 3A: Make a NEW Payment

1. **Open Payment Terminal** (from dashboard)
2. **Enter amount**: 100 NGN
3. **Click "Generate QR Code"**
4. **Copy the payment URL** or scan QR

### Step 3B: Open Payment Page

**MUST use a device with GPS:**
- ✅ Your phone (best option!)
- ✅ Laptop with location services
- ❌ Desktop without GPS won't work

**Open the payment link on your phone!**

### Step 3C: Allow Location

When browser asks:
> "Allow [website] to access your location?"

**Click "Allow" or "Yes"** ✅

**IMPORTANT:** If you click "Block" or "Deny", GPS won't work!

### Step 3D: Complete Payment

1. Enter phone: Any number
2. Card: `4242 4242 4242 4242`
3. Expiry: `12/34`
4. CVC: `123`
5. Complete payment

### Step 3E: Check the Receipt

1. Go back to merchant dashboard
2. Go to **Transactions** tab
3. Find the NEW transaction you just made
4. Click **🖨️ Print**

### Expected Result:
✅ Receipt opens in new window
✅ Shows "Transaction Location" section
✅ Google Maps embed showing location
✅ "View on Google Maps" link

---

## 🗺️ STEP 4: Test Google Maps

### Make sure you have in Render:
- `GOOGLE_MAPS_API_KEY` = your key (starts with `AIzaSy...`)

### Check if maps show:
1. Make NEW payment with GPS allowed (Step 3)
2. Print receipt (🖨️ button)
3. Look for map embed

### Expected Results:

**WITH Google Maps API Key:**
✅ Beautiful embedded map
✅ No watermark
✅ Professional look

**WITHOUT Google Maps API Key:**
⚠️ Map shows but with "For development purposes only" watermark
✅ "View on Google Maps" link still works
✅ Location still captured

---

## 🔍 Troubleshooting Checklist

### Email Not Sending?
- [ ] Check diagnostics (Ctrl+Shift+D)
- [ ] Verify `RESEND_API_KEY` in Render
- [ ] Check it starts with `re_`
- [ ] Verify `RECEIPT_FROM_EMAIL` is set
- [ ] Wait for Render to finish deploying (green "Live" dot)
- [ ] Check server logs in Render for errors

### GPS Not Capturing?
- [ ] Using a device with GPS? (phone or laptop)
- [ ] Did you click "Allow" for location?
- [ ] Is it a NEW transaction? (old ones don't have GPS)
- [ ] Using HTTPS? (Render provides this automatically)
- [ ] Check browser console for location errors

### Map Not Showing?
- [ ] Is GPS captured? (check Step 3)
- [ ] Is it a NEW transaction?
- [ ] Check diagnostics (Ctrl+Shift+D)
- [ ] Verify `GOOGLE_MAPS_API_KEY` in Render
- [ ] Check it starts with `AIzaSy...`
- [ ] Even without API key, link should work

### Old Transactions Don't Show Location?
✅ This is NORMAL! Only new transactions capture GPS.
Old transactions were made before we added this feature.

---

## 🎯 Quick Test Summary

1. **Check diagnostics**: Ctrl+Shift+D in dashboard
2. **Test email**: Click Send button, enter email, check inbox
3. **Test GPS**: Make NEW payment on phone, allow location
4. **Check map**: Print receipt of NEW transaction, see map

---

## 🆘 Still Not Working?

### Check These:

1. **Render Environment Variables:**
   ```
   RESEND_API_KEY=re_your_key_here
   RECEIPT_FROM_EMAIL=onboarding@resend.dev
   GOOGLE_MAPS_API_KEY=AIzaSy_your_key_here
   ```

2. **Render Status:**
   - Must show green "Live" dot
   - Wait 2-3 minutes after saving environment variables

3. **Browser Console:**
   - Press F12
   - Look for red errors
   - Take screenshot and share if needed

4. **Test on Phone:**
   - GPS works better on phones
   - Make sure to allow location permission

---

## ✅ Success Criteria

You'll know everything works when:

**✅ Diagnostics shows:**
- Email configured: YES
- Google Maps configured: YES  
- GPS enabled: YES

**✅ Email test:**
- Receipt arrives in inbox
- Looks professional
- Has all transaction details

**✅ GPS test:**
- New transaction on phone
- Location permission allowed
- Receipt shows map with location

**✅ Map test:**
- Embedded map visible
- Shows correct location
- No errors in console

---

## 🎉 Expected Timeline

- Render deploys: **2-3 minutes**
- Make test payment: **1 minute**
- Check receipt: **Instant**
- Receive email: **Under 1 minute**

**Total time to test everything: ~5 minutes**

---

## 📞 Debug Commands

In browser console (F12), paste these to check:

```javascript
// Check if location was captured
console.log('Location:', userLocation);

// Check API response
fetch('/api/merchant/diagnostics')
  .then(r => r.json())
  .then(d => console.log('System Status:', d));
```

---

**Good luck! Everything should work perfectly once environment variables are set in Render!** 🚀
