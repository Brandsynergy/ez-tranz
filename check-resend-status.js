#!/usr/bin/env node

/**
 * Check Resend API status and verify emails are actually being sent
 * This helps diagnose why emails show "sent" but don't arrive
 */

require('dotenv').config();
const https = require('https');

console.log('\n🔍 Checking Resend API Status\n');
console.log('=' .repeat(60));

// Check if API key is configured
const apiKey = process.env.RESEND_API_KEY;

if (!apiKey || apiKey === 're_YourResendAPIKeyHere') {
  console.log('❌ CRITICAL: Resend API key is not configured properly!');
  console.log('\nCurrent value:', apiKey || 'NOT SET');
  console.log('\n🔧 To fix:');
  console.log('1. Go to https://resend.com/api-keys');
  console.log('2. Create or copy your API key');
  console.log('3. Update RESEND_API_KEY in Render environment variables');
  console.log('4. The key should start with "re_" and be 40+ characters');
  process.exit(1);
}

console.log('✅ API Key configured:', apiKey.substring(0, 10) + '...' + apiKey.substring(apiKey.length - 4));
console.log('\n📧 Testing Resend API Connection...\n');

// Test Resend API by checking domain status
const options = {
  hostname: 'api.resend.com',
  port: 443,
  path: '/domains',
  method: 'GET',
  headers: {
    'Authorization': `Bearer ${apiKey}`,
    'Content-Type': 'application/json'
  }
};

const req = https.request(options, (res) => {
  let data = '';
  
  res.on('data', (chunk) => {
    data += chunk;
  });
  
  res.on('end', () => {
    console.log('Response Status:', res.statusCode);
    console.log('Response Headers:', JSON.stringify(res.headers, null, 2));
    
    if (res.statusCode === 200) {
      try {
        const domains = JSON.parse(data);
        console.log('\n✅ Resend API Connection Successful!');
        console.log('\n📊 Domain Status:');
        
        if (domains.data && domains.data.length > 0) {
          domains.data.forEach(domain => {
            console.log(`\n   Domain: ${domain.name}`);
            console.log(`   Status: ${domain.status}`);
            console.log(`   Region: ${domain.region}`);
          });
        } else {
          console.log('\n⚠️  No domains configured');
          console.log('   Using Resend\'s test domain: onboarding@resend.dev');
          console.log('   ✅ This is fine for testing!');
        }
        
        console.log('\n' + '=' .repeat(60));
        console.log('\n✅ Resend API is working correctly!');
        console.log('\n🔍 If emails still aren\'t arriving, check:');
        console.log('   1. Gmail spam folder');
        console.log('   2. Resend dashboard logs: https://resend.com/emails');
        console.log('   3. Email quota (free tier: 100/day, 3000/month)');
        console.log('   4. Recipient email address spelling');
        
      } catch (err) {
        console.error('❌ Error parsing response:', err.message);
        console.log('Raw response:', data);
      }
    } else if (res.statusCode === 401) {
      console.log('\n❌ Authentication Failed!');
      console.log('The API key is invalid or expired.');
      console.log('\n🔧 To fix:');
      console.log('1. Go to https://resend.com/api-keys');
      console.log('2. Generate a new API key');
      console.log('3. Update RESEND_API_KEY in Render environment variables');
    } else if (res.statusCode === 429) {
      console.log('\n⚠️  Rate Limit Exceeded!');
      console.log('You\'ve hit Resend\'s rate limit.');
      console.log('\nFree tier limits:');
      console.log('   - 100 emails per day');
      console.log('   - 3,000 emails per month');
    } else {
      console.log('\n❌ Unexpected Response');
      console.log('Status:', res.statusCode);
      console.log('Body:', data);
    }
  });
});

req.on('error', (err) => {
  console.error('\n❌ Connection Error:', err.message);
  console.log('\n⚠️  Could not connect to Resend API');
  console.log('Check your internet connection');
});

req.end();
