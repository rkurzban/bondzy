-- =====================================================================
-- BONDZY: Explicit Data API grants
--
-- Supabase is moving public-schema tables/functions from implicit Data API
-- exposure to explicit opt-in grants. Keep Bondzy's intended API surface
-- stable, and make future public objects private until a migration grants
-- only the privileges they actually need.
-- =====================================================================

-- Roles need schema usage before object-level grants matter.
GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;

-- Browser/Data API surface.
-- Anonymous users use Edge Functions for claim links; they do not read
-- application tables directly.
REVOKE ALL ON TABLE public.bondzies FROM anon;
REVOKE ALL ON TABLE public.profiles FROM anon;

GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.bondzies TO authenticated;
GRANT SELECT, INSERT, UPDATE ON TABLE public.profiles TO authenticated;

-- Service-role Edge Functions and maintenance scripts use the Data API too.
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.bondzies TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.profiles TO service_role;

-- Internal tables stay hidden from anon/authenticated clients. Service-role
-- Edge Functions are the only supported API path.
REVOKE ALL ON TABLE public.bondzy_secrets FROM anon, authenticated;
REVOKE ALL ON TABLE public.bondzy_claims FROM anon, authenticated;
REVOKE ALL ON TABLE public.rate_limit_hits FROM anon, authenticated;

GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.bondzy_secrets TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.bondzy_claims TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.rate_limit_hits TO service_role;

-- RPC/function surface.
REVOKE EXECUTE ON FUNCTION public.get_bondzy_claim_token(uuid) FROM PUBLIC, anon, service_role;
GRANT EXECUTE ON FUNCTION public.get_bondzy_claim_token(uuid) TO authenticated;

REVOKE EXECUTE ON FUNCTION public.can_read_bondzy_profile(uuid) FROM PUBLIC, anon, service_role;
GRANT EXECUTE ON FUNCTION public.can_read_bondzy_profile(uuid) TO authenticated;

REVOKE EXECUTE ON FUNCTION public.check_rate_limit(text, integer, integer) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.check_rate_limit(text, integer, integer) TO service_role;

REVOKE EXECUTE ON FUNCTION public.forfeit_expired_bondzies() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.forfeit_expired_bondzies() TO service_role;

-- Trigger functions should not be exposed as public RPC endpoints.
REVOKE EXECUTE ON FUNCTION public.ensure_bondzy_claim() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.ensure_bondzy_claim() TO service_role;

REVOKE EXECUTE ON FUNCTION public.stash_active_reward_secret() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.stash_active_reward_secret() TO service_role;

-- Opt the project into Supabase's new default now: future public objects
-- must add explicit grants in their own migrations.
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public
  REVOKE SELECT, INSERT, UPDATE, DELETE ON TABLES FROM anon, authenticated, service_role;

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public
  REVOKE EXECUTE ON FUNCTIONS FROM PUBLIC, anon, authenticated, service_role;

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public
  REVOKE USAGE, SELECT ON SEQUENCES FROM anon, authenticated, service_role;
