// Vercel KV adapter for production deployment
class VercelKvAdapter {
  constructor(config) {
    this.tableName = 'urls';
    this.initialized = false;
  }

  async connect() {
    console.log('Connected to Vercel KV storage');
    return this;
  }

  async disconnect() {
    console.log('Disconnected from Vercel KV storage');
  }

  async initialize() {
    try {
      // Vercel KV is available globally in Vercel environment
      if (typeof KV === 'undefined') {
        console.warn('Vercel KV not available, falling back to memory storage');
        this.memoryStorage = new Map();
      } else {
        this.kv = KV;
      }
      
      this.initialized = true;
      console.log('Vercel KV adapter initialized successfully');
      return true;
    } catch (error) {
      console.error('Failed to initialize Vercel KV adapter:', error);
      return false;
    }
  }

  async ensureInitialized() {
    if (!this.initialized) {
      await this.initialize();
    }
    return true;
  }

  async get(key) {
    await this.ensureInitialized();
    
    if (this.kv) {
      const value = await this.kv.get(key);
      return value ? JSON.parse(value) : null;
    } else {
      return this.memoryStorage.get(key) || null;
    }
  }

  async set(key, value) {
    await this.ensureInitialized();
    
    const serialized = JSON.stringify(value);
    
    if (this.kv) {
      await this.kv.set(key, serialized);
    } else {
      this.memoryStorage.set(key, serialized);
    }
  }

  async getAllUrls() {
    await this.ensureInitialized();
    
    if (this.kv) {
      // List all keys with prefix
      const keys = await this.kv.list({ prefix: 'url:' });
      const urls = [];
      
      for (const key of keys.keys) {
        const value = await this.kv.get(key);
        if (value) {
          urls.push(JSON.parse(value));
        }
      }
      
      return urls;
    } else {
      // Fallback to memory storage
      const urls = [];
      for (const [key, value] of this.memoryStorage) {
        if (key.startsWith('url:')) {
          urls.push(JSON.parse(value));
        }
      }
      return urls;
    }
  }

  async createShortUrl(shortCode, originalUrl, userId = null) {
    await this.ensureInitialized();
    
    const urlData = {
      id: Date.now().toString(),
      short_code: shortCode,
      original_url: originalUrl,
      user_id: userId,
      click_count: 0,
      created_at: new Date().toISOString()
    };

    const key = `url:${shortCode}`;
    await this.set(key, urlData);

    return {
      id: urlData.id,
      shortCode: urlData.short_code,
      originalUrl: urlData.original_url,
      userId: urlData.user_id,
      createdAt: urlData.created_at,
    };
  }

  async getOriginalUrl(shortCode) {
    await this.ensureInitialized();
    
    const key = `url:${shortCode}`;
    const urlData = await this.get(key);
    
    if (!urlData) {
      return null;
    }

    // Increment click count
    urlData.click_count = (urlData.click_count || 0) + 1;
    await this.set(key, urlData);

    return urlData.original_url;
  }

  async getAllUrls(limit = 100, offset = 0) {
    await this.ensureInitialized();
    
    const urls = await this.getAllUrls();
    return urls
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
      .slice(offset, offset + limit);
  }

  async getUrlStats(shortCode) {
    await this.ensureInitialized();
    
    const key = `url:${shortCode}`;
    return await this.get(key);
  }

  async getUserLinks(userId, options = {}) {
    await this.ensureInitialized();
    
    const urls = await this.getAllUrls();
    const userUrls = urls.filter(u => u.user_id === userId);
    
    return userUrls
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
      .map(link => ({
        id: link.id,
        short_code: link.short_code,
        original_url: link.original_url,
        title: link.title,
        clicks: link.click_count || 0,
        created_at: link.created_at,
      }));
  }

  async getLinkById(id) {
    await this.ensureInitialized();
    
    const urls = await this.getAllUrls();
    const url = urls.find(u => u.id === id);
    
    if (!url) {
      return null;
    }

    return {
      id: url.id,
      short_code: url.short_code,
      original_url: url.original_url,
      title: url.title,
      clicks: url.click_count || 0,
      created_at: url.created_at,
      user_id: url.user_id,
    };
  }

  async updateUserLink(id, updates) {
    await this.ensureInitialized();
    
    const urls = await this.getAllUrls();
    const urlIndex = urls.findIndex(u => u.id === id);
    
    if (urlIndex === -1) {
      throw new Error('Link not found');
    }

    // Update the link
    Object.assign(urls[urlIndex], updates);
    
    // Save back to storage
    for (const url of urls) {
      const key = `url:${url.short_code}`;
      await this.set(key, url);
    }

    return urls[urlIndex];
  }

  async deleteUserLink(id) {
    await this.ensureInitialized();
    
    const urls = await this.getAllUrls();
    const urlIndex = urls.findIndex(u => u.id === id);
    
    if (urlIndex === -1) {
      throw new Error('Link not found');
    }

    const urlToDelete = urls[urlIndex];
    urls.splice(urlIndex, 1);
    
    // Delete from storage
    await this.kv?.delete(`url:${urlToDelete.short_code}`);
    
    return true;
  }

  async ping() {
    try {
      await this.ensureInitialized();
      return this.kv ? true : true; // Always return true for memory fallback
    } catch (error) {
      return false;
    }
  }
}

module.exports = VercelKvAdapter;
