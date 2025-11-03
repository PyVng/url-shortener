// Test script for Supabase connection
require('dotenv').config();
const { getActiveDatabaseConfig } = require('./db/config');
const dbManager = require('./db/manager');

async function testSupabaseConnection() {
  try {
    console.log('🔍 Testing Supabase connection...\n');

    // Check configuration
    const config = getActiveDatabaseConfig();
    console.log('📋 Active Database Config:');
    console.log(`   Type: ${config.name} (${config.type})`);
    console.log(`   Connection: ${config.connectionString ? '✅ Set' : '❌ Not set'}\n`);

    // Initialize database manager
    console.log('🔧 Initializing database manager...');
    await dbManager.initialize();
    console.log('✅ Database manager initialized\n');

    // Test health check
    console.log('🏥 Running health check...');
    const health = await dbManager.healthCheck();
    console.log('Health Status:', health);
    console.log('');

    // Test creating a URL
    console.log('🧪 Testing URL creation...');
    const testUrl = 'https://example.com/test-url-' + Date.now();
    const uniqueCode = 'test' + Date.now();
    const result = await dbManager.createShortUrl(uniqueCode, testUrl);
    console.log('✅ URL created:', result);
    console.log('');

    // Test getting URL
    console.log('🔍 Testing URL retrieval...');
    const retrievedUrl = await dbManager.getOriginalUrl(uniqueCode);
    console.log('✅ URL retrieved:', retrievedUrl);
    console.log('');

    // Test getting stats
    console.log('📊 Testing URL stats...');
    const stats = await dbManager.getUrlStats(uniqueCode);
    console.log('✅ URL stats:', stats);
    console.log('');

    console.log('🎉 All tests passed! Supabase is working correctly.');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error('Stack:', error.stack);
  } finally {
    // Close connections
    try {
      await dbManager.disconnect();
      console.log('🔌 Database connections closed');
    } catch (error) {
      console.error('Error closing connections:', error.message);
    }
  }
}

// Run the test
if (require.main === module) {
  testSupabaseConnection();
}

module.exports = { testSupabaseConnection };
