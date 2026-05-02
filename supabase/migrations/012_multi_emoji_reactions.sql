-- Allow multiple emoji reactions per user per project (Discord-style).
-- Previously only one reaction was allowed per (user, project).

ALTER TABLE reactions DROP CONSTRAINT IF EXISTS reactions_user_id_project_id_key;
DROP INDEX IF EXISTS idx_reactions_user_project;

-- One row per (user, project, emoji) — same emoji can't be added twice by the same user.
ALTER TABLE reactions ADD CONSTRAINT reactions_user_project_emoji_key
  UNIQUE (user_id, project_id, reaction_type);
