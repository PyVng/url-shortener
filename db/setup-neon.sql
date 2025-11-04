-- Vercel Postgres (Neon) database schema for URL Shortener

-- Create URLs table
CREATE TABLE IF NOT EXISTS urls (
  id SERIAL PRIMARY KEY,
  short_code VARCHAR(20) UNIQUE NOT NULL,
  original_url TEXT NOT NULL,
  user_id VARCHAR(100),
  title VARCHAR(255),
  click_count INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_short_code ON urls(short_code);
CREATE INDEX IF NOT EXISTS idx_user_id ON urls(user_id);

-- Create users table for simple authentication (optional - can use in-memory for demo)
CREATE TABLE IF NOT EXISTS users (
  id VARCHAR(100) PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  password VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create index for users table
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- Insert demo users (for testing)
INSERT INTO users (id, email, name, password) VALUES 
  ('1', 'demo@example.com', 'Demo User', 'ZGVtbzEyMw=='),
  ('2', 'test@example.com', 'Test User', 'dGVzdDEyMw==')
ON CONFLICT (email) DO NOTHING;

-- Comments for reference
-- id: Auto-incrementing primary key
-- short_code: Unique short code for URL (e.g., "abc123")
-- original_url: The original long URL
-- user_id: Optional user ID for tracking user links
-- title: Optional title for the URL
-- click_count: Number of times the short URL was clicked
-- created_at: Timestamp when the URL was created
