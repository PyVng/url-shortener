const { createClient } = require('@supabase/supabase-js');
const { databaseConfigs } = require('./config');

// Supabase client for authentication
const supabaseConfig = databaseConfigs.supabase_auth;

if (!supabaseConfig.url || !supabaseConfig.anonKey) {
  console.warn('⚠️  Supabase configuration not found. Authentication features will be disabled.');
}

const supabase = supabaseConfig.url && supabaseConfig.anonKey
  ? createClient(supabaseConfig.url, supabaseConfig.anonKey, {
      auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true
      }
    })
  : null;

// Supabase admin client (server-side only)
const supabaseAdmin = supabaseConfig.url && supabaseConfig.serviceRoleKey
  ? createClient(supabaseConfig.url, supabaseConfig.serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })
  : null;

module.exports = {
  supabase,
  supabaseAdmin,
  supabaseConfig
};
