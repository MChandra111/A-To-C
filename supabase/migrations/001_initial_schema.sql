-- A-To-C initial schema
-- Run this in the Supabase SQL Editor (Dashboard → SQL → New query)

-- ---------------------------------------------------------------------------
-- Profiles (extends auth.users)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, display_name, avatar_url)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'display_name', NULL),
    COALESCE(NEW.raw_user_meta_data->>'avatar_url', NULL)
  );
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- ---------------------------------------------------------------------------
-- Capabilities
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS capabilities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  source_type TEXT,
  file_name TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ---------------------------------------------------------------------------
-- Aspirations
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS aspirations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  category TEXT,
  target_url TEXT,
  end_date DATE NOT NULL,
  interval TEXT NOT NULL,
  hours_per_week INT,
  status TEXT DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ---------------------------------------------------------------------------
-- Roadmaps
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS roadmaps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  aspiration_id UUID NOT NULL REFERENCES aspirations(id) ON DELETE CASCADE,
  gap_analysis TEXT,
  gap_score JSONB,
  skills_needed JSONB,
  quick_wins JSONB,
  risk_factors JSONB,
  milestones JSONB,
  cost_summary JSONB,
  baseline_date DATE,
  generated_at TIMESTAMPTZ DEFAULT now(),
  version INT DEFAULT 1
);

-- ---------------------------------------------------------------------------
-- Completions
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS completions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  roadmap_id UUID NOT NULL REFERENCES roadmaps(id) ON DELETE CASCADE,
  milestone_index INT NOT NULL,
  action_item_index INT NOT NULL,
  effort TEXT NOT NULL DEFAULT 'done',
  completed_at TIMESTAMPTZ DEFAULT now()
);

-- ---------------------------------------------------------------------------
-- Check-ins
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS checkins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  roadmap_id UUID NOT NULL REFERENCES roadmaps(id) ON DELETE CASCADE,
  milestone_index INT NOT NULL,
  journal_entry TEXT,
  ai_response TEXT,
  score_before INT,
  score_after INT,
  completed_at TIMESTAMPTZ DEFAULT now()
);

-- ---------------------------------------------------------------------------
-- Investment scores (time series)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS investment_scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  roadmap_id UUID NOT NULL REFERENCES roadmaps(id) ON DELETE CASCADE,
  score INT NOT NULL,
  checkin_id UUID REFERENCES checkins(id),
  recorded_at TIMESTAMPTZ DEFAULT now()
);

-- ---------------------------------------------------------------------------
-- Streaks
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS streaks (
  user_id UUID PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
  current_streak INT DEFAULT 0,
  longest_streak INT DEFAULT 0,
  last_checkin_date DATE
);

-- ---------------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------------
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE capabilities ENABLE ROW LEVEL SECURITY;
ALTER TABLE aspirations ENABLE ROW LEVEL SECURITY;
ALTER TABLE roadmaps ENABLE ROW LEVEL SECURITY;
ALTER TABLE completions ENABLE ROW LEVEL SECURITY;
ALTER TABLE checkins ENABLE ROW LEVEL SECURITY;
ALTER TABLE investment_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE streaks ENABLE ROW LEVEL SECURITY;

-- Profiles
CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Capabilities
CREATE POLICY "Users can view own capabilities"
  ON capabilities FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own capabilities"
  ON capabilities FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own capabilities"
  ON capabilities FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own capabilities"
  ON capabilities FOR DELETE
  USING (auth.uid() = user_id);

-- Aspirations
CREATE POLICY "Users can view own aspirations"
  ON aspirations FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own aspirations"
  ON aspirations FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own aspirations"
  ON aspirations FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own aspirations"
  ON aspirations FOR DELETE
  USING (auth.uid() = user_id);

-- Roadmaps (access via aspiration ownership)
CREATE POLICY "Users can view own roadmaps"
  ON roadmaps FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM aspirations
      WHERE aspirations.id = roadmaps.aspiration_id
        AND aspirations.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert own roadmaps"
  ON roadmaps FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM aspirations
      WHERE aspirations.id = roadmaps.aspiration_id
        AND aspirations.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update own roadmaps"
  ON roadmaps FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM aspirations
      WHERE aspirations.id = roadmaps.aspiration_id
        AND aspirations.user_id = auth.uid()
    )
  );

-- Completions
CREATE POLICY "Users can view own completions"
  ON completions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own completions"
  ON completions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own completions"
  ON completions FOR UPDATE
  USING (auth.uid() = user_id);

-- Check-ins
CREATE POLICY "Users can view own checkins"
  ON checkins FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own checkins"
  ON checkins FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Investment scores
CREATE POLICY "Users can view own investment scores"
  ON investment_scores FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own investment scores"
  ON investment_scores FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Streaks
CREATE POLICY "Users can view own streak"
  ON streaks FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own streak"
  ON streaks FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own streak"
  ON streaks FOR UPDATE
  USING (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- Indexes for common queries
-- ---------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_capabilities_user_id ON capabilities(user_id);
CREATE INDEX IF NOT EXISTS idx_aspirations_user_id ON aspirations(user_id);
CREATE INDEX IF NOT EXISTS idx_roadmaps_aspiration_id ON roadmaps(aspiration_id);
CREATE INDEX IF NOT EXISTS idx_completions_roadmap_id ON completions(roadmap_id);
CREATE INDEX IF NOT EXISTS idx_checkins_roadmap_id ON checkins(roadmap_id);
CREATE INDEX IF NOT EXISTS idx_investment_scores_user_roadmap ON investment_scores(user_id, roadmap_id);
CREATE INDEX IF NOT EXISTS idx_investment_scores_recorded_at ON investment_scores(recorded_at);
