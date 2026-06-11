-- Free vs Guru plan tiers

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS plan_tier TEXT NOT NULL DEFAULT 'free'
  CHECK (plan_tier IN ('free', 'guru'));

ALTER TABLE profiles
  DROP CONSTRAINT IF EXISTS reminder_guru_only;

ALTER TABLE profiles
  ADD CONSTRAINT reminder_guru_only
  CHECK (plan_tier = 'guru' OR reminder_enabled = false);

ALTER TABLE roadmaps
  ADD COLUMN IF NOT EXISTS total_milestone_count INT;

UPDATE roadmaps
SET total_milestone_count = jsonb_array_length(milestones)
WHERE total_milestone_count IS NULL
  AND milestones IS NOT NULL
  AND jsonb_typeof(milestones) = 'array';

-- Users cannot self-promote to Guru via the profiles API / client.
CREATE OR REPLACE FUNCTION public.prevent_self_plan_tier_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.uid() = OLD.id AND NEW.plan_tier IS DISTINCT FROM OLD.plan_tier THEN
    RAISE EXCEPTION 'plan_tier cannot be changed directly';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS enforce_plan_tier_immutable_for_users ON profiles;
CREATE TRIGGER enforce_plan_tier_immutable_for_users
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.prevent_self_plan_tier_change();

CREATE OR REPLACE FUNCTION public.enforce_free_roadmap_storage()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  owner_plan TEXT;
  owner_id UUID;
  milestone_len INT;
BEGIN
  SELECT a.user_id, p.plan_tier
  INTO owner_id, owner_plan
  FROM aspirations a
  JOIN profiles p ON p.id = a.user_id
  WHERE a.id = NEW.aspiration_id;

  milestone_len := jsonb_array_length(COALESCE(NEW.milestones, '[]'::jsonb));

  IF owner_plan = 'free' THEN
    IF milestone_len > 2 THEN
      RAISE EXCEPTION 'Free plan roadmaps may only store two intervals';
    END IF;

    IF TG_OP = 'UPDATE' AND auth.uid() = owner_id THEN
      IF NEW.milestones IS DISTINCT FROM OLD.milestones THEN
        RAISE EXCEPTION 'Roadmap milestones cannot be edited directly';
      END IF;
      IF NEW.total_milestone_count IS DISTINCT FROM OLD.total_milestone_count THEN
        RAISE EXCEPTION 'total_milestone_count cannot be edited directly';
      END IF;
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS enforce_free_roadmap_storage_insert ON roadmaps;
CREATE TRIGGER enforce_free_roadmap_storage_insert
  BEFORE INSERT ON roadmaps
  FOR EACH ROW
  EXECUTE FUNCTION public.enforce_free_roadmap_storage();

DROP TRIGGER IF EXISTS enforce_free_roadmap_storage_update ON roadmaps;
CREATE TRIGGER enforce_free_roadmap_storage_update
  BEFORE UPDATE ON roadmaps
  FOR EACH ROW
  EXECUTE FUNCTION public.enforce_free_roadmap_storage();
