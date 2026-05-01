-- Migration: Create Projects table with foreign key to Users and cascade delete
-- Requirements: 12.1, 12.2, 12.3, 12.4, 12.5

-- Create Projects table
CREATE TABLE projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  media_url TEXT,
  author_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes
CREATE INDEX idx_projects_author_id ON projects(author_id);
CREATE INDEX idx_projects_created_at ON projects(created_at DESC);

-- Create trigger for auto-updating updated_at
CREATE TRIGGER update_projects_updated_at
  BEFORE UPDATE ON projects
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Add comments for documentation
COMMENT ON TABLE projects IS 'Stores community projects submitted by users';
COMMENT ON COLUMN projects.id IS 'UUID v4 primary key';
COMMENT ON COLUMN projects.title IS 'Project title';
COMMENT ON COLUMN projects.description IS 'Project description';
COMMENT ON COLUMN projects.media_url IS 'Optional URL to project media (image, video, etc.)';
COMMENT ON COLUMN projects.author_id IS 'Foreign key to users table (cascade delete)';
COMMENT ON COLUMN projects.created_at IS 'Timestamp when project was created';
COMMENT ON COLUMN projects.updated_at IS 'Timestamp when project was last updated (auto-updated by trigger)';
