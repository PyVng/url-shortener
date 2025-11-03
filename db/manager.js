// Database Manager - Unified interface for multiple database providers
const { getActiveDatabaseConfig } = require('./config');

// Import adapters
const PostgreSQLAdapter = require('./adapters/postgresql');
const RedisAdapter = require('./adapters/redis');
const MongoDBAdapter = require('./adapters/mongodb');
const SQLiteAdapter = require('./adapters/sqlite');
const EdgeConfigAdapter = require('./adapters/edge_config');
const SupabaseRestAdapter = require('./adapters/supabase_rest');

class DatabaseManager {
  constructor() {
    this.primaryAdapter = null;
    this.cacheAdapter = null;
    this.adapters = {
      postgresql: PostgreSQLAdapter,
      neon: PostgreSQLAdapter,
      supabase: PostgreSQLAdapter,
      supabase_rest: SupabaseRestAdapter,
      vercel_postgres: PostgreSQLAdapter,
      redis: RedisAdapter,
      vercel_kv: RedisAdapter,
      mongodb: MongoDBAdapter,
      sqlite: SQLiteAdapter,
      turso: SQLiteAdapter,
      edge_config: EdgeConfigAdapter,
      vercel_edge_config: EdgeConfigAdapter,
    };
  }

  // Initialize the database manager
  async initialize() {
    try {
      const config = getActiveDatabaseConfig();

      // Initialize primary database
      const AdapterClass = this.adapters[config.type];
      if (!AdapterClass) {
        throw new Error(`Unsupported database type: ${config.type}`);
      }

      this.primaryAdapter = new AdapterClass(config);
      await this.primaryAdapter.connect();
      await this.primaryAdapter.initialize();

      console.log(`Database manager initialized with ${config.name} (${config.type})`);

      // Initialize Redis cache if configured
      if (process.env.UPSTASH_REDIS_URL) {
        try {
          const redisConfig = {
            name: 'redis',
            type: 'redis',
            url: process.env.UPSTASH_REDIS_URL,
            token: process.env.UPSTASH_REDIS_TOKEN,
          };
          this.cacheAdapter = new RedisAdapter(redisConfig);
          await this.cacheAdapter.connect();
          await this.cacheAdapter.initialize();
          console.log('Redis cache initialized');
        } catch (error) {
          console.warn('Failed to initialize Redis cache:', error.message);
        }
      }

      return this;
    } catch (error) {
      console.error('Database manager initialization error:', error);
      throw error;
    }
  }

  // Disconnect from all databases
  async disconnect() {
    if (this.primaryAdapter) {
      await this.primaryAdapter.disconnect();
    }
    if (this.cacheAdapter) {
      await this.cacheAdapter.disconnect();
    }
  }

  // Create a short URL
  async createShortUrl(shortCode, originalUrl, userId = null) {
    try {
      const result = await this.primaryAdapter.createShortUrl(shortCode, originalUrl, userId);

      // Cache the URL if Redis is available
      if (this.cacheAdapter) {
        try {
          await this.cacheAdapter.cacheUrl(shortCode, originalUrl);
        } catch (error) {
          console.warn('Failed to cache URL:', error.message);
        }
      }

      return result;
    } catch (error) {
      throw error;
    }
  }

  // Get original URL by short code
  async getOriginalUrl(shortCode) {
    try {
      // Try cache first
      if (this.cacheAdapter) {
        try {
          const cachedUrl = await this.cacheAdapter.getCachedUrl(shortCode);
          if (cachedUrl) {
            // Increment click count in cache
            await this.cacheAdapter.incrementClickCount(shortCode);
            return cachedUrl;
          }
        } catch (error) {
          console.warn('Cache read error:', error.message);
        }
      }

      // Fallback to primary database
      const originalUrl = await this.primaryAdapter.getOriginalUrl(shortCode);

      // Cache the result if found
      if (originalUrl && this.cacheAdapter) {
        try {
          await this.cacheAdapter.cacheUrl(shortCode, originalUrl);
        } catch (error) {
          console.warn('Failed to cache URL:', error.message);
        }
      }

      return originalUrl;
    } catch (error) {
      throw error;
    }
  }

