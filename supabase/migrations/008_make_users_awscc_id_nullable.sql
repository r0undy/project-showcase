-- Migration: Make awscc_id optional on users
-- Requirements: 4.1, 4.4

ALTER TABLE users
  ALTER COLUMN awscc_id DROP NOT NULL;

COMMENT ON COLUMN users.awscc_id IS 'AWS Community Club ID (optional)';
