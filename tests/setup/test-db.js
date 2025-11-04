// Test database setup utilities
const dbManager = require('../../db/manager');
const { supabase } = require('../../db/supabase');

class TestDatabase {
  static async setup() {
    try {
      console.log('🔧 Setting up test database...');

      // Initialize database manager
      await dbManager.initialize();

      // Create test tables if they don't exist
      await this.createTestTables();

      console.log('✅ Test database setup complete');
    } catch (error) {
      console.error('❌ Failed to setup test database:', error);
      throw error;
    }
  }

  static async teardown() {
    try {
      console.log('🧹 Cleaning up test database...');

      // Clean up test data
      await this.cleanTestData();

      // Close database connections
      await dbManager.disconnect();

      console.log('✅ Test database cleanup complete');
    } catch (error) {
      console.error('❌ Failed to cleanup test database:', error);
      throw error;
    }
  }

  static async createTestTables() {
    // Test tables are created by the database manager
    // This method can be extended for additional test-specific setup
  }

  static async cleanTestData() {
    try {
      // Clean up test URLs (those with test- prefix in original_url)
      const query = `
        DELETE FROM urls
        WHERE original_url LIKE 'https://example.com/test-%'
        OR short_code LIKE 'test%'
      `;

      await dbManager.executeQuery(query);
    } catch (error) {
      console.warn('Warning: Could not clean test data:', error.message);
    }
  }

  static async createTestUser(userData = {}) {
    const defaultUser = {
      email: `test-${Date.now()}@example.com`,
      password: 'testpassword123',
      name: 'Test User'
    };

    const user = { ...defaultUser, ...userData };

    try {
      // Create user in Supabase Auth
      const { data, error } = await supabase.auth.signUp({
        email: user.email,
        password: user.password,
        options: {
          data: { name: user.name }
        }
      });

      if (error) throw error;

      return {
        id: data.user.id,
        email: data.user.email,
        name: user.name,
        authData: data
      };
    } catch (error) {
      console.error('Failed to create test user:', error);
      throw error;
    }
  }

  static async deleteTestUser(userId) {
    try {
      // Note: In Supabase, users are typically not deleted from auth
      // but we can clean up their data
      await dbManager.executeQuery('DELETE FROM urls WHERE user_id = $1', [userId]);
    } catch (error) {
      console.warn('Warning: Could not delete test user data:', error.message);
    }
  }

  static async createTestUrl(originalUrl, userId = null) {
    const shortCode = `test${Date.now()}${Math.random().toString(36).substring(2, 6)}`;

    try {
      const result = await dbManager.createShortUrl(shortCode, originalUrl, userId);
      return result;
    } catch (error) {
      console.error('Failed to create test URL:', error);
      throw error;
    }
  }
}

module.exports = TestDatabase;
