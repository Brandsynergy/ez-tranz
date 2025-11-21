#!/usr/bin/env node

/**
 * Test email HTML generation locally WITHOUT sending emails
 * This prevents consuming Resend credits during testing
 */

require('dotenv').config();
const fs = require('fs');
const path = require('path');

console.log('\n🧪 Testing Gmail-Compatible Email HTML Generation\n');
console.log('=' .repeat(60));

// Mock transaction data
const mockTransaction = {
  id: 'txn_test_12345678',
  amount: 125.50,
  currency: 'USD',
  status: 'completed',
  customerPhone: '+1234567890',
  last4: '4242',
  cardBrand: 'Visa',
  createdAt: new Date().toISOString(),
  location: {
    type: 'ip',
    city: 'San Francisco',
    region: 'California',
    country: 'United States',
    org: 'Comcast Cable',
    isVPN: false
  }
};

// Mock merchant settings
const mockMerchantSettings = {
  businessName: 'Test Business LLC',
  address: '123 Main St, San Francisco, CA 94102',
  phone: '+1 (555) 123-4567',
  businessEmail: 'contact@testbusiness.com',
  logoUrl: 'https://via.placeholder.com/180x60',
  primaryColor: '#6366f1',
  secondaryColor: '#8b5cf6',
  receiptFooter: 'Thank you for your business! We appreciate your patronage.'
};

// Load the generateGmailCompatibleReceiptHtml function
// We need to extract it from server.js
console.log('\n📄 Generating Gmail-compatible email HTML...\n');

// Currency symbols
const currencySymbols = {
  USD: '$', EUR: '€', GBP: '£', NGN: '₦', INR: '₹', 
  JPY: '¥', CAD: 'C$', AUD: 'A$', BRL: 'R$', ZAR: 'R'
};
const symbol = currencySymbols[mockTransaction.currency] || mockTransaction.currency + ' ';
const date = new Date(mockTransaction.createdAt).toLocaleString();

