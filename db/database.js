// Simplified database interface for Supabase only
const SupabaseRestAdapter = require('./adapters/supabase_rest');

// Create and initialize Supabase adapter directly
const config = {
  name: 'supabase_rest',
  type: 'supabase_rest',
  url: process.env.SUPABASE_URL || 'https://test.supabase.co',
  anonKey: process.env.SUPABASE_ANON_KEY || 'test-anon-key',
  serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY || 'test-service-role-key',
};

let adapter = null;

async function initializeAdapter() {
  if (!adapter) {
    adapter = new SupabaseRestAdapter(config);
    await adapter.connect();
    await adapter.initialize();
    console.log('Supabase adapter initialized successfully');
  }
  return adapter;
}

// Database operations
const databaseOperations = {
  // Создание короткого URL
  createShortUrl: async (shortCode, originalUrl, userId = null) => {
    const db = await initializeAdapter();
    return await db.createShortUrl(shortCode, originalUrl, userId);
  },

  // Получение оригинального URL по короткому коду
  getOriginalUrl: async (shortCode) => {
    const db = await initializeAdapter();
    return await db.getOriginalUrl(shortCode);
  },

  // Получение всех URL (для отладки)
  getAllUrls: async (limit = 100, offset = 0) => {
    const db = await initializeAdapter();
    return await db.getAllUrls(limit, offset);
  },

  // Get URL statistics
  getUrlStats: async (shortCode) => {
    const db = await initializeAdapter();
    return await db.getUrlStats(shortCode);
  },

  // Health check
  healthCheck: async () => {
    const db = await initializeAdapter();
    return await db.ping();
  },

  // Get database statistics
  getStats: async () => {
    return {
      type: 'supabase_rest',
      name: 'Supabase REST API',
    };
  },

  // Rate limiting - always allow
  checkRateLimit: async (identifier, limit = 100, window = 3600) => {
    return true;
  },

  // User links operations
  getUserLinks: async (userId, options = {}) => {
    const db = await initializeAdapter();
    return await db.getUserLinks(userId, options);
  },

  getLinkById: async (id) => {
    const db = await initializeAdapter();
    return await db.getLinkById(id);
  },

  updateUserLink: async (id, updates) => {
    const db = await initializeAdapter();
    return await db.updateUserLink(id, updates);
  },

  deleteUserLink: async (id) => {
    const db = await initializeAdapter();
    return await db.deleteUserLink(id);
  },
};

module.exports = { ...databaseOperations };
