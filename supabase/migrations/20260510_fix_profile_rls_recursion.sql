-- Fix dashboard queries that embed creator profiles while profiles RLS checks
-- related Bondzies. The SECURITY DEFINER helper evaluates that relationship
-- without recursively applying table RLS inside the policy.

CREATE OR REPLACE FUNCTION public.can_read_bondzy_profile(p_profile_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    p_profile_id = auth.uid()
    OR EXISTS (
      SELECT 1
      FROM public.bondzies b
      WHERE (b.creator_id = p_profile_id OR b.recipient_id = p_profile_id)
        AND (
          b.creator_id = auth.uid()
          OR b.recipient_id = auth.uid()
          OR lower(coalesce(b.recipient_email, '')) = lower(coalesce(auth.jwt() ->> 'email', ''))
        )
    );
$$;

REVOKE ALL ON FUNCTION public.can_read_bondzy_profile(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.can_read_bondzy_profile(uuid) TO authenticated;

DROP POLICY IF EXISTS profiles_select_related ON public.profiles;

CREATE POLICY profiles_select_related
ON public.profiles
FOR SELECT
TO authenticated
USING (public.can_read_bondzy_profile(id));
