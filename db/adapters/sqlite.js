// SQLite adapter for local development
const sqlite3 = require('sqlite3').verbose();
const { promisify } = require('util');

class SqliteAdapter {
  constructor(config) {
    this.dbPath = process.env.SQLITE_DATABASE_PATH || './db/local.db';
    this.tableName = 'urls';
    this.initialized = false;
    this.db = null;
  }

  async connect() {
    return new Promise((resolve, reject) => {
      this.db = new sqlite3.Database(this.dbPath, (err) => {
        if (err) {
          console.error('Error opening SQLite database:', err);
          reject(err);
        } else {
          console.log('Connected to SQLite database');
          resolve(this);
        }
      });
    });
  }

  async disconnect() {
    return new Promise((resolve) => {
      if (this.db) {
        this.db.close((err) => {
          if (err) {
            console.error('Error closing SQLite database:', err);
          } else {
            console.log('Disconnected from SQLite database');
          }
          resolve();
        });
      } else {
        resolve();
      }
    });
  }

  async initialize() {
    try {
      await this.connect();

      // Create table if not exists
      await this.run(`
        CREATE TABLE IF NOT EXISTS urls (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          short_code VARCHAR(20) UNIQUE NOT NULL,
          original_url TEXT NOT NULL,
          user_id VARCHAR(100),
          title VARCHAR(255),
          click_count INTEGER DEFAULT 0,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );
      `);

      // Create indexes for better performance
      await this.run(`
        CREATE INDEX IF NOT EXISTS idx_short_code ON urls(short_code);
      `);

      await this.run(`
        CREATE INDEX IF NOT EXISTS idx_user_id ON urls(user_id);
      `);

      this.initialized = true;
      console.log('SQLite adapter initialized successfully');
      return true;
    } catch (error) {
      console.error('Failed to initialize SQLite adapter:', error);
      return false;
    }
  }

  async ensureInitialized() {
    if (!this.initialized) {
      await this.initialize();
    }
    return true;
  }

  run(sql, params = []) {
    return new Promise((resolve, reject) => {
      this.db.run(sql, params, function(err) {
        if (err) {
          reject(err);
        } else {
          resolve({ id: this.lastID, changes: this.changes });
        }
      });
    });
  }

  get(sql, params = []) {
    return new Promise((resolve, reject) => {
      this.db.get(sql, params, (err, row) => {
        if (err) {
          reject(err);
        } else {
          resolve(row);
        }
      });
    });
  }

  all(sql, params = []) {
    return new Promise((resolve, reject) => {
      this.db.all(sql, params, (err, rows) => {
        if (err) {
          reject(err);
        } else {
          resolve(rows);
        }
      });
    });
  }

  async createShortUrl(shortCode, originalUrl, userId = null) {
    await this.ensureInitialized();

    try {
      const result = await this.run(
        'INSERT INTO urls (short_code, original_url, user_id) VALUES (?, ?, ?)',
        [shortCode, originalUrl, userId]
      );

      return {
        id: result.id.toString(),
        shortCode: shortCode,
        originalUrl: originalUrl,
        userId: userId,
        createdAt: new Date().toISOString(),
      };
    } catch (error) {
      console.error('Error creating short URL:', error);
      throw error;
    }
  }

  async getOriginalUrl(shortCode) {
    await this.ensureInitialized();

    try {
      const row = await this.get(
        'SELECT original_url FROM urls WHERE short_code = ?',
        [shortCode]
      );

      if (!row) {
        return null;
      }

      // Increment click count
      await this.run(
        'UPDATE urls SET click_count = click_count + 1 WHERE short_code = ?',
        [shortCode]
      );

      return row.original_url;
    } catch (error) {
      console.error('Error getting original URL:', error);
      throw error;
    }
  }

  async getAllUrls(limit = 100, offset = 0) {
    await this.ensureInitialized();

    try {
      const rows = await this.all(
        'SELECT * FROM urls ORDER BY created_at DESC LIMIT ? OFFSET ?',
        [limit, offset]
      );
      return rows;
    } catch (error) {
      console.error('Error getting all URLs:', error);
      throw error;
    }
  }

  async getUrlStats(shortCode) {
    await this.ensureInitialized();

    try {
      const row = await this.get(
        'SELECT short_code, original_url, click_count, created_at FROM urls WHERE short_code = ?',
        [shortCode]
      );
      return row || null;
    } catch (error) {
      console.error('Error getting URL stats:', error);
      throw error;
    }
  }

  async getUserLinks(userId, options = {}) {
    await this.ensureInitialized();

    try {
      const rows = await this.all(
        'SELECT id, short_code, original_url, title, click_count, created_at FROM urls WHERE user_id = ? ORDER BY created_at DESC',
        [userId]
      );

      return rows.map(link => ({
        id: link.id.toString(),
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
      const row = await this.get(
        'SELECT id, short_code, original_url, title, click_count, created_at, user_id FROM urls WHERE id = ?',
        [id]
      );

      if (!row) {
        return null;
      }

      return {
        id: row.id.toString(),
        short_code: row.short_code,
        original_url: row.original_url,
        title: row.title,
        clicks: row.click_count || 0,
        created_at: row.created_at,
        user_id: row.user_id,
      };
    } catch (error) {
      console.error('Error getting link by ID:', error);
      throw error;
    }
  }

  async updateUserLink(id, updates) {
    await this.ensureInitialized();

    try {
      const { title, original_url, short_code } = updates;

      let sql = 'UPDATE urls SET ';
      const params = [];
      const updatesArr = [];

      if (title !== undefined) {
        updatesArr.push('title = ?');
        params.push(title);
      }
      if (original_url !== undefined) {
        updatesArr.push('original_url = ?');
        params.push(original_url);
      }
      if (short_code !== undefined) {
        updatesArr.push('short_code = ?');
        params.push(short_code);
      }

      sql += updatesArr.join(', ') + ' WHERE id = ?';
      params.push(id);

      await this.run(sql, params);

      // Return updated link
      return await this.getLinkById(id);
    } catch (error) {
      console.error('Error updating link:', error);
      throw error;
    }
  }

  async deleteUserLink(id) {
    await this.ensureInitialized();

    try {
      await this.run('DELETE FROM urls WHERE id = ?', [id]);
      return true;
    } catch (error) {
      console.error('Error deleting link:', error);
      throw error;
    }
  }

  async ping() {
    try {
      await this.ensureInitialized();
      await this.get('SELECT 1');
      return true;
    } catch (error) {
      console.error('Database ping failed:', error);
      return false;
    }
  }
}

module.exports = SqliteAdapter;
