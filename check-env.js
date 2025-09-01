// Check environment variables
require('dotenv').config({ path: '.env.local' });

console.log('Environment Variables Check:');
console.log('============================');

const dbUrl = process.env.DATABASE_URL;
if (dbUrl) {
  console.log('✅ DATABASE_URL is set');
  console.log('URL format check:');
  
  // Check if it starts with postgresql://
  if (dbUrl.startsWith('postgresql://')) {
    console.log('✅ Starts with postgresql://');
  } else {
    console.log('❌ Should start with postgresql://');
  }
  
  // Check for port number
  const portMatch = dbUrl.match(/@[^:]+:(\d+)/);
  if (portMatch) {
    const port = portMatch[1];
    console.log(`✅ Port found: ${port}`);
    if (port === '5432') {
      console.log('✅ Port is correct (5432)');
    } else {
      console.log(`⚠️  Port ${port} might be incorrect (expected 5432)`);
    }
  } else {
    console.log('❌ No port number found in URL');
  }
  
  // Check for sslmode
  if (dbUrl.includes('sslmode=require')) {
    console.log('✅ SSL mode is set');
  } else {
    console.log('❌ Missing sslmode=require');
  }
  
  // Show first and last 20 characters of URL (for security)
  console.log(`URL preview: ${dbUrl.substring(0, 20)}...${dbUrl.substring(dbUrl.length - 20)}`);
  
} else {
  console.log('❌ DATABASE_URL is not set');
}

console.log('\nOther environment variables:');
console.log('NEXTAUTH_SECRET:', process.env.NEXTAUTH_SECRET ? 'Set' : 'Not set');
console.log('NEXTAUTH_URL:', process.env.NEXTAUTH_URL ? 'Set' : 'Not set');
