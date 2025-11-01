// MongoDB adapter for MongoDB Atlas
const { MongoClient } = require('mongodb');

class MongoDBAdapter {
  constructor(config) {
    this.config = config;
    this.client = null;
    this.db = null;
    this.isConnected = false;
  }

  async connect() {
    try {
      this.client = new MongoClient(this.config.connectionString, {
        maxPoolSize: 10,
        serverSelectionTimeoutMS: 5000,
        socketTimeoutMS: 45000,
      });

      await this.client.connect();
      this.db = this.client.db(this.config.databaseName);
      this.isConnected = true;
      console.log('Connected to MongoDB Atlas');
      return this.db;
    } catch (error) {
      console.error('MongoDB connection error:', error);
      throw error;
    }
  }

  async disconnect() {
    if (this.client && this.isConnected) {
      await this.client.close();
      this.isConnected = false;
      console.log('Disconnected from MongoDB');
    }
  }

  async initialize() {
    try {
      if (!this.isConnected) await this.connect();

      const collection = this.db.collection('urls');

      // Create indexes
      await collection.createIndex({ shortCode: 1 }, { unique: true });
      await collection.createIndex({ createdAt: -1 });
      await collection.createIndex({ clickCount: -1 });

      console.log('MongoDB database initialized');
    } catch (error) {
      console.error('MongoDB initialization error:', error);
      throw error;
    }
  }

  async createShortUrl(shortCode, originalUrl) {
    try {
      if (!this.isConnected) await this.connect();

      const collection = this.db.collection('urls');
      const doc = {
        shortCode,
        originalUrl,
        createdAt: new Date(),
        clickCount: 0,
      };

      const result = await collection.insertOne(doc);

      return {
        id: result.insertedId,
        shortCode,
        originalUrl,
        createdAt: doc.createdAt,
      };
    } catch (error) {
      if (error.code === 11000) {
        throw new Error('Short code already exists');
      }
      throw error;
    }
  }

  async getOriginalUrl(shortCode) {
    try {
      if (!this.isConnected) await this.connect();

      const collection = this.db.collection('urls');
      const doc = await collection.findOne({ shortCode });

      if (doc) {
        // Increment click count
        await this.incrementClickCount(shortCode);
        return doc.originalUrl;
      }

      return null;
    } catch (error) {
      throw error;
    }
  }

  async incrementClickCount(shortCode) {
    try {
      if (!this.isConnected) await this.connect();

      const collection = this.db.collection('urls');
      await collection.updateOne(
        { shortCode },
        { $inc: { clickCount: 1 } }
      );
    } catch (error) {
      console.error('Error incrementing click count:', error);
    }
  }

  async getAllUrls(limit = 100, offset = 0) {
    try {
      if (!this.isConnected) await this.connect();

      const collection = this.db.collection('urls');
      const urls = await collection
        .find({})
        .sort({ createdAt: -1 })
        .skip(offset)
        .limit(limit)
        .toArray();

      return urls;
    } catch (error) {
      throw error;
    }
  }

  async getUrlStats(shortCode) {
    try {
      if (!this.isConnected) await this.connect();

      const collection = this.db.collection('urls');
      const doc = await collection.findOne(
        { shortCode },
        { projection: { shortCode: 1, originalUrl: 1, clickCount: 1, createdAt: 1 } }
      );

      return doc || null;
    } catch (error) {
      throw error;
    }
  }

  // Additional MongoDB-specific methods
  async getUrlsByDateRange(startDate, endDate, limit = 100) {
    try {
      if (!this.isConnected) await this.connect();

      const collection = this.db.collection('urls');
      const urls = await collection
        .find({
          createdAt: {
            $gte: new Date(startDate),
            $lte: new Date(endDate),
          },
        })
        .sort({ createdAt: -1 })
        .limit(limit)
        .toArray();

      return urls;
    } catch (error) {
      throw error;
    }
  }

  async getTopClickedUrls(limit = 10) {
    try {
      if (!this.isConnected) await this.connect();

      const collection = this.db.collection('urls');
      const urls = await collection
        .find({})
        .sort({ clickCount: -1 })
        .limit(limit)
        .toArray();

      return urls;
    } catch (error) {
      throw error;
    }
  }

  async searchUrls(query, limit = 50) {
    try {
      if (!this.isConnected) await this.connect();

      const collection = this.db.collection('urls');
      const urls = await collection
        .find({
          $or: [
            { originalUrl: { $regex: query, $options: 'i' } },
            { shortCode: { $regex: query, $options: 'i' } },
          ],
        })
        .sort({ createdAt: -1 })
        .limit(limit)
        .toArray();

      return urls;
    } catch (error) {
      throw error;
    }
  }

  // Bulk operations
  async bulkCreateShortUrls(urlMappings) {
    try {
      if (!this.isConnected) await this.connect();

      const collection = this.db.collection('urls');
      const docs = urlMappings.map(({ shortCode, originalUrl }) => ({
        shortCode,
        originalUrl,
        createdAt: new Date(),
        clickCount: 0,
      }));

      const result = await collection.insertMany(docs);
      return result.insertedCount;
    } catch (error) {
      throw error;
    }
  }

  // Health check
  async ping() {
    try {
      if (!this.isConnected) await this.connect();
      await this.db.admin().ping();
      return true;
    } catch (error) {
      return false;
    }
  }
}

module.exports = MongoDBAdapter;
