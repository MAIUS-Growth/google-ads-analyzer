import dotenv from 'dotenv';

dotenv.config();

const clientId = process.env.GOOGLE_ADS_CLIENT_ID;
const clientSecret = process.env.GOOGLE_ADS_CLIENT_SECRET;
const redirectUri = 'http://localhost:3001/oauth/callback/'; // Added trailing slash

// Manually create the authorization URL
const authUrl = `https://accounts.google.com/o/oauth2/auth?` +
  `client_id=${clientId}&` +
  `redirect_uri=${encodeURIComponent(redirectUri)}&` +
  `response_type=code&` +
  `scope=${encodeURIComponent('https://www.googleapis.com/auth/adwords')}&` +
  `access_type=offline&` +
  `prompt=consent`;

console.log('🔗 Go to this URL and authorize:');
console.log(authUrl);
console.log('\n📋 After you authorize, you\'ll get redirected to a URL with a code.');
console.log('💡 Copy that code and run: node exchange-code.js YOUR_CODE_HERE');