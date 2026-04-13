-- =====================================================================
-- BONDZY: Server-side auto-forfeit for expired active Bondzies
--
-- Run this in your Supabase SQL editor:
--   Dashboard > SQL Editor > New query > paste > Run
--
-- Prerequisite: enable pg_cron first if you haven't already:
--   Dashboard > Database > Extensions > search "pg_cron" > Enable
-- =====================================================================


-- 1. Add timezone column so the server knows how to interpret stored times.
--    Existing rows default to 'UTC'; new rows will capture the creator's
--    local IANA timezone (e.g. "America/New_York") at creation time.
ALTER TABLE public.bondzies
  ADD COLUMN IF NOT EXISTS timezone text DEFAULT 'UTC';


-- 2. Create (or replace) the forfeit function.
--    Marks any active Bondzy whose grace window has closed as 'forfeit'.
CREATE OR REPLACE FUNCTION public.forfeit_expired_bondzies()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE public.bondzies
  SET status = 'forfeit'
  WHERE status = 'active'
    AND date IS NOT NULL
    AND time IS NOT NULL
    AND (
        -- Reconstruct the end of the grace window in the creator's timezone,
        -- then compare against the current UTC time.
        (date || ' ' || time)::timestamp
          AT TIME ZONE COALESCE(NULLIF(timezone, ''), 'UTC')
        + (COALESCE(grace_minutes, 10) || ' minutes')::interval
      ) < NOW();
END;
$$;


-- 3. Schedule the function to run every 5 minutes via pg_cron.
--    The DO block removes any pre-existing job with the same name first,
--    so this script is safe to re-run.
DO $$
BEGIN
  PERFORM cron.unschedule('forfeit-expired-bondzies');
EXCEPTION WHEN OTHERS THEN
  NULL; -- job didn't exist yet, that's fine
END
$$;

SELECT cron.schedule(
  'forfeit-expired-bondzies',   -- job name
  '*/5 * * * *',                -- every 5 minutes
  'SELECT public.forfeit_expired_bondzies()'
);
