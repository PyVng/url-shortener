// Simplified database interface with Vercel Postgres support for production
const SupabaseRestAdapter = require('./adapters/supabase_rest');
const JsonFileAdapter = require('./adapters/json_file');
const SqliteAdapter = require('./adapters/sqlite');
const VercelKvAdapter = require('./adapters/vercel_kv');
const VercelPostgresAdapter = require('./adapters/vercel_postgres');

// Create and initialize adapter based on environment
const config = {
  name: process.env.ACTIVE_DATABASE || 'vercel_postgres',
  type: process.env.ACTIVE_DATABASE || 'vercel_postgres',
  url: process.env.SUPABASE_URL || 'https://test.supabase.co',
  anonKey: process.env.SUPABASE_ANON_KEY || 'test-anon-key',
  serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY || 'test-service-role-key',
};

let adapter = null;

function getAdapterClass() {
  switch (config.type) {
    case 'supabase_rest':
      return SupabaseRestAdapter;
    case 'json_file':
      return JsonFileAdapter;
    case 'sqlite':
      return SqliteAdapter;
    case 'vercel_kv':
      return VercelKvAdapter;
    case 'vercel_postgres':
      return VercelPostgresAdapter;
    default:
      return VercelPostgresAdapter; // Default to Vercel Postgres for production
  }
}

async function initializeAdapter() {
  if (!adapter) {
    const AdapterClass = getAdapterClass();
    adapter = new AdapterClass(config);
    await adapter.connect();
    await adapter.initialize();
    console.log(`${config.name} adapter initialized successfully`);
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
      type: config.type,
      name: config.name,
      activeDatabase: process.env.ACTIVE_DATABASE || 'vercel_postgres'
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
