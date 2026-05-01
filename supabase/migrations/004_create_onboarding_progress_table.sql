-- Migration: Create Onboarding_Progress table with step tracking and completion timestamps
-- Requirements: 14.1, 14.2, 14.3, 14.4, 14.5

-- Create trigger function to auto-set completed_at when is_completed changes to true
CREATE OR REPLACE FUNCTION set_completed_at()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.is_completed = TRUE AND OLD.is_completed = FALSE THEN
    NEW.completed_at = NOW();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create Onboarding_Progress table
CREATE TABLE onboarding_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  step_number INTEGER NOT NULL CHECK (step_number >= 1 AND step_number <= 7),
  is_completed BOOLEAN NOT NULL DEFAULT FALSE,
  completed_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, step_number)
);

-- Create indexes
CREATE INDEX idx_onboarding_user_id ON onboarding_progress(user_id);
CREATE UNIQUE INDEX idx_onboarding_user_step ON onboarding_progress(user_id, step_number);

-- Create trigger for auto-updating updated_at
CREATE TRIGGER update_onboarding_progress_updated_at
  BEFORE UPDATE ON onboarding_progress
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Create trigger to set completed_at when is_completed changes to true
CREATE TRIGGER set_onboarding_completed_at
  BEFORE UPDATE ON onboarding_progress
  FOR EACH ROW
  EXECUTE FUNCTION set_completed_at();

-- Add comments for documentation
COMMENT ON TABLE onboarding_progress IS 'Tracks which onboarding steps users have completed';
COMMENT ON COLUMN onboarding_progress.id IS 'UUID v4 primary key';
COMMENT ON COLUMN onboarding_progress.user_id IS 'Foreign key to users table (cascade delete)';
COMMENT ON COLUMN onboarding_progress.step_number IS 'Step number (1-7)';
COMMENT ON COLUMN onboarding_progress.is_completed IS 'Whether the step has been marked as complete';
COMMENT ON COLUMN onboarding_progress.completed_at IS 'Timestamp when step was completed (auto-set by trigger)';
COMMENT ON COLUMN onboarding_progress.updated_at IS 'Timestamp when record was last updated (auto-updated by trigger)';
