// Check all database URL variables
require('dotenv').config({ path: '.env.local' });

console.log('All Database URL Variables:');
console.log('============================');

const urls = [
  'DATABASE_URL',
  'DATABASE_DATABASE_URL', 
  'DATABASE_POSTGRES_URL',
  'DATABASE_PRISMA_DATABASE_URL'
];

urls.forEach(urlKey => {
  const url = process.env[urlKey];
  if (url) {
    console.log(`\n${urlKey}:`);
    console.log(`✅ Set`);
    
    // Check format
    if (url.startsWith('postgresql://')) {
      console.log('✅ Starts with postgresql://');
    }
    
    // Check for port
    const portMatch = url.match(/@[^:]+:(\d+)/);
    if (portMatch) {
      console.log(`✅ Port found: ${portMatch[1]}`);
    } else {
      console.log('❌ No port found');
    }
    
    // Check for sslmode
    if (url.includes('sslmode=require')) {
      console.log('✅ SSL mode set');
    } else {
      console.log('❌ No SSL mode');
    }
    
    // Show preview
    console.log(`Preview: ${url.substring(0, 30)}...${url.substring(url.length - 20)}`);
  } else {
    console.log(`\n${urlKey}: ❌ Not set`);
  }
});

console.log('\nRecommendation:');
console.log('Use the URL that has both a port number and sslmode=require');