  // Get all URLs
  async getAllUrls(limit = 100, offset = 0) {
    return await this.primaryAdapter.getAllUrls(limit, offset);
  }

  // Get URL statistics
  async getUrlStats(shortCode) {
    try {
      const stats = await this.primaryAdapter.getUrlStats(shortCode);

      // Add cached click count if available
      if (stats && this.cacheAdapter) {
        try {
          const cachedClicks = await this.cacheAdapter.getClickCount(shortCode);
          if (cachedClicks > 0) {
            stats.clickCount = (stats.clickCount || 0) + cachedClicks;
          }
        } catch (error) {
          console.warn('Failed to get cached click count:', error.message);
        }
      }

      return stats;
    } catch (error) {
      throw error;
    }
  }

  // Health check for all databases
  async healthCheck() {
    const health = {
      primary: false,
      cache: false,
      timestamp: new Date().toISOString(),
    };

    try {
      health.primary = await this.primaryAdapter.ping();
    } catch (error) {
      console.error('Primary database health check failed:', error.message);
    }

    if (this.cacheAdapter) {
      try {
        health.cache = await this.cacheAdapter.ping();
      } catch (error) {
        console.error('Cache database health check failed:', error.message);
      }
    }

    return health;
  }

  // Get database statistics
  async getStats() {
    const stats = {
      primary: {
        type: this.primaryAdapter?.config?.type,
        name: this.primaryAdapter?.config?.name,
      },
      cache: {
        enabled: !!this.cacheAdapter,
        type: this.cacheAdapter?.config?.type,
      },
    };

    // Add database-specific stats
    if (this.primaryAdapter.config.type === 'sqlite' && this.primaryAdapter.getDatabaseStats) {
      try {
        stats.primary.stats = await this.primaryAdapter.getDatabaseStats();
      } catch (error) {
        console.warn('Failed to get database stats:', error.message);
      }
    }

    return stats;
  }

  // Rate limiting check
  async checkRateLimit(identifier, limit = 100, window = 3600) {
    if (this.cacheAdapter && this.cacheAdapter.checkRateLimit) {
      return await this.cacheAdapter.checkRateLimit(identifier, limit, window);
    }
    // Allow all requests if no Redis cache
    return true;
  }

  // MongoDB-specific methods
  async getUrlsByDateRange(startDate, endDate, limit = 100) {
    if (this.primaryAdapter.getUrlsByDateRange) {
      return await this.primaryAdapter.getUrlsByDateRange(startDate, endDate, limit);
    }
    throw new Error('Method not supported by current database');
  }

  async getTopClickedUrls(limit = 10) {
    if (this.primaryAdapter.getTopClickedUrls) {
      return await this.primaryAdapter.getTopClickedUrls(limit);
    }
    throw new Error('Method not supported by current database');
  }

  async searchUrls(query, limit = 50) {
    if (this.primaryAdapter.searchUrls) {
      return await this.primaryAdapter.searchUrls(query, limit);
    }
    throw new Error('Method not supported by current database');
  }

  async bulkCreateShortUrls(urlMappings) {
    if (this.primaryAdapter.bulkCreateShortUrls) {
      return await this.primaryAdapter.bulkCreateShortUrls(urlMappings);
    }
    throw new Error('Method not supported by current database');
  }

  // User links operations
  async getUserLinks(userId) {
    if (this.primaryAdapter.getUserLinks) {
      return await this.primaryAdapter.getUserLinks(userId);
    }
    throw new Error('Method not supported by current database');
  }

  async getLinkById(id) {
    if (this.primaryAdapter.getLinkById) {
      return await this.primaryAdapter.getLinkById(id);
    }
    throw new Error('Method not supported by current database');
  }

  async updateUserLink(id, updates) {
    if (this.primaryAdapter.updateUserLink) {
      return await this.primaryAdapter.updateUserLink(id, updates);
    }
    throw new Error('Method not supported by current database');
  }

  async deleteUserLink(id) {
    if (this.primaryAdapter.deleteUserLink) {
      return await this.primaryAdapter.deleteUserLink(id);
    }
    throw new Error('Method not supported by current database');
  }
}

// Create singleton instance
const dbManager = new DatabaseManager();

module.exports = dbManager;
