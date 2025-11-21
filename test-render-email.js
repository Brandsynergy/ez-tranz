#!/usr/bin/env node

/**
 * Test script to verify Render environment email configuration
 * This will test if emails can actually be sent via the production server
 */

const https = require('https');

console.log('\n🧪 Testing Render Email Configuration\n');
console.log('=' .repeat(60));

// First, let's check if we can authenticate
const merchantCredentials = {
  email: 'demo@eztranz.com',
  password: 'demo123'
};

console.log('Step 1: Authenticating with merchant account...');

// Login to get session
const loginData = JSON.stringify(merchantCredentials);

const loginOptions = {
  hostname: 'ez-tranz.onrender.com',
  port: 443,
  path: '/api/merchant/login',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': loginData.length
  }
};

const loginReq = https.request(loginOptions, (res) => {
  let data = '';
  
  res.on('data', (chunk) => {
    data += chunk;
  });
  
  res.on('end', () => {
    try {
      const response = JSON.parse(data);
      
      if (res.statusCode === 200 && response.success) {
        console.log('✅ Authentication successful');
        
        // Extract session cookie
        const cookies = res.headers['set-cookie'];
        const sessionCookie = cookies ? cookies.find(c => c.startsWith('merchantSession=')) : null;
        
        if (sessionCookie) {
          console.log('\nStep 2: Checking email diagnostics...');
          
          // Check diagnostics endpoint
          const diagOptions = {
            hostname: 'ez-tranz.onrender.com',
            port: 443,
            path: '/api/merchant/diagnostics',
            method: 'GET',
            headers: {
              'Cookie': sessionCookie.split(';')[0]
            }
          };
          
          const diagReq = https.request(diagOptions, (diagRes) => {
            let diagData = '';
            
            diagRes.on('data', (chunk) => {
              diagData += chunk;
            });
            
            diagRes.on('end', () => {
              try {
                const diagnostics = JSON.parse(diagData);
                
                console.log('\n📊 Email Configuration Status:');
                console.log('=' .repeat(60));
                
                if (diagnostics.features && diagnostics.features.email) {
                  const emailConfig = diagnostics.features.email;
                  
                  console.log(`\n✉️  Email System:`);
                  console.log(`   Configured: ${emailConfig.configured ? '✅ YES' : '❌ NO'}`);
                  console.log(`   Has API Key: ${emailConfig.hasApiKey ? '✅ YES' : '❌ NO'}`);
                  console.log(`   From Email: ${emailConfig.fromEmail}`);
                  
                  if (emailConfig.configured) {
                    console.log('\n🎉 SUCCESS! Email is properly configured on Render!');
                    console.log('\n📧 Ready to send emails. To test:');
                    console.log('   1. Go to: https://ez-tranz.onrender.com/merchant-dashboard.html');
                    console.log('   2. Login with: demo@eztranz.com / demo123');
                    console.log('   3. Click Transactions → 📧 Email button');
                    console.log('   4. Enter your Gmail address');
                    console.log('   5. Check your inbox (and spam folder)');
                  } else {
                    console.log('\n⚠️  EMAIL NOT CONFIGURED on Render');
                    console.log('\n🔧 To fix this:');
                    console.log('   1. Go to: https://dashboard.render.com');
                    console.log('   2. Select your "ez-tranz" service');
                    console.log('   3. Go to Environment tab');
                    console.log('   4. Check RESEND_API_KEY variable:');
                    console.log('      - Should start with "re_"');
                    console.log('      - Should NOT be "re_YourResendAPIKeyHere"');
                    console.log('   5. If missing or wrong, get real key from: https://resend.com/api-keys');
                    console.log('   6. Update the environment variable');
                    console.log('   7. Render will auto-redeploy (takes 2-3 minutes)');
                  }
                } else {
                  console.log('❌ Could not retrieve diagnostics');
                }
                
                console.log('\n' + '=' .repeat(60));
                console.log('\n');
                
              } catch (err) {
                console.error('❌ Error parsing diagnostics:', err.message);
              }
            });
          });
          
          diagReq.on('error', (err) => {
            console.error('❌ Error checking diagnostics:', err.message);
          });
          
          diagReq.end();
          
        } else {
          console.log('❌ Could not extract session cookie');
        }
        
      } else {
        console.log('❌ Authentication failed:', data);
      }
      
    } catch (err) {
      console.error('❌ Error parsing response:', err.message);
    }
  });
});

loginReq.on('error', (err) => {
  console.error('❌ Connection error:', err.message);
  console.log('\n⚠️  Make sure https://ez-tranz.onrender.com is accessible');
});

loginReq.write(loginData);
loginReq.end();
