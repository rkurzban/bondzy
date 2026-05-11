-- Rate limiting infrastructure
-- Stores hit counts per key per time window.
-- The check_rate_limit() function is called from edge functions via supabase.rpc().

CREATE TABLE IF NOT EXISTS public.rate_limit_hits (
  key          TEXT        NOT NULL,
  window_start TIMESTAMPTZ NOT NULL,
  count        INTEGER     NOT NULL DEFAULT 1,
  PRIMARY KEY (key, window_start)
);

-- Index for efficient cleanup of expired windows
CREATE INDEX IF NOT EXISTS rate_limit_hits_window_idx
  ON public.rate_limit_hits (window_start);

-- No direct access — only via SECURITY DEFINER function or service role
ALTER TABLE public.rate_limit_hits ENABLE ROW LEVEL SECURITY;

-- check_rate_limit(key, max_count, window_seconds)
-- Increments the counter for the current window and returns TRUE if allowed.
-- Floors time to the window boundary (e.g. 3600s → current UTC hour).
-- ~1% of calls also purge rows older than 2 hours to keep the table small.
CREATE OR REPLACE FUNCTION public.check_rate_limit(
  p_key            TEXT,
  p_max_count      INTEGER,
  p_window_seconds INTEGER
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_window_start TIMESTAMPTZ;
  v_count        INTEGER;
BEGIN
  -- Floor to the current window boundary
  v_window_start := to_timestamp(
    (EXTRACT(EPOCH FROM now())::BIGINT / p_window_seconds) * p_window_seconds
  );

  -- Probabilistic cleanup (~1% of calls) — keeps the table from growing unbounded
  IF random() < 0.01 THEN
    DELETE FROM public.rate_limit_hits
    WHERE window_start < now() - INTERVAL '2 hours';
  END IF;

  INSERT INTO public.rate_limit_hits (key, window_start, count)
    VALUES (p_key, v_window_start, 1)
  ON CONFLICT (key, window_start)
    DO UPDATE SET count = rate_limit_hits.count + 1
  RETURNING count INTO v_count;

  RETURN v_count <= p_max_count;
END;
$$;
