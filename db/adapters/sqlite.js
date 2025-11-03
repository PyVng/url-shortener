// SQLite adapter for Turso and local SQLite
const sqlite3 = require('sqlite3').verbose();
const { createClient } = require('@libsql/client');

class SQLiteAdapter {
  constructor(config) {
    this.config = config;
    this.db = null;
    this.isTurso = config.url && config.url.includes('turso');
  }

  async connect() {
    try {
      if (this.isTurso) {
        // Use Turso client
        this.db = createClient({
          url: this.config.url,
          authToken: this.config.authToken,
        });
        console.log('Connected to Turso SQLite');
      } else {
        // Use local SQLite
        this.db = new sqlite3.Database(this.config.filename);
        console.log('Connected to local SQLite');
      }
      return this.db;
    } catch (error) {
      console.error('SQLite connection error:', error);
      throw error;
    }
  }

  async disconnect() {
    if (this.db) {
      if (this.isTurso) {
        // Turso client doesn't have explicit disconnect
      } else {
        this.db.close();
      }
      console.log('Disconnected from SQLite');
    }
  }

  async initialize() {
    try {
      const sql = `
        CREATE TABLE IF NOT EXISTS urls (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          short_code TEXT UNIQUE NOT NULL,
          original_url TEXT NOT NULL,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          click_count INTEGER DEFAULT 0,
          user_id TEXT,
          title TEXT
        );

        CREATE INDEX IF NOT EXISTS idx_short_code ON urls(short_code);
        CREATE INDEX IF NOT EXISTS idx_created_at ON urls(created_at DESC);
        CREATE INDEX IF NOT EXISTS idx_click_count ON urls(click_count DESC);
        CREATE INDEX IF NOT EXISTS idx_user_id ON urls(user_id);
      `;

      if (this.isTurso) {
        await this.db.execute(sql);
      } else {
        await this.run(sql);
      }

      console.log('SQLite database initialized');
    } catch (error) {
      console.error('SQLite initialization error:', error);
      throw error;
    }
  }

  async createShortUrl(shortCode, originalUrl, userId = null) {
    try {
      const sql = userId
        ? 'INSERT INTO urls (short_code, original_url, user_id) VALUES (?, ?, ?) RETURNING id, created_at'
        : 'INSERT INTO urls (short_code, original_url) VALUES (?, ?) RETURNING id, created_at';

      const params = userId ? [shortCode, originalUrl, userId] : [shortCode, originalUrl];
      let result;

      if (this.isTurso) {
        result = await this.db.execute({
          sql,
          args: params,
        });
        return {
          id: result.rows[0].id,
          shortCode,
          originalUrl,
          createdAt: result.rows[0].created_at,
        };
      } else {
        result = await this.run(sql, params);
        return {
          id: result.lastID,
          shortCode,
          originalUrl,
          createdAt: new Date().toISOString(),
        };
      }
    } catch (error) {
      if (error.message && error.message.includes('UNIQUE constraint failed')) {
        throw new Error('Short code already exists');
      }
      throw error;
    }
  }

  async getOriginalUrl(shortCode) {
    try {
      const sql = 'SELECT original_url FROM urls WHERE short_code = ?';
      let result;

      if (this.isTurso) {
        result = await this.db.execute({
          sql,
          args: [shortCode],
        });
        if (result.rows.length > 0) {
          await this.incrementClickCount(shortCode);
          return result.rows[0].original_url;
        }
      } else {
        result = await this.get(sql, [shortCode]);
        if (result) {
          await this.incrementClickCount(shortCode);
          return result.original_url;
        }
      }

      return null;
    } catch (error) {
      throw error;
    }
  }

  async incrementClickCount(shortCode) {
    try {
      const sql = 'UPDATE urls SET click_count = click_count + 1 WHERE short_code = ?';

      if (this.isTurso) {
        await this.db.execute({
          sql,
          args: [shortCode],
        });
      } else {
        await this.run(sql, [shortCode]);
      }
    } catch (error) {
      console.error('Error incrementing click count:', error);
    }
  }

  async getAllUrls(limit = 100, offset = 0) {
    try {
      const sql = 'SELECT * FROM urls ORDER BY created_at DESC LIMIT ? OFFSET ?';
      let result;

      if (this.isTurso) {
        result = await this.db.execute({
          sql,
          args: [limit, offset],
        });
        return result.rows;
      } else {
        result = await this.all(sql, [limit, offset]);
        return result;
      }
    } catch (error) {
      throw error;
    }
  }

