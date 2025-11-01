// Vercel Edge Config adapter
// Note: Edge Config is optimized for reads, not frequent writes
// Best for static/cached data that changes infrequently

class EdgeConfigAdapter {
  constructor(config) {
    this.config = config;
    this.client = null;
    this.isConnected = false;
  }

  async connect() {
    try {
      // Vercel Edge Config is available globally via process.env
      // No explicit connection needed
      this.isConnected = true;
      console.log('Connected to Vercel Edge Config');
      return this.config.connectionString;
    } catch (error) {
      console.error('Edge Config connection error:', error);
      throw error;
    }
  }

  async disconnect() {
    // Edge Config doesn't require explicit disconnection
    this.isConnected = false;
    console.log('Disconnected from Vercel Edge Config');
  }

  async initialize() {
    // Edge Config doesn't need explicit initialization
    console.log('Edge Config adapter initialized');
  }

  async createShortUrl(shortCode, originalUrl) {
    try {
      if (!this.isConnected) await this.connect();

      // Edge Config doesn't support direct writes from serverless functions
      // This would need to be done via Vercel API or dashboard
      // For now, we'll simulate it (in production, you'd use Vercel's REST API)

      const key = `url:${shortCode}`;
      const data = {
        shortCode,
        originalUrl,
        createdAt: new Date().toISOString(),
        clickCount: 0,
      };

      // In a real implementation, you'd use Vercel's Edge Config API
      // For now, we'll throw an error to indicate this limitation
      throw new Error('Edge Config writes must be done via Vercel API or dashboard');

      // return {
      //   id: key,
      //   shortCode,
      //   originalUrl,
      //   createdAt: data.createdAt,
      // };
    } catch (error) {
      throw error;
    }
  }

  async getOriginalUrl(shortCode) {
    try {
      if (!this.isConnected) await this.connect();

      // In Vercel Edge Config, data is available via process.env
      // But for dynamic data, you'd typically use the @vercel/edge-config package
      const edgeConfig = require('@vercel/edge-config');

      const key = `url:${shortCode}`;
      const data = await edgeConfig.get(key);

      if (data) {
        // Increment click count (this would also need API call in production)
        return data.originalUrl;
      }

      return null;
    } catch (error) {
      throw error;
    }
  }

  async getAllUrls(limit = 100, offset = 0) {
    // Edge Config doesn't support listing all keys efficiently
    // This is a major limitation for administrative functions
    throw new Error('Edge Config does not support listing all URLs');
  }

  async getUrlStats(shortCode) {
    try {
      if (!this.isConnected) await this.connect();

      const edgeConfig = require('@vercel/edge-config');
      const key = `url:${shortCode}`;
      const data = await edgeConfig.get(key);

      return data || null;
    } catch (error) {
      throw error;
    }
  }

  // Edge Config specific limitations:
  // - No direct writes from serverless functions
  // - Limited to 1MB total data
  // - Optimized for reads, not writes
  // - No complex queries
  // - Data must be updated via Vercel API or dashboard

  async ping() {
    try {
      if (!this.isConnected) await this.connect();
      // Simple ping check
      return !!process.env.EDGE_CONFIG;
    } catch (error) {
      return false;
    }
  }
}

module.exports = EdgeConfigAdapter;
