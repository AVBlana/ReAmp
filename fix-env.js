// Fix the DATABASE_URL
require('dotenv').config({ path: '.env.local' });
const fs = require('fs');

console.log('Fixing DATABASE_URL...');

// Use DATABASE_DATABASE_URL which has the correct port
const correctUrl = process.env.DATABASE_DATABASE_URL;

if (correctUrl) {
  console.log('✅ Found correct URL with port 5432');
  
  // Read the current .env.local file
  let envContent = fs.readFileSync('.env.local', 'utf8');
  
  // Replace DATABASE_URL with the correct one
  const newEnvContent = envContent.replace(
    /^DATABASE_URL=.*$/m,
    `DATABASE_URL="${correctUrl}"`
  );
  
  // Write back to .env.local
  fs.writeFileSync('.env.local', newEnvContent);
  
  console.log('✅ Updated .env.local with correct DATABASE_URL');
  console.log('The URL now includes the port number (5432)');
  
} else {
  console.log('❌ DATABASE_DATABASE_URL not found');
  console.log('Please check your Vercel environment variables');
}
