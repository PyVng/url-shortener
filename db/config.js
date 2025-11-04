// Simplified database configuration for Supabase only
require('dotenv').config();

// Supabase REST API configuration
const supabaseConfig = {
  type: 'supabase_rest',
  url: process.env.SUPABASE_URL,
  anonKey: process.env.SUPABASE_ANON_KEY,
  serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY,
};

// Get active database configuration (always Supabase)
function getActiveDatabaseConfig() {
  console.log('🔍 Using Supabase REST API');

  return {
    ...supabaseConfig,
    name: 'supabase_rest',
  };
}

// Get all available database configurations (only Supabase)
function getAllDatabaseConfigs() {
  return [{
    name: 'supabase_rest',
    ...supabaseConfig,
  }];
}

module.exports = {
  getActiveDatabaseConfig,
  getAllDatabaseConfigs,
  supabaseConfig,
};
