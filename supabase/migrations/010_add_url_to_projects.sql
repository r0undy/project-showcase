-- Add url column to projects table.
-- IF NOT EXISTS guard because the column was already added manually via the Supabase dashboard.
ALTER TABLE projects ADD COLUMN IF NOT EXISTS url TEXT;
