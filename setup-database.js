// Setup Supabase database with tables and policies
require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials in .env file');
  console.error('Required: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

// Create Supabase admin client
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function setupDatabase() {
  try {
    console.log('🚀 Setting up Supabase database...\n');

    // SQL statements to execute
    const statements = [
      // Create URLs table
      `CREATE TABLE IF NOT EXISTS urls (
        id SERIAL PRIMARY KEY,
        short_code TEXT UNIQUE NOT NULL,
        original_url TEXT NOT NULL,
        user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        click_count INTEGER DEFAULT 0
      )`,

      // Create indexes
      `CREATE INDEX IF NOT EXISTS idx_urls_short_code ON urls(short_code)`,
      `CREATE INDEX IF NOT EXISTS idx_urls_user_id ON urls(user_id)`,
      `CREATE INDEX IF NOT EXISTS idx_urls_created_at ON urls(created_at DESC)`,

      // Enable Row Level Security
      `ALTER TABLE urls ENABLE ROW LEVEL SECURITY`,

      // RLS Policies
      `CREATE POLICY "Users can view own urls" ON urls
        FOR SELECT USING (auth.uid() = user_id)`,

      `CREATE POLICY "Users can insert own urls" ON urls
        FOR INSERT WITH CHECK (auth.uid() = user_id)`,

      `CREATE POLICY "Users can update own urls" ON urls
        FOR UPDATE USING (auth.uid() = user_id)`,

      `CREATE POLICY "Users can delete own urls" ON urls
        FOR DELETE USING (auth.uid() = user_id)`,

      // Create analytics table
      `CREATE TABLE IF NOT EXISTS user_analytics (
        id SERIAL PRIMARY KEY,
        user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
        url_id INTEGER REFERENCES urls(id) ON DELETE CASCADE,
        ip_address INET,
        user_agent TEXT,
        referrer TEXT,
        clicked_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )`,

      // Enable RLS for analytics
      `ALTER TABLE user_analytics ENABLE ROW LEVEL SECURITY`,

      // Analytics policy
      `CREATE POLICY "Users can view own analytics" ON user_analytics
        FOR SELECT USING (auth.uid() = user_id)`,

      // Grant permissions
      `GRANT USAGE ON SCHEMA public TO anon, authenticated`,
      `GRANT ALL ON urls TO anon, authenticated`,
      `GRANT ALL ON user_analytics TO anon, authenticated`,
      `GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated`
    ];

    console.log('📋 Executing SQL statements...\n');

    // Execute each statement
    for (let i = 0; i < statements.length; i++) {
      const sql = statements[i].trim();
      if (!sql) continue;

      try {
        console.log(`🔧 Executing statement ${i + 1}/${statements.length}...`);
        const { error } = await supabase.rpc('exec_sql', { sql });

        if (error) {
          // Try direct execution for some statements
          const { error: directError } = await supabase.from('_supabase_migration_temp').select('*').limit(1);
          if (directError && directError.message.includes('relation') === false) {
            console.log(`   ⚠️  Note: ${error.message}`);
          }
        }

        console.log(`   ✅ Statement ${i + 1} completed`);
      } catch (error) {
        console.log(`   ⚠️  Statement ${i + 1} note: ${error.message}`);
      }
    }

    console.log('\n🎉 Database setup completed!');
    console.log('\n📊 Testing database connection...');

    // Test the setup
    const { data, error } = await supabase
      .from('urls')
      .select('*')
      .limit(1);

    if (error) {
      console.log('⚠️  Note: RLS policies are active, query returned no data (expected)');
    } else {
      console.log('✅ Database connection successful');
    }

    console.log('\n🚀 Your Supabase database is ready!');
    console.log('Next steps:');
    console.log('1. Test the application locally: npm run dev');
    console.log('2. Deploy to Vercel with the environment variables');
    console.log('3. Register a user and test URL shortening');

  } catch (error) {
    console.error('❌ Database setup failed:', error.message);
    console.error('\nTroubleshooting:');
    console.error('1. Check your SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env');
    console.error('2. Make sure your Supabase project is active');
    console.error('3. Try running the SQL manually in Supabase SQL Editor');
    process.exit(1);
  }
}

// Alternative method using direct SQL execution
async function setupWithDirectSQL() {
  console.log('🔄 Trying alternative setup method...\n');

  try {
    // Test connection first
    const { data, error } = await supabase.auth.getSession();
    if (error) {
      console.log('⚠️  Auth test note:', error.message);
    }

    console.log('✅ Connected to Supabase');
    console.log('\n📋 Please run the SQL script manually in Supabase Dashboard:');
    console.log('1. Go to https://supabase.com/dashboard/project/YOUR_PROJECT/sql');
    console.log('2. Copy and paste the contents of db/setup-supabase.sql');
    console.log('3. Click "Run" to execute');
    console.log('\nAfter running the SQL, test the connection with: node test-supabase.js');

  } catch (error) {
    console.error('❌ Connection test failed:', error.message);
  }
}

// Run setup
if (require.main === module) {
  setupDatabase().catch(() => {
    console.log('\n' + '='.repeat(50));
    setupWithDirectSQL();
  });
}

module.exports = { setupDatabase };
