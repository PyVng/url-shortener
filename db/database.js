// Legacy database interface - now uses the new DatabaseManager
// This file is kept for backward compatibility
const dbManager = require('./manager');

// Initialize database manager
let isInitialized = false;

async function initializeDatabase() {
  if (!isInitialized) {
    try {
      await dbManager.initialize();
      isInitialized = true;
      console.log('Database initialized successfully');
    } catch (error) {
      console.error('Database initialization failed:', error);
      throw error;
    }
  }
}

// Legacy functions for backward compatibility
const databaseOperations = {
  // Создание короткого URL
  createShortUrl: async (shortCode, originalUrl, userId = null) => {
    await initializeDatabase();
    return await dbManager.createShortUrl(shortCode, originalUrl, userId);
  },

  // Получение оригинального URL по короткому коду
  getOriginalUrl: async (shortCode) => {
    await initializeDatabase();
    return await dbManager.getOriginalUrl(shortCode);
  },

  // Получение всех URL (для отладки)
  getAllUrls: async () => {
    await initializeDatabase();
    return await dbManager.getAllUrls();
  },

  // Get URL statistics
  getUrlStats: async (shortCode) => {
    await initializeDatabase();
    return await dbManager.getUrlStats(shortCode);
  },

  // Health check
  healthCheck: async () => {
    await initializeDatabase();
    return await dbManager.healthCheck();
  },

  // Get database statistics
  getStats: async () => {
    await initializeDatabase();
    return await dbManager.getStats();
  },

  // Rate limiting
  checkRateLimit: async (identifier, limit = 100, window = 3600) => {
    await initializeDatabase();
    return await dbManager.checkRateLimit(identifier, limit, window);
  },

  // User links operations
  getUserLinks: async (userId) => {
    await initializeDatabase();
    return await dbManager.getUserLinks(userId);
  },

  getLinkById: async (id) => {
    await initializeDatabase();
    return await dbManager.getLinkById(id);
  },

  updateUserLink: async (id, updates) => {
    await initializeDatabase();
    return await dbManager.updateUserLink(id, updates);
  },

  deleteUserLink: async (id) => {
    await initializeDatabase();
    return await dbManager.deleteUserLink(id);
  },
};

// Auto-initialize on module load
initializeDatabase().catch(console.error);

module.exports = { ...databaseOperations };
