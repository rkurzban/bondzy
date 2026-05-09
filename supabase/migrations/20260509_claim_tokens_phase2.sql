-- =====================================================================
-- BONDZY: Phase 2 claim tokens
--
-- Replaces public share links that expose bondzies.id with private,
-- opaque claim tokens. The token table has no anon/authenticated read
-- policies; Edge Functions and a scoped helper are the supported paths.
-- =====================================================================

CREATE SCHEMA IF NOT EXISTS extensions;
CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA extensions;

CREATE TABLE IF NOT EXISTS public.bondzy_claims (
  bondzy_id uuid PRIMARY KEY REFERENCES public.bondzies(id) ON DELETE CASCADE,
  claim_token uuid NOT NULL DEFAULT extensions.gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS bondzy_claims_claim_token_key
  ON public.bondzy_claims (claim_token);

ALTER TABLE public.bondzy_claims ENABLE ROW LEVEL SECURITY;

-- No anon/authenticated policies are defined intentionally. Service-role
-- Edge Functions bypass RLS, and authenticated users can only get their
-- own token through get_bondzy_claim_token().
REVOKE ALL ON public.bondzy_claims FROM anon;
REVOKE ALL ON public.bondzy_claims FROM authenticated;

INSERT INTO public.bondzy_claims (bondzy_id)
SELECT id
FROM public.bondzies
ON CONFLICT (bondzy_id) DO NOTHING;

CREATE OR REPLACE FUNCTION public.ensure_bondzy_claim()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
BEGIN
  INSERT INTO public.bondzy_claims (bondzy_id)
  VALUES (NEW.id)
  ON CONFLICT (bondzy_id) DO NOTHING;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS ensure_bondzy_claim_after_insert ON public.bondzies;

CREATE TRIGGER ensure_bondzy_claim_after_insert
AFTER INSERT ON public.bondzies
FOR EACH ROW
EXECUTE FUNCTION public.ensure_bondzy_claim();

CREATE OR REPLACE FUNCTION public.get_bondzy_claim_token(p_bondzy_id uuid)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
  token uuid;
  user_email text := lower(coalesce(auth.jwt() ->> 'email', ''));
BEGIN
  IF auth.uid() IS NULL THEN
    RETURN NULL;
  END IF;

  SELECT c.claim_token
  INTO token
  FROM public.bondzy_claims c
  JOIN public.bondzies b ON b.id = c.bondzy_id
  WHERE b.id = p_bondzy_id
    AND (
      b.creator_id = auth.uid()
      OR b.recipient_id = auth.uid()
      OR lower(coalesce(b.recipient_email, '')) = user_email
    );

  RETURN token;
END;
$$;

REVOKE ALL ON FUNCTION public.get_bondzy_claim_token(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_bondzy_claim_token(uuid) TO authenticated;
