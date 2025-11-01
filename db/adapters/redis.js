// Redis adapter for Upstash Redis (caching layer)
const { createClient } = require('redis');

class RedisAdapter {
  constructor(config) {
    this.config = config;
    this.client = null;
    this.isConnected = false;
  }

  async connect() {
    try {
      this.client = createClient({
        url: this.config.url,
        password: this.config.token,
      });

      this.client.on('error', (err) => console.error('Redis Client Error', err));
      this.client.on('connect', () => console.log('Connected to Redis (Upstash)'));

      await this.client.connect();
      this.isConnected = true;
      return this.client;
    } catch (error) {
      console.error('Redis connection error:', error);
      throw error;
    }
  }

  async disconnect() {
    if (this.client && this.isConnected) {
      await this.client.disconnect();
      this.isConnected = false;
      console.log('Disconnected from Redis');
    }
  }

  async initialize() {
    // Redis doesn't need explicit initialization like SQL databases
    console.log('Redis adapter initialized');
  }

  // Cache operations for URL shortener
  async cacheUrl(shortCode, originalUrl, ttl = 3600) {
    try {
      if (!this.isConnected) await this.connect();

      const key = `url:${shortCode}`;
      await this.client.setEx(key, ttl, originalUrl);
      console.log(`Cached URL: ${shortCode} -> ${originalUrl}`);
    } catch (error) {
      console.error('Error caching URL:', error);
      throw error;
    }
  }

  async getCachedUrl(shortCode) {
    try {
      if (!this.isConnected) await this.connect();

      const key = `url:${shortCode}`;
      const cachedUrl = await this.client.get(key);

      if (cachedUrl) {
        console.log(`Cache hit for: ${shortCode}`);
        // Refresh TTL on cache hit
        await this.client.expire(key, 3600);
      }

      return cachedUrl;
    } catch (error) {
      console.error('Error getting cached URL:', error);
      return null;
    }
  }

  async invalidateCache(shortCode) {
    try {
      if (!this.isConnected) await this.connect();

      const key = `url:${shortCode}`;
      await this.client.del(key);
      console.log(`Invalidated cache for: ${shortCode}`);
    } catch (error) {
      console.error('Error invalidating cache:', error);
    }
  }

  // Click tracking with Redis
  async incrementClickCount(shortCode) {
    try {
      if (!this.isConnected) await this.connect();

      const key = `clicks:${shortCode}`;
      const count = await this.client.incr(key);
      // Set expiration for click counts (30 days)
      await this.client.expire(key, 30 * 24 * 60 * 60);
      return count;
    } catch (error) {
      console.error('Error incrementing click count:', error);
      return 0;
    }
  }

  async getClickCount(shortCode) {
    try {
      if (!this.isConnected) await this.connect();

      const key = `clicks:${shortCode}`;
      const count = await this.client.get(key);
      return parseInt(count) || 0;
    } catch (error) {
      console.error('Error getting click count:', error);
      return 0;
    }
  }

  // Rate limiting
  async checkRateLimit(identifier, limit = 100, window = 3600) {
    try {
      if (!this.isConnected) await this.connect();

      const key = `ratelimit:${identifier}`;
      const current = await this.client.incr(key);

      if (current === 1) {
        await this.client.expire(key, window);
      }

      return current <= limit;
    } catch (error) {
      console.error('Error checking rate limit:', error);
      return true; // Allow request if Redis fails
    }
  }

  // Analytics caching
  async cacheAnalytics(shortCode, data, ttl = 300) {
    try {
      if (!this.isConnected) await this.connect();

      const key = `analytics:${shortCode}`;
      await this.client.setEx(key, ttl, JSON.stringify(data));
    } catch (error) {
      console.error('Error caching analytics:', error);
    }
  }

  async getCachedAnalytics(shortCode) {
    try {
      if (!this.isConnected) await this.connect();

      const key = `analytics:${shortCode}`;
      const data = await this.client.get(key);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error('Error getting cached analytics:', error);
      return null;
    }
  }

  // Health check
  async ping() {
    try {
      if (!this.isConnected) await this.connect();
      return await this.client.ping();
    } catch (error) {
      return false;
    }
  }
}

module.exports = RedisAdapter;
