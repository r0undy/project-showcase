-- Comments on projects (Discord-style threaded discussion per project).

CREATE TABLE IF NOT EXISTS comments (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID        NOT NULL REFERENCES users(id)    ON DELETE CASCADE,
  project_id UUID        NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  content    TEXT        NOT NULL CHECK (char_length(content) BETWEEN 1 AND 500),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_comments_project_id ON comments(project_id);
CREATE INDEX idx_comments_user_id    ON comments(user_id);
CREATE INDEX idx_comments_created_at ON comments(created_at DESC);

-- Reuse the existing trigger function defined in migration 001
CREATE TRIGGER update_comments_updated_at
  BEFORE UPDATE ON comments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

ALTER TABLE comments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read comments"
  ON comments FOR SELECT USING (true);

CREATE POLICY "Authenticated users can insert own comments"
  ON comments FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own comments"
  ON comments FOR DELETE USING (auth.uid() = user_id);

-- Required for Supabase Realtime: expose the full old row on DELETE events
-- so client-side filters (project_id=eq.xxx) work correctly.
ALTER TABLE comments REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE comments;
