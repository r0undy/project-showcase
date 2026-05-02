-- Enable Supabase Realtime for the reactions table so clients can subscribe
-- to live emoji reaction changes across all browser sessions.
--
-- REPLICA IDENTITY FULL is required so that DELETE events include the full
-- old row (project_id, user_id, reaction_type) — without it only the PK is
-- available and the client cannot identify which project/emoji was removed.

ALTER TABLE reactions REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE reactions;
