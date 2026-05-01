-- Migration: Add avatar_url to users table
-- Requirements: 4.1, 4.4, 18.2

ALTER TABLE users
  ADD COLUMN avatar_url TEXT;

COMMENT ON COLUMN users.avatar_url IS 'Public URL for the user avatar image';
