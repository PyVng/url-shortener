// Vercel Postgres (Neon) adapter for production deployment
const { sql } = require('@vercel/postgres');

class VercelPostgresAdapter {
  constructor(config) {
    this.tableName = 'urls';
    this.initialized = false;
  }

  async connect() {
    console.log('Connected to Vercel Postgres (Neon)');
    return this;
  }

  async disconnect() {
    console.log('Disconnected from Vercel Postgres');
  }

  async initialize() {
    try {
      // Create table if not exists
      await this.createTable();
      this.initialized = true;
      console.log('Vercel Postgres adapter initialized successfully');
      return true;
    } catch (error) {
      console.error('Failed to initialize Vercel Postgres adapter:', error);
      return false;
    }
  }

  async ensureInitialized() {
    if (!this.initialized) {
      await this.initialize();
    }
    return true;
  }

  async createTable() {
    try {
      await sql`
        CREATE TABLE IF NOT EXISTS urls (
          id SERIAL PRIMARY KEY,
          short_code VARCHAR(20) UNIQUE NOT NULL,
          original_url TEXT NOT NULL,
          user_id VARCHAR(100),
          title VARCHAR(255),
          click_count INTEGER DEFAULT 0,
          created_at TIMESTAMP DEFAULT NOW()
        );
      `;

      // Create indexes for better performance
      await sql`
        CREATE INDEX IF NOT EXISTS idx_short_code ON urls(short_code);
      `;

      await sql`
        CREATE INDEX IF NOT EXISTS idx_user_id ON urls(user_id);
      `;

      console.log('✅ Database table and indexes created successfully');
    } catch (error) {
      console.error('❌ Error creating table:', error);
      throw error;
    }
  }

  async createShortUrl(shortCode, originalUrl, userId = null) {
    await this.ensureInitialized();
    
    try {
      const result = await sql`
        INSERT INTO urls (short_code, original_url, user_id)
        VALUES (${shortCode}, ${originalUrl}, ${userId})
        RETURNING id, short_code, original_url, user_id, created_at
      `;

      return {
        id: result[0].id,
        shortCode: result[0].short_code,
        originalUrl: result[0].original_url,
        userId: result[0].user_id,
        createdAt: result[0].created_at,
      };
    } catch (error) {
      console.error('Error creating short URL:', error);
      throw error;
    }
  }

  async getOriginalUrl(shortCode) {
    await this.ensureInitialized();
    
    try {
      const result = await sql`
        SELECT original_url FROM urls WHERE short_code = ${shortCode}
      `;

      if (result.length === 0) {
        return null;
      }

      // Increment click count
      await sql`
        UPDATE urls 
        SET click_count = click_count + 1 
        WHERE short_code = ${shortCode}
      `;

      return result[0].original_url;
    } catch (error) {
      console.error('Error getting original URL:', error);
      throw error;
    }
  }

  async getAllUrls(limit = 100, offset = 0) {
    await this.ensureInitialized();
    
    try {
      const result = await sql`
        SELECT * FROM urls 
        ORDER BY created_at DESC 
        LIMIT ${limit} OFFSET ${offset}
      `;
      return result;
    } catch (error) {
      console.error('Error getting all URLs:', error);
      throw error;
    }
  }

  async getUrlStats(shortCode) {
    await this.ensureInitialized();
    
    try {
      const result = await sql`
        SELECT short_code, original_url, click_count, created_at 
        FROM urls 
        WHERE short_code = ${shortCode}
      `;
      return result.length > 0 ? result[0] : null;
    } catch (error) {
      console.error('Error getting URL stats:', error);
      throw error;
    }
  }

  async getUserLinks(userId, options = {}) {
    await this.ensureInitialized();
    
    try {
      const result = await sql`
        SELECT id, short_code, original_url, title, click_count, created_at 
        FROM urls 
        WHERE user_id = ${userId}
        ORDER BY created_at DESC
      `;

      return result.map(link => ({
        id: link.id,
        short_code: link.short_code,
        original_url: link.original_url,
        title: link.title,
        clicks: link.click_count || 0,
        created_at: link.created_at,
      }));
    } catch (error) {
      console.error('Error getting user links:', error);
      throw error;
    }
  }

  async getLinkById(id) {
    await this.ensureInitialized();
    
    try {
      const result = await sql`
        SELECT id, short_code, original_url, title, click_count, created_at, user_id 
        FROM urls 
        WHERE id = ${id}
      `;
      return result.length > 0 ? {
        id: result[0].id,
        short_code: result[0].short_code,
        original_url: result[0].original_url,
        title: result[0].title,
        clicks: result[0].click_count || 0,
        created_at: result[0].created_at,
        user_id: result[0].user_id,
      } : null;
    } catch (error) {
      console.error('Error getting link by ID:', error);
      throw error;
    }
  }

  async updateUserLink(id, updates) {
    await this.ensureInitialized();
    
    try {
      const { title, original_url, short_code } = updates;
      
      const result = await sql`
        UPDATE urls 
        SET 
          ${title !== undefined ? sql`title = ${title}` : sql``},
          ${original_url !== undefined ? sql`original_url = ${original_url}` : sql``},
          ${short_code !== undefined ? sql`short_code = ${short_code}` : sql``}
        WHERE id = ${id}
        RETURNING id, short_code, original_url, title, click_count, created_at, user_id
      `;

      if (result.length === 0) {
        throw new Error('Link not found');
      }

      return {
        id: result[0].id,
        short_code: result[0].short_code,
        original_url: result[0].original_url,
        title: result[0].title,
        clicks: result[0].click_count || 0,
        created_at: result[0].created_at,
        user_id: result[0].user_id,
      };
    } catch (error) {
      console.error('Error updating link:', error);
      throw error;
    }
  }

  async deleteUserLink(id) {
    await this.ensureInitialized();
    
    try {
      const result = await sql`
        DELETE FROM urls WHERE id = ${id}
      `;
      return true;
    } catch (error) {
      console.error('Error deleting link:', error);
      throw error;
    }
  }

  async ping() {
    try {
      await this.ensureInitialized();
      const result = await sql`SELECT 1`;
      return result.length > 0;
    } catch (error) {
      console.error('Database ping failed:', error);
      return false;
    }
  }
}

module.exports = VercelPostgresAdapter;
