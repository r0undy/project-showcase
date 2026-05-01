-- Migration: Create Reactions table with unique constraint on user_id + project_id
-- Requirements: 13.1, 13.2, 13.3, 13.4, 13.5

-- Create Reactions table
CREATE TABLE reactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  reaction_type TEXT NOT NULL DEFAULT 'like',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, project_id)
);

-- Create indexes
CREATE INDEX idx_reactions_project_id ON reactions(project_id);
CREATE INDEX idx_reactions_user_id ON reactions(user_id);
CREATE UNIQUE INDEX idx_reactions_user_project ON reactions(user_id, project_id);

-- Add comments for documentation
COMMENT ON TABLE reactions IS 'Stores user reactions to projects (likes, hearts, etc.)';
COMMENT ON COLUMN reactions.id IS 'UUID v4 primary key';
COMMENT ON COLUMN reactions.user_id IS 'Foreign key to users table (cascade delete)';
COMMENT ON COLUMN reactions.project_id IS 'Foreign key to projects table (cascade delete)';
COMMENT ON COLUMN reactions.reaction_type IS 'Type of reaction (like, heart, etc.)';
COMMENT ON COLUMN reactions.created_at IS 'Timestamp when reaction was created';
COMMENT ON CONSTRAINT reactions_user_id_project_id_key ON reactions IS 'Prevents duplicate reactions from same user on same project';
