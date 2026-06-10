-- =====================================================================
-- BONDZY: Promise penalty secrecy
--
-- Extends the Phase 1 reward secrecy pattern to Promise penalties.
-- The public bondzies.reward_link column should not hold active or
-- forfeited Promise penalty values.
-- =====================================================================

INSERT INTO public.bondzy_secrets (bondzy_id, reward_value)
SELECT id, reward_link
FROM public.bondzies
WHERE type = 'promise'
  AND reward_link IS NOT NULL
  AND reward_link <> ''
ON CONFLICT (bondzy_id) DO UPDATE
SET reward_value = EXCLUDED.reward_value,
    updated_at = now();

UPDATE public.bondzies
SET reward_link = NULL
WHERE type = 'promise'
  AND reward_link IS NOT NULL;

CREATE OR REPLACE FUNCTION public.stash_active_reward_secret()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.type IN ('reward', 'promise')
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