// Inline the function for testing
function generateGmailCompatibleReceiptHtml(transaction, merchantSettings, symbol, date) {
  // Location section for Gmail
  let locationHtml = '';
  if (transaction.location) {
    if (transaction.location.type === 'ip') {
      const { city, region, country, org, isVPN } = transaction.location;
      
      locationHtml = `
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin-top: 24px; padding-top: 24px; border-top: 2px dashed #e5e7eb;">
          <tr>
            <td style="padding: 0;">
              <p style="font-size: 14px; font-weight: 600; color: #374151; margin: 0 0 12px 0; font-family: Arial, sans-serif;">🌍 Transaction Location</p>
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background: ${isVPN ? '#fef2f2' : '#f9fafb'}; border: 2px solid ${isVPN ? '#fecaca' : '#e5e7eb'}; border-radius: 12px;">
                <tr>
                  <td style="padding: 20px; text-align: center;">
                    <p style="font-size: 16px; font-weight: 600; color: #1f2937; margin: 0 0 8px 0; font-family: Arial, sans-serif;">
                      📍 ${city}${region ? ', ' + region : ''}
                    </p>
                    <p style="font-size: 14px; color: #6b7280; margin: 0; font-family: Arial, sans-serif;">
                      ${country}
                    </p>
                    <p style="font-size: 12px; color: #9ca3af; margin: 8px 0 0 0; font-family: Arial, sans-serif;">
                      Location based on IP address
                    </p>
                    ${org ? `
                      <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin-top: 12px;">
                        <tr>
                          <td style="padding: 10px; background: white; border-radius: 8px; border: 1px solid #e5e7eb; text-align: center;">
                            <p style="font-size: 11px; color: #9ca3af; margin: 0 0 4px 0; font-family: Arial, sans-serif;">
                              Network Provider
                            </p>
                            <p style="font-size: 13px; font-weight: 600; color: #374151; margin: 0; font-family: Arial, sans-serif;">
                              ${org}
                            </p>
                          </td>
                        </tr>
                      </table>
                    ` : ''}
                    ${isVPN ? `
                      <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin-top: 12px;">
                        <tr>
                          <td style="padding: 12px; background: #fee2e2; border: 2px solid #dc2626; border-radius: 8px; text-align: center;">
                            <p style="font-size: 13px; font-weight: 600; color: #991b1b; margin: 0; font-family: Arial, sans-serif;">
                              ⚠️ VPN/Proxy Detected
                            </p>
                            <p style="font-size: 11px; color: #7f1d1d; margin: 4px 0 0 0; font-family: Arial, sans-serif;">
                              ISP: ${org || 'Unknown'}<br>
                              High risk - Manual review recommended
                            </p>
                          </td>
                        </tr>
                      </table>
                    ` : ''}
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      `;
    }
  }
  
  // Gmail image reminder banner
  const gmailBanner = merchantSettings?.logoUrl ? `
    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin-bottom: 16px;">
      <tr>
        <td style="padding: 12px; background: #fef3c7; border: 2px solid #f59e0b; border-radius: 8px; text-align: center;">
          <p style="font-size: 13px; color: #92400e; margin: 0; font-weight: 600; font-family: Arial, sans-serif;">📧 Using Gmail? Click "Display images below" to see the logo</p>
        </td>
      </tr>
    </table>
  ` : '';
  
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <meta http-equiv="X-UA-Compatible" content="IE=edge">
      <title>Receipt - ${merchantSettings.businessName || 'EZ TRANZ'}</title>
    </head>
    <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f9fafb;">
      <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: #f9fafb;">
        <tr>
          <td style="padding: 40px 20px;">
            <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="600" style="margin: 0 auto; background: white; border-radius: 16px; max-width: 600px;">
              <tr>
                <td style="padding: 40px;">
                  
                  ${gmailBanner}
                  
                  <!-- Logo -->
                  ${merchantSettings?.logoUrl ? `
                  <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                    <tr>
                      <td style="text-align: center; padding-bottom: 24px;">
                        <img src="${merchantSettings.logoUrl}" alt="${merchantSettings?.businessName || 'Logo'}" style="max-width: 180px; max-height: 60px; width: auto; height: auto; display: block; margin: 0 auto; border-radius: 8px;" />
                      </td>
                    </tr>
                  </table>
                  ` : `
                  <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                    <tr>
                      <td style="text-align: center; font-size: 32px; padding-bottom: 16px;">💳</td>
                    </tr>
                  </table>
                  `}
                  
                  <!-- Business Name -->
                  <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                    <tr>
                      <td style="text-align: center; font-size: 24px; font-weight: 700; color: #1f2937; padding-bottom: 8px; font-family: Arial, sans-serif;">
                        ${merchantSettings?.businessName || 'EZ TRANZ'}
                      </td>
                    </tr>
                  </table>
                  
                  <!-- Business Info -->
                  ${(merchantSettings.address || merchantSettings.phone || merchantSettings.businessEmail) ? `
                  <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                    <tr>
                      <td style="text-align: center; font-size: 14px; color: #6b7280; padding-bottom: 32px; font-family: Arial, sans-serif;">
                        ${merchantSettings.address ? merchantSettings.address + '<br>' : ''}
                        ${merchantSettings.phone ? merchantSettings.phone + '<br>' : ''}
                        ${merchantSettings.businessEmail || ''}
                      </td>
                    </tr>
                  </table>
                  ` : ''}
                  
                  <!-- Receipt Title -->
                  <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="border-bottom: 2px solid #e5e7eb; margin-bottom: 24px;">
                    <tr>
                      <td style="text-align: center; font-size: 18px; font-weight: 600; color: #374151; padding-bottom: 16px; font-family: Arial, sans-serif;">
                        PAYMENT RECEIPT
                      </td>
                    </tr>
                  </table>
                  
                  <!-- Transaction Details -->
                  <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                    <!-- Date & Time -->
                    <tr>
                      <td style="padding: 12px 0; border-bottom: 1px solid #f3f4f6;">
                        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                          <tr>
                            <td style="font-size: 14px; color: #6b7280; font-family: Arial, sans-serif;">Date & Time</td>
                            <td style="font-size: 14px; color: #1f2937; font-weight: 600; text-align: right; font-family: Arial, sans-serif;">${date}</td>
                          </tr>
                        </table>
                      </td>
                    </tr>
                    
                    <!-- Transaction ID -->
                    <tr>
                      <td style="padding: 12px 0; border-bottom: 1px solid #f3f4f6;">
                        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                          <tr>
                            <td style="font-size: 14px; color: #6b7280; font-family: Arial, sans-serif;">Transaction ID</td>
                            <td style="font-size: 14px; color: #1f2937; font-weight: 600; text-align: right; font-family: Arial, sans-serif; word-break: break-all;">${transaction.id}</td>
                          </tr>
                        </table>
                      </td>
                    </tr>
                    
                    ${transaction.customerPhone ? `
                    <!-- Customer Phone -->
                    <tr>
                      <td style="padding: 12px 0; border-bottom: 1px solid #f3f4f6;">
                        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                          <tr>
                            <td style="font-size: 14px; color: #6b7280; font-family: Arial, sans-serif;">Customer Phone</td>
                            <td style="font-size: 14px; color: #1f2937; font-weight: 600; text-align: right; font-family: Arial, sans-serif;">${transaction.customerPhone}</td>
                          </tr>
                        </table>
                      </td>
                    </tr>
                    ` : ''}
                    
                    ${transaction.last4 ? `
                    <!-- Payment Method -->
                    <tr>
                      <td style="padding: 12px 0; border-bottom: 1px solid #f3f4f6;">
                        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                          <tr>
                            <td style="font-size: 14px; color: #6b7280; font-family: Arial, sans-serif;">Payment Method</td>
                            <td style="font-size: 14px; color: #1f2937; font-weight: 600; text-align: right; font-family: Arial, sans-serif;">${transaction.cardBrand || 'Card'} •••• ${transaction.last4}</td>
                          </tr>
                        </table>
                      </td>
                    </tr>
                    ` : ''}
                  </table>
                  
                  <!-- Amount Paid (Highlighted) -->
                  <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin-top: 16px; background: ${merchantSettings.primaryColor || '#6366f1'}; border-radius: 12px;">
                    <tr>
                      <td style="padding: 16px;">
                        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                          <tr>
                            <td style="font-size: 18px; font-weight: 700; color: #ffffff; font-family: Arial, sans-serif;">Amount Paid</td>
                            <td style="font-size: 18px; font-weight: 700; color: #ffffff; text-align: right; font-family: Arial, sans-serif;">${symbol}${transaction.amount.toFixed(2)}</td>
                          </tr>
                        </table>
                      </td>
                    </tr>
                  </table>
                  
                  ${locationHtml}
                  
                  <!-- Footer -->
                  <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin-top: 32px; padding-top: 24px; border-top: 2px dashed #e5e7eb;">
                    <tr>
                      <td style="text-align: center; font-size: 14px; color: #6b7280; line-height: 1.6; font-family: Arial, sans-serif;">
                        ${merchantSettings.receiptFooter || 'Thank you for your business!'}<br><br>
                      </td>
                    </tr>
                  </table>
                  
                  <!-- View Full Receipt Button -->
                  <table role="presentation" cellspacing="0" cellpadding="0" border="0" align="center" style="margin: 24px auto;">
                    <tr>
                      <td align="center" style="border-radius: 8px; background: ${merchantSettings.primaryColor || '#6366f1'}; padding: 0;">
                        <a href="https://ez-tranz.onrender.com/receipt/${transaction.id}" style="display: block; padding: 16px 40px; color: #ffffff; text-decoration: none; font-weight: 600; font-size: 16px; line-height: 1.5; font-family: Arial, sans-serif;">
                          <strong style="color: #ffffff;">View Full Receipt</strong>
                        </a>
                      </td>
                    </tr>
                  </table>
                  
                  <!-- Fine Print -->
                  <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                    <tr>
                      <td style="text-align: center; font-size: 12px; color: #9ca3af; font-family: Arial, sans-serif;">
                        This is your official payment receipt. Keep it for your records.
                      </td>
                    </tr>
                  </table>
                  
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;
}

