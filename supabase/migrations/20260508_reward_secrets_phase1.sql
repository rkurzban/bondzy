-- =====================================================================
-- BONDZY: Phase 1 reward secrecy
--
-- Stores active Reward Bondzy values outside the public bondzies row.
-- The app may still submit reward_link during creation; this trigger copies
-- it to bondzy_secrets and clears bondzies.reward_link for active rewards.
-- =====================================================================

CREATE TABLE IF NOT EXISTS public.bondzy_secrets (
  bondzy_id uuid PRIMARY KEY REFERENCES public.bondzies(id) ON DELETE CASCADE,
  reward_value text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.bondzy_secrets ENABLE ROW LEVEL SECURITY;

-- No anon/authenticated policies are defined intentionally. Service-role
-- Edge Functions bypass RLS and are the only supported read path.
REVOKE ALL ON public.bondzy_secrets FROM anon;
REVOKE ALL ON public.bondzy_secrets FROM authenticated;

-- Active Reward Bondzies hide the value by clearing bondzies.reward_link.
-- Older live schemas may have reward_link marked NOT NULL from the MVP era.
ALTER TABLE public.bondzies
  ALTER COLUMN reward_link DROP NOT NULL;

-- Backfill existing active Reward Bondzies before clearing the public value.
INSERT INTO public.bondzy_secrets (bondzy_id, reward_value)
SELECT id, reward_link
FROM public.bondzies
WHERE type = 'reward'
  AND status = 'active'
  AND reward_link IS NOT NULL
  AND reward_link <> ''
ON CONFLICT (bondzy_id) DO UPDATE
SET reward_value = EXCLUDED.reward_value,
    updated_at = now();

UPDATE public.bondzies
SET reward_link = NULL
WHERE type = 'reward'
  AND status = 'active'
  AND reward_link IS NOT NULL;

CREATE OR REPLACE FUNCTION public.stash_active_reward_secret()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.type = 'reward'
     AND NEW.status = 'active'
     AND NEW.reward_link IS NOT NULL
     AND NEW.reward_link <> '' THEN
    INSERT INTO public.bondzy_secrets (bondzy_id, reward_value)
    VALUES (NEW.id, NEW.reward_link)
    ON CONFLICT (bondzy_id) DO UPDATE
    SET reward_value = EXCLUDED.reward_value,
        updated_at = now();

    UPDATE public.bondzies
    SET reward_link = NULL
    WHERE id = NEW.id
      AND reward_link IS NOT NULL;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS stash_active_reward_secret_after_write ON public.bondzies;

CREATE TRIGGER stash_active_reward_secret_after_write
AFTER INSERT OR UPDATE OF reward_link, status, type ON public.bondzies
FOR EACH ROW
EXECUTE FUNCTION public.stash_active_reward_secret();
