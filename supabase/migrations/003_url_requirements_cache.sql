-- Shared cache for Claude-extracted URL requirements (cross-user, token savings)
CREATE TABLE IF NOT EXISTS url_requirements_cache (
  normalized_url TEXT PRIMARY KEY,
  source_url TEXT NOT NULL,
  requirements_text TEXT NOT NULL,
  model TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ NOT NULL,
  hit_count INT NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_url_requirements_cache_expires_at
  ON url_requirements_cache (expires_at);

ALTER TABLE url_requirements_cache ENABLE ROW LEVEL SECURITY;

-- Any signed-in user can read non-expired cache entries
CREATE POLICY "Authenticated users can read url requirements cache"
  ON url_requirements_cache FOR SELECT
  TO authenticated
  USING (expires_at > now());

-- Writes only through SECURITY DEFINER functions below

CREATE OR REPLACE FUNCTION public.get_cached_url_requirements(p_normalized_url TEXT)
RETURNS TABLE (
  requirements_text TEXT,
  expires_at TIMESTAMPTZ,
  hit_count INT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  RETURN QUERY
  UPDATE url_requirements_cache AS cache
  SET hit_count = cache.hit_count + 1
  WHERE cache.normalized_url = p_normalized_url
    AND cache.expires_at > now()
  RETURNING cache.requirements_text, cache.expires_at, cache.hit_count;
END;
$$;

CREATE OR REPLACE FUNCTION public.upsert_url_requirements_cache(
  p_normalized_url TEXT,
  p_source_url TEXT,
  p_requirements_text TEXT,
  p_model TEXT,
  p_ttl_days INT DEFAULT 30
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  IF p_normalized_url IS NULL OR length(trim(p_normalized_url)) = 0 THEN
    RAISE EXCEPTION 'normalized_url is required';
  END IF;

  IF p_requirements_text IS NULL OR length(trim(p_requirements_text)) = 0 THEN
    RAISE EXCEPTION 'requirements_text is required';
  END IF;

  INSERT INTO url_requirements_cache (
    normalized_url,
    source_url,
    requirements_text,
    model,
    expires_at,
    hit_count
  )
  VALUES (
    p_normalized_url,
    p_source_url,
    trim(p_requirements_text),
    COALESCE(NULLIF(trim(p_model), ''), 'unknown'),
    now() + make_interval(days => GREATEST(p_ttl_days, 1)),
    0
  )
  ON CONFLICT (normalized_url) DO UPDATE SET
    source_url = EXCLUDED.source_url,
    requirements_text = EXCLUDED.requirements_text,
    model = EXCLUDED.model,
    updated_at = now(),
    expires_at = EXCLUDED.expires_at,
    hit_count = 0;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_cached_url_requirements(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.upsert_url_requirements_cache(TEXT, TEXT, TEXT, TEXT, INT) TO authenticated;

COMMENT ON TABLE url_requirements_cache IS
  'Shared Claude extractions keyed by normalized URL. Reduces duplicate token spend across users.';
