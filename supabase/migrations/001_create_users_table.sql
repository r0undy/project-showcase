-- Migration: Create Users table with UUID primary key, unique username constraint, and timestamps
-- Requirements: 11.1, 11.2, 11.3, 11.4, 11.5

-- Create trigger function for auto-updating updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create Users table
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  username TEXT UNIQUE NOT NULL,
  awscc_id TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes
CREATE UNIQUE INDEX idx_users_username ON users(username);
CREATE INDEX idx_users_created_at ON users(created_at DESC);

-- Create trigger for auto-updating updated_at
CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Add comments for documentation
COMMENT ON TABLE users IS 'Stores AWS Community members with username and AWSCC ID';
COMMENT ON COLUMN users.id IS 'UUID v4 primary key';
COMMENT ON COLUMN users.username IS 'Unique username (alphanumeric, hyphens, underscores only)';
COMMENT ON COLUMN users.awscc_id IS 'AWS Community Club ID';
COMMENT ON COLUMN users.created_at IS 'Timestamp when user was created';
COMMENT ON COLUMN users.updated_at IS 'Timestamp when user was last updated (auto-updated by trigger)';
