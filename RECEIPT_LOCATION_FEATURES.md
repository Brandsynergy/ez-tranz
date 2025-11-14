# Receipt Printing & Location Features

## Overview
Two new features have been added to the merchant dashboard:
1. **Receipt Printing & Sending** - Print or email transaction receipts to customers
2. **GPS Location Tracking** - Automatically capture and display transaction locations on Google Maps

---

## 🖨️ Receipt Printing & Sending

### Features
- **Print Receipt**: Generate a professionally formatted receipt with merchant branding
- **Send Receipt via Email**: Email receipts to customers (placeholder implementation ready for email service integration)
- **Location Map**: Automatically includes a Google Maps embed showing where the transaction occurred

### How to Use

#### Merchant Dashboard
1. Navigate to the **Transactions** tab in your merchant dashboard
2. Each transaction now has two action buttons:
   - **🖨️ Print** - Opens receipt in new window and triggers print dialog
   - **📧 Send** - Prompts for customer email and sends receipt

#### Receipt Contents
Each receipt includes:
- Merchant logo (if configured)
- Business name, address, phone, and email
- Transaction date and time
- Transaction ID
- Customer phone number
- Payment method (card brand and last 4 digits)
- Amount paid with currency
- **Google Maps location** (if GPS was captured during payment)
- Custom receipt footer message

### Receipt Customization
Receipts automatically use your merchant branding:
- Business logo
- Brand colors (primary and secondary)
- Business contact information
- Custom footer message

---

## 📍 GPS Location Tracking

### How It Works
When a customer makes a payment:
1. The payment terminal (`pay.html`) requests GPS permission from the browser
2. If granted, it captures:
   - Latitude and longitude coordinates
   - Accuracy of the GPS reading
   - Timestamp of capture
3. Location data is stored with the transaction
4. Location appears on printed/emailed receipts as a Google Maps embed

### Privacy & Best Practices
- Location capture is **optional** - payment proceeds even if location is denied
- Customers see the browser's native permission prompt
- Location data helps merchants:
  - Verify transaction locations
  - Provide proof of purchase location to customers
  - Identify unusual transaction patterns

### Google Maps API Setup
To enable the map embed on receipts, you need a Google Maps API key:

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing
3. Enable **Maps Embed API**
4. Create credentials (API Key)
5. Update `server.js` line 1000:
   ```javascript
   const mapUrl = `https://www.google.com/maps/embed/v1/place?key=YOUR_GOOGLE_MAPS_API_KEY&q=${latitude},${longitude}&zoom=15`;
   ```
   Replace `YOUR_GOOGLE_MAPS_API_KEY` with your actual API key

### Without Google Maps API
If you don't set up a Google Maps API key:
- The map embed won't load (will show "For development purposes only" watermark)
- The "View on Google Maps" link will still work
- All other receipt features work normally

---

## 🔌 API Endpoints

### Get Receipt Data
```
GET /api/merchant/receipt/:transactionId
Authorization: Required (merchant session)

Response:
{
  "transaction": { ... },
  "merchantSettings": { ... },
  "receiptHtml": "<html>...</html>"
}
```

### Send Receipt via Email
```
POST /api/merchant/receipt/:transactionId/send
Authorization: Required (merchant session)
Body: { "email": "customer@example.com" }

