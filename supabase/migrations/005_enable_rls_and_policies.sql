-- Migration: Enable Row Level Security (RLS) and create security policies
-- Requirements: 19.1, 19.2, 19.5

-- ============================================================================
-- ENABLE ROW LEVEL SECURITY ON ALL TABLES
-- ============================================================================

ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE reactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE onboarding_progress ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- USERS TABLE POLICIES
-- ============================================================================

-- Policy: All users can read all user records (for displaying author info, etc.)
CREATE POLICY "Users can read all user records"
  ON users
  FOR SELECT
  USING (true);

-- Policy: Authenticated users can insert their own user record
-- Note: This allows user creation during onboarding
CREATE POLICY "Users can insert their own record"
  ON users
  FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Policy: Users can update their own record
CREATE POLICY "Users can update their own record"
  ON users
  FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Policy: Users cannot delete their own records (admin-only operation)
-- No DELETE policy means only service role can delete

-- ============================================================================
-- PROJECTS TABLE POLICIES
-- ============================================================================

-- Policy: All users (including anonymous) can read all projects
CREATE POLICY "Anyone can read projects"
  ON projects
  FOR SELECT
  USING (true);

-- Policy: Authenticated users can insert projects
CREATE POLICY "Authenticated users can insert projects"
  ON projects
  FOR INSERT
  WITH CHECK (auth.uid() = author_id);

-- Policy: Authors can update their own projects
CREATE POLICY "Authors can update their own projects"
  ON projects
  FOR UPDATE
  USING (auth.uid() = author_id)
  WITH CHECK (auth.uid() = author_id);

-- Policy: Authors can delete their own projects
CREATE POLICY "Authors can delete their own projects"
  ON projects
  FOR DELETE
  USING (auth.uid() = author_id);

-- ============================================================================
-- REACTIONS TABLE POLICIES
-- ============================================================================

-- Policy: All users (including anonymous) can read all reactions
CREATE POLICY "Anyone can read reactions"
  ON reactions
  FOR SELECT
  USING (true);

-- Policy: Authenticated users can insert their own reactions
CREATE POLICY "Authenticated users can insert their own reactions"
  ON reactions
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Policy: Users can delete their own reactions
CREATE POLICY "Users can delete their own reactions"
  ON reactions
  FOR DELETE
  USING (auth.uid() = user_id);

-- Policy: Users cannot update reactions (delete and re-create instead)
-- No UPDATE policy means reactions are immutable once created

-- ============================================================================
-- ONBOARDING_PROGRESS TABLE POLICIES
-- ============================================================================

-- Policy: Users can read only their own onboarding progress
CREATE POLICY "Users can read their own onboarding progress"
  ON onboarding_progress
  FOR SELECT
  USING (auth.uid() = user_id);

-- Policy: Users can insert their own onboarding progress records
CREATE POLICY "Users can insert their own onboarding progress"
  ON onboarding_progress
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Policy: Users can update their own onboarding progress
CREATE POLICY "Users can update their own onboarding progress"
  ON onboarding_progress
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Policy: Users can delete their own onboarding progress (for reset functionality)
CREATE POLICY "Users can delete their own onboarding progress"
  ON onboarding_progress
  FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================================================
-- COMMENTS FOR DOCUMENTATION
-- ============================================================================

COMMENT ON POLICY "Users can read all user records" ON users IS 
  'Allows all users to view user profiles for displaying author information';

COMMENT ON POLICY "Users can insert their own record" ON users IS 
  'Allows authenticated users to create their own user record during onboarding';

COMMENT ON POLICY "Users can update their own record" ON users IS 
  'Allows users to update their own profile information';

COMMENT ON POLICY "Anyone can read projects" ON projects IS 
  'Public read access to all projects for showcase display';

COMMENT ON POLICY "Authenticated users can insert projects" ON projects IS 
  'Requires authentication to submit projects';

COMMENT ON POLICY "Authors can update their own projects" ON projects IS 
  'Project authors can edit their own project details';

COMMENT ON POLICY "Authors can delete their own projects" ON projects IS 
  'Project authors can remove their own projects';

COMMENT ON POLICY "Anyone can read reactions" ON reactions IS 
  'Public read access to reactions for displaying counts';

COMMENT ON POLICY "Authenticated users can insert their own reactions" ON reactions IS 
  'Requires authentication to react to projects';

COMMENT ON POLICY "Users can delete their own reactions" ON reactions IS 
  'Users can remove their own reactions (un-like functionality)';

COMMENT ON POLICY "Users can read their own onboarding progress" ON onboarding_progress IS 
  'Users can only see their own onboarding progress';

COMMENT ON POLICY "Users can insert their own onboarding progress" ON onboarding_progress IS 
  'Users can create their own onboarding progress records';

COMMENT ON POLICY "Users can update their own onboarding progress" ON onboarding_progress IS 
  'Users can update their own onboarding progress (mark steps complete)';

COMMENT ON POLICY "Users can delete their own onboarding progress" ON onboarding_progress IS 
  'Users can reset their own onboarding progress if needed';