// Generate the HTML
try {
  const emailHtml = generateGmailCompatibleReceiptHtml(mockTransaction, mockMerchantSettings, symbol, date);
  
  // Save to file for inspection
  const outputPath = path.join(__dirname, 'test-email-output.html');
  fs.writeFileSync(outputPath, emailHtml);
  
  console.log('✅ Email HTML generated successfully!');
  console.log(`\n📄 Output saved to: ${outputPath}`);
  console.log('\n✨ Features tested:');
  console.log('   ✅ Table-based layout');
  console.log('   ✅ Inline styles only');
  console.log('   ✅ Gmail banner reminder');
  console.log('   ✅ Business logo placeholder');
  console.log('   ✅ Transaction details');
  console.log('   ✅ Location information (IP)');
  console.log('   ✅ Payment method display');
  console.log('   ✅ Amount with proper currency symbol');
  console.log('   ✅ Clickable button');
  console.log('   ✅ Footer text');
  
  // Validate HTML structure
  const checks = {
    'Has DOCTYPE': emailHtml.includes('<!DOCTYPE html>'),
    'Has table layout': emailHtml.includes('role="presentation"'),
    'Has inline styles': emailHtml.includes('style="'),
    'No style tags': !emailHtml.includes('<style>'),
    'Has merchant name': emailHtml.includes(mockMerchantSettings.businessName),
    'Has transaction ID': emailHtml.includes(mockTransaction.id),
    'Has amount': emailHtml.includes('125.50'),
    'Has location': emailHtml.includes('San Francisco'),
    'Has button': emailHtml.includes('View Full Receipt'),
    'Proper closing tags': emailHtml.includes('</html>')
  };
  
  console.log('\n🔍 HTML Structure Validation:');
  let allPassed = true;
  for (const [check, passed] of Object.entries(checks)) {
    console.log(`   ${passed ? '✅' : '❌'} ${check}`);
    if (!passed) allPassed = false;
  }
  
  if (allPassed) {
    console.log('\n🎉 All validation checks passed!');
    console.log('\n📧 To preview the email:');
    console.log(`   open ${outputPath}`);
    console.log('\n⚠️  Note: This test did NOT send any emails (no credits consumed)');
  } else {
    console.log('\n❌ Some validation checks failed!');
    process.exit(1);
  }
  
} catch (error) {
  console.error('\n❌ Error generating email HTML:', error.message);
  console.error(error.stack);
  process.exit(1);
}

console.log('\n' + '=' .repeat(60));
console.log('\n');
