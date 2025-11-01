// PostgreSQL adapter for Neon, Supabase, and local PostgreSQL
const { Pool } = require('pg');
const { neon } = require('@neondatabase/serverless');

class PostgreSQLAdapter {
  constructor(config) {
    this.config = config;
    this.pool = null;
    this.isNeon = config.name === 'neon';
  }

  async connect() {
    try {
      if (this.isNeon) {
        // Use Neon serverless for Neon databases
        this.pool = neon(this.config.connectionString);
      } else {
        // Use regular pg Pool for Supabase and local PostgreSQL
        this.pool = new Pool(this.config);
      }
      console.log(`Connected to PostgreSQL (${this.config.name})`);
      return this.pool;
    } catch (error) {
      console.error('PostgreSQL connection error:', error);
      throw error;
    }
  }

  async disconnect() {
    if (this.pool && !this.isNeon) {
      await this.pool.end();
      console.log('Disconnected from PostgreSQL');
    }
  }

  async initialize() {
    try {
      if (!this.isConnected) await this.connect();

      // Execute statements separately for Neon serverless compatibility
      const statements = [
        `CREATE TABLE IF NOT EXISTS urls (
          id SERIAL PRIMARY KEY,
          short_code TEXT UNIQUE NOT NULL,
          original_url TEXT NOT NULL,
          user_id TEXT,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          click_count INTEGER DEFAULT 0
        )`,
        `CREATE INDEX IF NOT EXISTS idx_short_code ON urls(short_code)`,
        `CREATE INDEX IF NOT EXISTS idx_created_at ON urls(created_at DESC)`,
        `CREATE INDEX IF NOT EXISTS idx_user_id ON urls(user_id)`
      ];

      if (this.isNeon) {
        // Execute each statement separately for Neon
        for (const sql of statements) {
          await this.pool(sql);
        }
      } else {
        // Use transaction for regular PostgreSQL
        const client = await this.pool.connect();
        try {
          await client.query('BEGIN');
          for (const sql of statements) {
            await client.query(sql);
          }
          await client.query('COMMIT');
        } catch (error) {
          await client.query('ROLLBACK');
          throw error;
        } finally {
          client.release();
        }
      }

      console.log('PostgreSQL database initialized');
    } catch (error) {
      console.error('PostgreSQL initialization error:', error);
      throw error;
    }
  }

  async createShortUrl(shortCode, originalUrl, userId = null) {
    try {
      const sql = userId
        ? 'INSERT INTO urls (short_code, original_url, user_id) VALUES ($1, $2, $3) RETURNING id, created_at'
        : 'INSERT INTO urls (short_code, original_url) VALUES ($1, $2) RETURNING id, created_at';

      const params = userId ? [shortCode, originalUrl, userId] : [shortCode, originalUrl];
      let result;

      if (this.isNeon) {
        result = await this.pool(sql, params);
      } else {
        const client = await this.pool.connect();
        result = await client.query(sql, params);
        client.release();
      }

      return {
        id: result.rows ? result.rows[0].id : result[0].id,
        shortCode,
        originalUrl,
        userId,
        createdAt: result.rows ? result.rows[0].created_at : result[0].created_at,
      };
    } catch (error) {
      throw error;
    }
  }

  async getOriginalUrl(shortCode) {
    try {
      const sql = 'SELECT original_url, click_count FROM urls WHERE short_code = $1';
      let result;

      if (this.isNeon) {
        result = await this.pool(sql, [shortCode]);
      } else {
        const client = await this.pool.connect();
        result = await client.query(sql, [shortCode]);
        client.release();
      }

      if (result.rows && result.rows.length > 0) {
        // Increment click count
        await this.incrementClickCount(shortCode);
        return result.rows[0].original_url;
      } else if (result.length > 0) {
        await this.incrementClickCount(shortCode);
        return result[0].original_url;
      }

      return null;
    } catch (error) {
      throw error;
    }
  }

  async incrementClickCount(shortCode) {
    try {
      const sql = 'UPDATE urls SET click_count = click_count + 1 WHERE short_code = $1';

      if (this.isNeon) {
        await this.pool(sql, [shortCode]);
      } else {
        const client = await this.pool.connect();
        await client.query(sql, [shortCode]);
        client.release();
      }
    } catch (error) {
      console.error('Error incrementing click count:', error);
    }
  }

  async getAllUrls(limit = 100, offset = 0) {
    try {
      const sql = 'SELECT * FROM urls ORDER BY created_at DESC LIMIT $1 OFFSET $2';
      let result;

      if (this.isNeon) {
        result = await this.pool(sql, [limit, offset]);
      } else {
        const client = await this.pool.connect();
        result = await client.query(sql, [limit, offset]);
        client.release();
      }

      return result.rows || result;
    } catch (error) {
      throw error;
    }
  }

  async getUrlStats(shortCode) {
    try {
      const sql = 'SELECT short_code, original_url, click_count, created_at FROM urls WHERE short_code = $1';
      let result;

      if (this.isNeon) {
        result = await this.pool(sql, [shortCode]);
      } else {
        const client = await this.pool.connect();
        result = await client.query(sql, [shortCode]);
        client.release();
      }

      return result.rows && result.rows.length > 0 ? result.rows[0] : (result.length > 0 ? result[0] : null);
    } catch (error) {
      throw error;
    }
  }
}

module.exports = PostgreSQLAdapter;