  async getUrlStats(shortCode) {
    try {
      const sql = 'SELECT short_code, original_url, click_count, created_at FROM urls WHERE short_code = ?';
      let result;

      if (this.isTurso) {
        result = await this.db.execute({
          sql,
          args: [shortCode],
        });
        return result.rows.length > 0 ? result.rows[0] : null;
      } else {
        result = await this.get(sql, [shortCode]);
        return result || null;
      }
    } catch (error) {
      throw error;
    }
  }

  // SQLite-specific helper methods
  run(sql, params = []) {
    return new Promise((resolve, reject) => {
      this.db.run(sql, params, function(err) {
        if (err) {
          reject(err);
        } else {
          resolve({ lastID: this.lastID, changes: this.changes });
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

  // Additional SQLite-specific methods
  async getDatabaseStats() {
    try {
      const sql = `
        SELECT
          COUNT(*) as total_urls,
          SUM(click_count) as total_clicks,
          AVG(click_count) as avg_clicks,
          MAX(created_at) as latest_url,
          MIN(created_at) as oldest_url
        FROM urls
      `;

      if (this.isTurso) {
        const result = await this.db.execute({ sql });
        return result.rows[0];
      } else {
        const result = await this.get(sql);
        return result;
      }
    } catch (error) {
      throw error;
    }
  }

  async vacuum() {
    try {
      if (!this.isTurso) {
        await this.run('VACUUM');
        console.log('SQLite database vacuumed');
      }
    } catch (error) {
      console.error('Error vacuuming database:', error);
    }
  }

  async backup(filename) {
    try {
      if (!this.isTurso) {
        await this.run(`VACUUM INTO '${filename}'`);
        console.log(`Database backed up to ${filename}`);
      }
    } catch (error) {
      console.error('Error backing up database:', error);
    }
  }

  // Health check
  async ping() {
    try {
      const sql = 'SELECT 1 as ping';
      if (this.isTurso) {
        const result = await this.db.execute({ sql });
        return result.rows.length > 0;
      } else {
        const result = await this.get(sql);
        return !!result;
      }
    } catch (error) {
      return false;
    }
  }

  // User links operations
  async getUserLinks(userId, _options = {}) {
    try {
      const sql = `
        SELECT id, short_code, original_url, title, created_at, click_count
        FROM urls
        WHERE user_id = ?
        ORDER BY created_at DESC
      `;
      let result;

      if (this.isTurso) {
        result = await this.db.execute({
          sql,
          args: [userId],
        });
        return result.rows;
      } else {
        result = await this.all(sql, [userId]);
        return result;
      }
    } catch (error) {
      throw error;
    }
  }

  async getLinkById(id) {
    try {
      const sql = 'SELECT * FROM urls WHERE id = ?';
      let result;

      if (this.isTurso) {
        result = await this.db.execute({
          sql,
          args: [id],
        });
        return result.rows.length > 0 ? result.rows[0] : null;
      } else {
        result = await this.get(sql, [id]);
        return result || null;
      }
    } catch (error) {
      throw error;
    }
  }

  async updateUserLink(id, updates) {
    try {
      const { title, original_url, short_code } = updates;
      const updateFields = [];
      const params = [];

      if (title !== undefined) {
        updateFields.push('title = ?');
        params.push(title);
      }

      if (original_url !== undefined) {
        updateFields.push('original_url = ?');
        params.push(original_url);
      }

      if (short_code !== undefined) {
        updateFields.push('short_code = ?');
        params.push(short_code);
      }

      if (updateFields.length === 0) {
        throw new Error('No fields to update');
      }

      const sql = `UPDATE urls SET ${updateFields.join(', ')} WHERE id = ?`;
      params.push(id);

      if (this.isTurso) {
        await this.db.execute({
          sql,
          args: params,
        });
      } else {
        await this.run(sql, params);
      }

      // Return updated link
      return await this.getLinkById(id);
    } catch (error) {
      if (error.message && error.message.includes('UNIQUE constraint failed')) {
        throw new Error('Short code already exists');
      }
      throw error;
    }
  }

  async deleteUserLink(id) {
    try {
      const sql = 'DELETE FROM urls WHERE id = ?';

      if (this.isTurso) {
        await this.db.execute({
          sql,
          args: [id],
        });
      } else {
        await this.run(sql, [id]);
      }

      return true;
    } catch (error) {
      throw error;
    }
  }
}

module.exports = SQLiteAdapter;
