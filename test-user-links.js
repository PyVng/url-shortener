// Test script for getUserLinks functionality
require('dotenv').config();
const dbManager = require('./db/manager');

async function testGetUserLinks() {
  try {
    console.log('🔍 Testing getUserLinks functionality...\n');

    // Initialize database manager
    await dbManager.initialize();
    console.log('✅ Database manager initialized\n');

    // Create a test URL with a mock userId (UUID format)
    const mockUserId = '550e8400-e29b-41d4-a716-446655440000'; // Mock UUID
    const testUrl = 'https://example.com/test-user-link-' + Date.now();
    const uniqueCode = 'usertest' + Date.now();

    console.log('🧪 Creating test URL with userId...');
    const result = await dbManager.createShortUrl(uniqueCode, testUrl, mockUserId);
    console.log('✅ Test URL created:', result);
    console.log('');

    // Test getUserLinks with the mock userId
    console.log('🔍 Testing getUserLinks with mock userId...');
    const userLinks = await dbManager.getUserLinks(mockUserId);
    console.log('✅ User links retrieved:', userLinks);
    console.log('Number of links:', userLinks.length);
    console.log('');

    // Test with a non-existent userId
    console.log('🔍 Testing getUserLinks with non-existent userId...');
    const emptyLinks = await dbManager.getUserLinks('00000000-0000-0000-0000-000000000000');
    console.log('✅ Empty result for non-existent user:', emptyLinks);
    console.log('Number of links:', emptyLinks.length);
    console.log('');

    console.log('🎉 getUserLinks tests completed!');

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
  testGetUserLinks();
}

module.exports = { testGetUserLinks };
