import dotenv from 'dotenv';
import https from 'https';
import { URLSearchParams } from 'url';

dotenv.config();

const authCode = process.argv[2];

if (!authCode) {
  console.log('❌ Please provide the authorization code:');
  console.log('node exchange-code.js YOUR_CODE_HERE');
  process.exit(1);
}

const params = new URLSearchParams({
  client_id: process.env.GOOGLE_ADS_CLIENT_ID,
  client_secret: process.env.GOOGLE_ADS_CLIENT_SECRET,
  code: authCode,
  grant_type: 'authorization_code',
  redirect_uri: 'http://localhost:3001/oauth/callback/' // Added trailing slash
});

const postData = params.toString();

const options = {
  hostname: 'oauth2.googleapis.com',
  port: 443,
  path: '/token',
  method: 'POST',
  headers: {
    'Content-Type': 'application/x-www-form-urlencoded',
    'Content-Length': Buffer.byteLength(postData)
  }
};

console.log('🔄 Exchanging code for refresh token...');

const req = https.request(options, (res) => {
  let data = '';
  
  res.on('data', (chunk) => {
    data += chunk;
  });
  
  res.on('end', () => {
    try {
      const response = JSON.parse(data);
      
      if (response.refresh_token) {
        console.log('✅ Success! Your refresh token is:');
        console.log(response.refresh_token);
        console.log('\n📝 Add this to your .env file as:');
        console.log(`REFRESH_TOKEN=${response.refresh_token}`);
      } else {
        console.log('❌ Error response:', response);
      }
    } catch (error) {
      console.error('❌ Error parsing response:', error.message);
      console.log('Raw response:', data);
    }
  });
});

req.on('error', (error) => {
  console.error('❌ Request error:', error.message);
});

req.write(postData);
req.end();