Response:
{
  "success": true,
  "message": "Receipt sent to customer@example.com",
  "note": "Email integration pending - receipt data logged to console"
}
```

**Note**: Email sending currently logs to console. To enable actual email delivery, integrate with:
- SendGrid
- AWS SES (Simple Email Service)
- Mailgun
- Postmark
- Or any other transactional email service

---

## 📊 Data Structure

### Transaction Object (with new fields)
```javascript
{
  id: "mock_1234567890_abc123",
  merchantId: "mock_merchant_id",
  amount: 50.00,
  currency: "USD",
  status: "completed",
  paymentIntentId: "pi_xyz123",
  customerPhone: "+1234567890",
  customerEmail: "customer@example.com",  // NEW
  last4: "4242",
  cardBrand: "visa",
  location: {  // NEW
    latitude: 37.7749,
    longitude: -122.4194,
    accuracy: 10,
    timestamp: "2025-01-14T12:00:00.000Z"
  },
  createdAt: "2025-01-14T12:00:00.000Z"
}
```

---

## 🎨 UI Changes

### Merchant Dashboard - Transactions Table
- Added new **Actions** column
- Each row displays:
  - Print button (purple/indigo)
  - Send button (green)
- Buttons trigger respective actions immediately

### Receipt Print View
- Clean, printable layout
- Print-optimized styles (@media print)
- Actions hidden when printing
- Professional invoice-style design
- Responsive and mobile-friendly

---

## 🚀 Testing

### Test Receipt Printing
1. Log into merchant dashboard
2. Make a test transaction (or use existing demo transactions)
3. Go to Transactions tab
4. Click **🖨️ Print** on any transaction
5. Verify receipt opens in new window
6. Check that print dialog appears automatically
7. Verify all transaction details are correct

### Test Receipt Sending
1. Click **📧 Send** on any transaction
2. Enter a test email address
3. Check server console logs for email data
4. Verify success message appears

### Test Location Capture
1. Open payment terminal on a device with GPS
2. Allow location permissions when prompted
3. Complete a payment
4. Check transaction in dashboard
5. Print receipt and verify map appears (if Google Maps API configured)

### Test Without Location
1. Deny location permissions
2. Complete payment anyway
3. Verify payment still succeeds
4. Receipt should work without location section

---

## 🔧 Integration Checklist

- [x] GPS location capture in payment terminal
- [x] Location data stored with transactions
- [x] Receipt generation with merchant branding
- [x] Print receipt functionality
- [x] Send receipt API endpoint
- [x] Google Maps embed in receipts
- [x] UI buttons in transactions table
- [x] Error handling for failed prints/sends
- [ ] **Google Maps API key setup** (manual step)
- [ ] **Email service integration** (manual step)

---

## 📝 Future Enhancements

### Email Integration
Add email service provider in `server.js`:
```javascript
// Example with SendGrid
const sgMail = require('@sendgrid/mail');
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

app.post('/api/merchant/receipt/:transactionId/send', requireAuth, async (req, res) => {
  // ... existing code ...
  
  const msg = {
    to: email,
    from: merchantSettings.businessEmail || 'noreply@eztranz.com',
    subject: `Receipt from ${merchantSettings.businessName}`,
    html: generateReceiptHtml(transaction, merchantSettings)
  };
  
  await sgMail.send(msg);
  
  // ... return success response ...
});
```

### SMS Receipts
- Add Twilio integration for SMS receipts
- Include short receipt summary + link to full receipt

### Receipt Customization
- Allow merchants to toggle location display on/off
- Add custom receipt templates
- Include QR code with transaction ID

### Analytics
- Track receipt print/send rates
- Identify customers who frequently need receipt copies
- Location-based transaction analytics

---

## 🐛 Troubleshooting

### Print button does nothing
- Check browser popup blocker settings
- Verify transaction ID is valid
- Check browser console for errors

### Location not captured
- User must grant location permission
- HTTPS required for geolocation (except localhost)
- Some browsers/devices don't support high-accuracy GPS

### Map not showing on receipt
- Set up Google Maps API key in `server.js` line 1000
- Enable Maps Embed API in Google Cloud Console
- Check API key restrictions

### Email not sending
- Feature currently logs to console only
- Integrate email service provider to enable actual sending
- Check server logs for email data

---

## 💡 Tips

1. **Encourage location permissions**: Add a note on payment page explaining why location is captured
2. **Test in production**: Location capture requires HTTPS in production
3. **Brand your receipts**: Set up logo and colors in Branding settings
4. **Monitor API usage**: Google Maps API has free tier limits
5. **Email compliance**: Follow CAN-SPAM and GDPR guidelines when sending receipts

---

## 🎉 Summary

You now have:
- ✅ Professional receipt printing with merchant branding
- ✅ Receipt email sending (ready for email service integration)
- ✅ Automatic GPS location capture on transactions
- ✅ Google Maps integration showing transaction locations
- ✅ Easy-to-use action buttons in merchant dashboard

These features help merchants provide better customer service and maintain comprehensive transaction records with location verification.
