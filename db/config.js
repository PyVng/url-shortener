// Database configuration for multiple providers
require('dotenv').config();

const databaseConfigs = {
  // Vercel Postgres (самый простой для Vercel)
  vercel_postgres: {
    type: 'postgresql',
    connectionString: process.env.POSTGRES_URL,
    ssl: { rejectUnauthorized: false },
    native: false,
  },

  // Vercel KV (Redis через Marketplace)
  vercel_kv: {
    type: 'redis',
    url: process.env.KV_URL,
    token: process.env.KV_REST_API_TOKEN,
  },

  // Vercel Edge Config (для простых данных)
  vercel_edge_config: {
    type: 'edge_config',
    connectionString: process.env.EDGE_CONFIG,
  },

  // Neon PostgreSQL
  neon: {
    type: 'postgresql',
    connectionString: process.env.NEON_DATABASE_URL,
    ssl: { rejectUnauthorized: false },
    native: false,
  },

  // Supabase PostgreSQL
  supabase: {
    type: 'postgresql',
    connectionString: process.env.SUPABASE_DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production'
      ? { rejectUnauthorized: true }
      : { rejectUnauthorized: false }, // Allow self-signed certificates in development
    native: false,
  },

  // Supabase Auth configuration
  supabase_auth: {
    url: process.env.SUPABASE_URL,
    anonKey: process.env.SUPABASE_ANON_KEY,
    serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY,
  },

  // Local PostgreSQL
  postgresql: {
    type: 'postgresql',
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
    native: false,
  },

  // Upstash Redis
  redis: {
    type: 'redis',
    url: process.env.UPSTASH_REDIS_URL,
    token: process.env.UPSTASH_REDIS_TOKEN,
  },

  // MongoDB Atlas
  mongodb: {
    type: 'mongodb',
    connectionString: process.env.MONGODB_ATLAS_URL,
    databaseName: process.env.MONGODB_DATABASE_NAME || 'url_shortener',
  },

  // Turso SQLite
  turso: {
    type: 'sqlite',
    url: process.env.TURSO_DATABASE_URL,
    authToken: process.env.TURSO_AUTH_TOKEN,
  },

  // Local SQLite
  sqlite: {
    type: 'sqlite',
    filename: process.env.SQLITE_DATABASE_PATH || './db/local.db',
  },
};

// Get active database configuration
function getActiveDatabaseConfig() {
  const activeDB = process.env.ACTIVE_DATABASE || 'postgresql';

  if (!databaseConfigs[activeDB]) {
    throw new Error(`Unsupported database type: ${activeDB}`);
  }

  return {
    ...databaseConfigs[activeDB],
    name: activeDB,
  };
}

// Get all available database configurations
function getAllDatabaseConfigs() {
  return Object.keys(databaseConfigs).map(name => ({
    name,
    ...databaseConfigs[name],
  }));
}

module.exports = {
  getActiveDatabaseConfig,
  getAllDatabaseConfigs,
  databaseConfigs,
};
