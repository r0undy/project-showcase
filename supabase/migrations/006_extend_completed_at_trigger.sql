-- Migration: Extend set_completed_at trigger to fire on INSERT as well as UPDATE.
-- Reason: PATCH /api/users/[id]/progress upserts on (user_id, step_number).
-- When the row doesn't exist yet, the upsert is an INSERT — the original
-- BEFORE UPDATE-only trigger left completed_at as NULL even when is_completed=true.

CREATE OR REPLACE FUNCTION set_completed_at()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF NEW.is_completed = TRUE AND NEW.completed_at IS NULL THEN
      NEW.completed_at = NOW();
    END IF;
  ELSIF TG_OP = 'UPDATE' THEN
    IF NEW.is_completed = TRUE AND OLD.is_completed = FALSE THEN
      NEW.completed_at = NOW();
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_onboarding_completed_at ON onboarding_progress;
CREATE TRIGGER set_onboarding_completed_at
  BEFORE INSERT OR UPDATE ON onboarding_progress
  FOR EACH ROW
  EXECUTE FUNCTION set_completed_at();
