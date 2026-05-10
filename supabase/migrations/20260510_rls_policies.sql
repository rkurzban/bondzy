-- =====================================================================
-- BONDZY: Version-controlled RLS policies
-- =====================================================================

ALTER TABLE public.bondzies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bondzy_secrets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bondzy_claims ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON public.bondzies FROM anon;
REVOKE ALL ON public.profiles FROM anon;
REVOKE ALL ON public.bondzy_secrets FROM anon;
REVOKE ALL ON public.bondzy_claims FROM anon;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.bondzies TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;

REVOKE ALL ON public.bondzy_secrets FROM authenticated;
REVOKE ALL ON public.bondzy_claims FROM authenticated;

DROP POLICY IF EXISTS bondzies_select_own ON public.bondzies;
DROP POLICY IF EXISTS bondzies_insert_own ON public.bondzies;
DROP POLICY IF EXISTS bondzies_update_creator ON public.bondzies;
DROP POLICY IF EXISTS bondzies_delete_creator ON public.bondzies;

CREATE POLICY bondzies_select_own
ON public.bondzies
FOR SELECT
TO authenticated
USING (
  creator_id = auth.uid()
  OR recipient_id = auth.uid()
  OR lower(coalesce(recipient_email, '')) = lower(coalesce(auth.jwt() ->> 'email', ''))
);

CREATE POLICY bondzies_insert_own
ON public.bondzies
FOR INSERT
TO authenticated
WITH CHECK (
  creator_id = auth.uid()
  AND reward_link IS NULL
);

CREATE POLICY bondzies_update_creator
ON public.bondzies
FOR UPDATE
TO authenticated
USING (creator_id = auth.uid())
WITH CHECK (creator_id = auth.uid());

CREATE POLICY bondzies_delete_creator
ON public.bondzies
FOR DELETE
TO authenticated
USING (creator_id = auth.uid());

DROP POLICY IF EXISTS profiles_select_related ON public.profiles;
DROP POLICY IF EXISTS profiles_insert_self ON public.profiles;
DROP POLICY IF EXISTS profiles_update_self ON public.profiles;

CREATE POLICY profiles_select_related
ON public.profiles
FOR SELECT
TO authenticated
USING (
  id = auth.uid()
  OR EXISTS (
    SELECT 1
    FROM public.bondzies b
    WHERE (b.creator_id = profiles.id OR b.recipient_id = profiles.id)
      AND (
        b.creator_id = auth.uid()
        OR b.recipient_id = auth.uid()
        OR lower(coalesce(b.recipient_email, '')) = lower(coalesce(auth.jwt() ->> 'email', ''))
      )
  )
);

CREATE POLICY profiles_insert_self
ON public.profiles
FOR INSERT
TO authenticated
WITH CHECK (id = auth.uid());

CREATE POLICY profiles_update_self
ON public.profiles
FOR UPDATE
TO authenticated
USING (id = auth.uid())
WITH CHECK (id = auth.uid());
