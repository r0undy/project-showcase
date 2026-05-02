-- Singleton table for workshop-wide flags. The big-reveal moment for Part 4
-- is gated by `part4_revealed` — flip it to true from the Supabase dashboard
-- when the workshop is ready, and every connected attendee's deploy guide
-- gets the new section live (via the realtime subscription).

CREATE TABLE IF NOT EXISTS global_config (
  id              INT         PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  part4_revealed  BOOLEAN     NOT NULL DEFAULT false,
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER update_global_config_updated_at
  BEFORE UPDATE ON global_config
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Seed the singleton row.
INSERT INTO global_config (id, part4_revealed)
VALUES (1, false)
ON CONFLICT (id) DO NOTHING;

ALTER TABLE global_config ENABLE ROW LEVEL SECURITY;

-- Anyone (including anonymous) can read the flag; this is what gates the UI.
CREATE POLICY "Anyone can read global config"
  ON global_config FOR SELECT USING (true);

-- No INSERT/UPDATE/DELETE policies — only the service role (admin) can change
-- the flag. Flip it from the Supabase dashboard SQL editor:
--   UPDATE global_config SET part4_revealed = true WHERE id = 1;

-- Realtime so pages update live the instant the flag flips.
ALTER TABLE global_config REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE global_config;
