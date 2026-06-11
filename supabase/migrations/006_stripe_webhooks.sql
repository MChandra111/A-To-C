-- Stripe webhook idempotency + Guru purchase audit log

CREATE TABLE IF NOT EXISTS stripe_webhook_events (
  event_id TEXT PRIMARY KEY,
  event_type TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS guru_purchases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  stripe_checkout_session_id TEXT NOT NULL UNIQUE,
  stripe_event_id TEXT NOT NULL,
  customer_email TEXT,
  amount_cents INT NOT NULL,
  currency TEXT NOT NULL DEFAULT 'usd',
  purchased_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE stripe_webhook_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE guru_purchases ENABLE ROW LEVEL SECURITY;

-- Resolve auth user id by email (service-role / SECURITY DEFINER only).
CREATE OR REPLACE FUNCTION public.user_id_for_email(user_email TEXT)
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = auth, public
AS $$
  SELECT id
  FROM auth.users
  WHERE lower(email) = lower(trim(user_email))
  LIMIT 1;
$$;

REVOKE ALL ON FUNCTION public.user_id_for_email(TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.user_id_for_email(TEXT) TO service_role;
