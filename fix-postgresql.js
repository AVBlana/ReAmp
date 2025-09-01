// Fix the URL protocol
require('dotenv').config({ path: '.env.local' });
const fs = require('fs');

console.log('Fixing URL protocol...');

// Read the current .env.local file
let envContent = fs.readFileSync('.env.local', 'utf8');

// Replace postgres:// with postgresql://
const newEnvContent = envContent.replace(
  /DATABASE_URL="postgres:\/\//g,
  'DATABASE_URL="postgresql://'
);

// Write back to .env.local
fs.writeFileSync('.env.local', newEnvContent);

console.log('✅ Updated .env.local with postgresql:// protocol');
console.log('The URL now uses the correct PostgreSQL protocol');
