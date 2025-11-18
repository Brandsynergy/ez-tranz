#!/usr/bin/env node

require('dotenv').config();

console.log('\n🔍 Email Configuration Check\n');
console.log('=' .repeat(50));

const resendKey = process.env.RESEND_API_KEY;
const fromEmail = process.env.RECEIPT_FROM_EMAIL;

// Check Resend API Key
if (!resendKey) {
    console.log('❌ RESEND_API_KEY: NOT SET');
    console.log('   Add it to your .env file');
} else if (resendKey === 're_YourResendAPIKeyHere') {
    console.log('❌ RESEND_API_KEY: PLACEHOLDER VALUE');
    console.log('   Current: re_YourResendAPIKeyHere');
    console.log('   ⚠️  You need to replace this with your real API key');
    console.log('   Get it from: https://resend.com/api-keys');
} else if (!resendKey.startsWith('re_')) {
    console.log('⚠️  RESEND_API_KEY: Invalid format');
    console.log(`   Current: ${resendKey.substring(0, 10)}...`);
    console.log('   Should start with: re_');
} else {
    console.log('✅ RESEND_API_KEY: Configured');
    console.log(`   Value: ${resendKey.substring(0, 10)}...${resendKey.substring(resendKey.length - 4)}`);
}

console.log('');

// Check From Email
if (!fromEmail) {
    console.log('❌ RECEIPT_FROM_EMAIL: NOT SET');
} else {
    console.log('✅ RECEIPT_FROM_EMAIL:', fromEmail);
    if (fromEmail === 'onboarding@resend.dev') {
        console.log('   ℹ️  Using Resend test email (perfect for testing!)');
    } else if (fromEmail === 'receipts@yourdomain.com') {
        console.log('   ⚠️  Placeholder domain - update with your verified domain');
    }
}

console.log('');
console.log('=' .repeat(50));

// Summary
if (resendKey && resendKey !== 're_YourResendAPIKeyHere' && resendKey.startsWith('re_')) {
    console.log('✅ Email is ready to use!');
    console.log('\nTest it:');
    console.log('1. Start server: npm start');
    console.log('2. Go to Dashboard → Transactions');
    console.log('3. Click 📧 Email on any transaction');
} else {
    console.log('⚠️  Email NOT configured yet');
    console.log('\nNext steps:');
    console.log('1. Sign up at https://resend.com (free)');
    console.log('2. Get your API key from: https://resend.com/api-keys');
    console.log('3. Open .env file in this folder');
    console.log('4. Replace this line:');
    console.log('   RESEND_API_KEY=re_YourResendAPIKeyHere');
    console.log('   With:');
    console.log('   RESEND_API_KEY=re_your_actual_key_here');
    console.log('5. Save and restart server');
}

console.log('\n');
