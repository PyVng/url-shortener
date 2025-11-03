const { createClient } = require('@supabase/supabase-js');
const { databaseConfigs } = require('./config');

// Supabase client for authentication
const supabaseConfig = databaseConfigs.supabase_auth;

console.log('🔍 Supabase Config Debug:');
console.log('SUPABASE_URL:', supabaseConfig.url ? '✅ Set' : '❌ Missing');
console.log('SUPABASE_ANON_KEY:', supabaseConfig.anonKey ? '✅ Set' : '❌ Missing');
console.log('SUPABASE_SERVICE_ROLE_KEY:', supabaseConfig.serviceRoleKey ? '✅ Set' : '❌ Missing');

if (!supabaseConfig.url || !supabaseConfig.anonKey) {
  console.warn('⚠️  Supabase configuration not found. Authentication features will be disabled.');
  console.warn('Please check your .env file and ensure SUPABASE_URL and SUPABASE_ANON_KEY are set.');
}

const supabase = process.env.NODE_ENV === 'development'
  ? null // Force mock auth in development
  : (supabaseConfig.url && supabaseConfig.anonKey
      ? createClient(supabaseConfig.url, supabaseConfig.anonKey, {
          auth: {
            autoRefreshToken: true,
            persistSession: true,
            detectSessionInUrl: true
          }
        })
      : null);

console.log('🔍 Supabase Client Status:', supabase ? '✅ Initialized' : '❌ Null');

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
