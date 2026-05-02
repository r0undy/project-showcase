-- Enable Supabase Realtime for the projects table so the showcase grid
-- updates live when projects are added, edited, or deleted.
--
-- REPLICA IDENTITY FULL lets DELETE events include the full old row (id, etc.)
-- so the client can remove the correct card without a round-trip.

ALTER TABLE projects REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE projects;
