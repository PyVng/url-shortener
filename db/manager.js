// Database Manager - Simplified interface for Supabase only
const SupabaseRestAdapter = require('./adapters/supabase_rest');

class DatabaseManager {
  constructor() {
    this.adapter = null;
  }

  // Initialize the database manager
  async initialize() {
    try {
      // Always use Supabase REST adapter
      const config = {
        name: 'supabase_rest',
        type: 'supabase_rest',
        url: process.env.SUPABASE_URL,
        anonKey: process.env.SUPABASE_ANON_KEY,
        serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY,
      };

      this.adapter = new SupabaseRestAdapter(config);
      await this.adapter.connect();
      await this.adapter.initialize();

      console.log('Database manager initialized with Supabase REST API');

      return this;
    } catch (error) {
      console.error('Database manager initialization error:', error);
      throw error;
    }
  }

  // Disconnect from database
  async disconnect() {
    if (this.adapter) {
      await this.adapter.disconnect();
    }
  }

  // Create a short URL
  async createShortUrl(shortCode, originalUrl, userId = null) {
    return await this.adapter.createShortUrl(shortCode, originalUrl, userId);
  }

  // Get original URL by short code
  async getOriginalUrl(shortCode) {
    return await this.adapter.getOriginalUrl(shortCode);
  }

  // Get all URLs
  async getAllUrls(limit = 100, offset = 0) {
    return await this.adapter.getAllUrls(limit, offset);
  }

  // Get URL statistics
  async getUrlStats(shortCode) {
    return await this.adapter.getUrlStats(shortCode);
  }

  // Health check
  async healthCheck() {
    const health = {
      status: false,
      timestamp: new Date().toISOString(),
    };

    try {
      health.status = await this.adapter.ping();
    } catch (error) {
      console.error('Database health check failed:', error.message);
    }

    return health;
  }

  // Get database statistics
  async getStats() {
    return {
      type: 'supabase_rest',
      name: 'Supabase REST API',
    };
  }

  // Rate limiting - always allow for now
  async checkRateLimit(identifier, limit = 100, window = 3600) {
    return true;
  }

  // User links operations
  async getUserLinks(userId, options = {}) {
    return await this.adapter.getUserLinks(userId, options);
  }

  async getLinkById(id) {
    return await this.adapter.getLinkById(id);
  }

  async updateUserLink(id, updates) {
    return await this.adapter.updateUserLink(id, updates);
  }

  async deleteUserLink(id) {
    return await this.adapter.deleteUserLink(id);
  }
}

// Create singleton instance
const dbManager = new DatabaseManager();

module.exports = dbManager;
