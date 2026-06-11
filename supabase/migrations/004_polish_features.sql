-- Polish features: weigh-in reminders + accountability share links

-- ---------------------------------------------------------------------------
-- Reminder preferences (profiles)
-- ---------------------------------------------------------------------------
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS reminder_enabled BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS reminder_day_of_week INT CHECK (reminder_day_of_week BETWEEN 0 AND 6),
  ADD COLUMN IF NOT EXISTS reminder_time TIME DEFAULT '09:00';

-- ---------------------------------------------------------------------------
-- Read-only share links for accountability partners
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS roadmap_shares (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  roadmap_id UUID NOT NULL REFERENCES roadmaps(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  share_token TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_roadmap_shares_token ON roadmap_shares(share_token);
CREATE INDEX IF NOT EXISTS idx_roadmap_shares_roadmap ON roadmap_shares(roadmap_id);

ALTER TABLE roadmap_shares ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own share links"
  ON roadmap_shares FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own share links"
  ON roadmap_shares FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own share links"
  ON roadmap_shares FOR DELETE
  USING (auth.uid() = user_id);
