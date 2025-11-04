// Simple JSON file adapter for Vercel deployment
const fs = require('fs').promises;
const path = require('path');

class JsonFileAdapter {
  constructor(config) {
    this.dataFile = path.join(process.cwd(), 'data', 'urls.json');
    this.tableName = 'urls';
    this.initialized = false;
  }

  async connect() {
    console.log('Connected to JSON file storage');
    return this;
  }

  async disconnect() {
    console.log('Disconnected from JSON file storage');
  }

  async initialize() {
    try {
      // Ensure data directory exists
      const dataDir = path.dirname(this.dataFile);
      await fs.mkdir(dataDir, { recursive: true });

      // Create data file if it doesn't exist
      try {
        await fs.access(this.dataFile);
      } catch {
        await fs.writeFile(this.dataFile, JSON.stringify({ urls: [] }, null, 2));
      }

      this.initialized = true;
      console.log('JSON file storage initialized successfully');
      return true;
    } catch (error) {
      console.error('Failed to initialize JSON file storage:', error);
      return false;
    }
  }

  async ensureInitialized() {
    if (!this.initialized) {
      await this.initialize();
    }
    return true;
  }

  async readData() {
    try {
      const data = await fs.readFile(this.dataFile, 'utf8');
      return JSON.parse(data);
    } catch (error) {
      console.error('Error reading data file:', error);
      return { urls: [] };
    }
  }

  async writeData(data) {
    try {
      await fs.writeFile(this.dataFile, JSON.stringify(data, null, 2));
      return true;
    } catch (error) {
      console.error('Error writing data file:', error);
      throw error;
    }
  }

  async createShortUrl(shortCode, originalUrl, userId = null) {
    await this.ensureInitialized();
    
    const data = await this.readData();
    const newUrl = {
      id: Date.now().toString(),
      short_code: shortCode,
      original_url: originalUrl,
      user_id: userId,
      click_count: 0,
      created_at: new Date().toISOString()
    };

    data.urls.push(newUrl);
    await this.writeData(data);

    return {
      id: newUrl.id,
      shortCode: newUrl.short_code,
      originalUrl: newUrl.original_url,
      userId: newUrl.user_id,
      createdAt: newUrl.created_at,
    };
  }

  async getOriginalUrl(shortCode) {
    await this.ensureInitialized();
    
    const data = await this.readData();
    const url = data.urls.find(u => u.short_code === shortCode);
    
    if (!url) {
      return null;
    }

    // Increment click count
    url.click_count = (url.click_count || 0) + 1;
    await this.writeData(data);

    return url.original_url;
  }

  async getAllUrls(limit = 100, offset = 0) {
    await this.ensureInitialized();
    
    const data = await this.readData();
    return data.urls
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
      .slice(offset, offset + limit);
  }

  async getUrlStats(shortCode) {
    await this.ensureInitialized();
    
    const data = await this.readData();
    const url = data.urls.find(u => u.short_code === shortCode);
    
    return url || null;
  }

  async getUserLinks(userId, options = {}) {
    await this.ensureInitialized();
    
    const data = await this.readData();
    const userUrls = data.urls.filter(u => u.user_id === userId);
    
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
    
    const data = await this.readData();
    const url = data.urls.find(u => u.id === id);
    
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
    
    const data = await this.readData();
    const urlIndex = data.urls.findIndex(u => u.id === id);
    
    if (urlIndex === -1) {
      throw new Error('Link not found');
    }

    // Update the link
    Object.assign(data.urls[urlIndex], updates);
    await this.writeData(data);

    return data.urls[urlIndex];
  }

  async deleteUserLink(id) {
    await this.ensureInitialized();
    
    const data = await this.readData();
    const urlIndex = data.urls.findIndex(u => u.id === id);
    
    if (urlIndex === -1) {
      throw new Error('Link not found');
    }

    data.urls.splice(urlIndex, 1);
    await this.writeData(data);

    return true;
  }

  async ping() {
    try {
      await this.ensureInitialized();
      return true;
    } catch (error) {
      return false;
    }
  }
}

module.exports = JsonFileAdapter;
