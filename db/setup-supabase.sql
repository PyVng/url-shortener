-- Supabase Database Setup Script
-- Run this in Supabase SQL Editor

-- Create URLs table
CREATE TABLE IF NOT EXISTS urls (
  id SERIAL PRIMARY KEY,
  short_code TEXT UNIQUE NOT NULL,
  original_url TEXT NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  click_count INTEGER DEFAULT 0
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_urls_short_code ON urls(short_code);
CREATE INDEX IF NOT EXISTS idx_urls_user_id ON urls(user_id);
CREATE INDEX IF NOT EXISTS idx_urls_created_at ON urls(created_at DESC);

-- Enable Row Level Security
ALTER TABLE urls ENABLE ROW LEVEL SECURITY;

-- RLS Policies for URLs table
-- Users can only see their own URLs
CREATE POLICY "Users can view own urls" ON urls
  FOR SELECT USING (auth.uid() = user_id);

-- Users can insert their own URLs
CREATE POLICY "Users can insert own urls" ON urls
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can update their own URLs
CREATE POLICY "Users can update own urls" ON urls
  FOR UPDATE USING (auth.uid() = user_id);

-- Users can delete their own URLs
CREATE POLICY "Users can delete own urls" ON urls
  FOR DELETE USING (auth.uid() = user_id);

-- Create user analytics table (optional)
CREATE TABLE IF NOT EXISTS user_analytics (
  id SERIAL PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  url_id INTEGER REFERENCES urls(id) ON DELETE CASCADE,
  ip_address INET,
  user_agent TEXT,
  referrer TEXT,
  clicked_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS for analytics
ALTER TABLE user_analytics ENABLE ROW LEVEL SECURITY;

-- Analytics policy
CREATE POLICY "Users can view own analytics" ON user_analytics
  FOR SELECT USING (auth.uid() = user_id);

-- Function to increment click count
CREATE OR REPLACE FUNCTION increment_click_count(url_short_code TEXT)
RETURNS INTEGER AS $$
DECLARE
  updated_count INTEGER;
BEGIN
  UPDATE urls
  SET click_count = click_count + 1
  WHERE short_code = url_short_code
  RETURNING click_count INTO updated_count;

  RETURN updated_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON urls TO anon, authenticated;
GRANT ALL ON user_analytics TO anon, authenticated;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;
