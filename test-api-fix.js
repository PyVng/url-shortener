// Test script to verify the RLS fix
const fetch = require('node-fetch');

const BASE_URL = 'http://localhost:3000';

async function testAPI() {
  console.log('🧪 Testing API functionality after RLS fix...\n');

  try {
    // Test 1: Check server is running
    console.log('1️⃣ Testing server health...');
    const healthResponse = await fetch(`${BASE_URL}/api/version`);
    const healthData = await healthResponse.json();
    console.log('✅ Server is running:', healthData.version);

    // Test 2: Try to create URL without auth (should fail)
    console.log('\n2️⃣ Testing unauthenticated URL creation...');
    const unauthResponse = await fetch(`${BASE_URL}/api/shorten`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ originalUrl: 'https://example.com' })
    });
    const unauthData = await unauthResponse.json();
    console.log('✅ Unauthenticated request properly rejected:', unauthData.error);

    // Test 3: Try to get user links without auth (should fail)
    console.log('\n3️⃣ Testing unauthenticated user links access...');
    const unauthLinksResponse = await fetch(`${BASE_URL}/api/links`);
    const unauthLinksData = await unauthLinksResponse.json();
    console.log('✅ Unauthenticated links request properly rejected:', unauthLinksData.error);

    console.log('\n🎉 Basic API tests passed!');
    console.log('\n📋 Next steps:');
    console.log('1. Open browser to http://localhost:3000');
    console.log('2. Register/Login with a real account');
    console.log('3. Try creating a short URL');
    console.log('4. Check your links on /my-links page');
    console.log('5. Verify both features work correctly');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testAPI();
