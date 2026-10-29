-- Additional restrictive policies preserve existing grants while closing broad legacy policies.
-- Apply only this migration to the existing production project; do not replay legacy schemas.
BEGIN;
CREATE POLICY pipesan_profile_read_guard ON public.users AS RESTRICTIVE
  FOR SELECT TO anon, authenticated
  USING (auth.uid() = auth_id OR public.check_admin_role());
CREATE POLICY pipesan_profile_insert_guard ON public.users AS RESTRICTIVE
  FOR INSERT TO anon, authenticated
  WITH CHECK ((auth.uid() = auth_id AND role = 'user') OR public.check_admin_role());
CREATE OR REPLACE FUNCTION public.pipesan_protect_profile_identity()
RETURNS trigger LANGUAGE plpgsql SET search_path = public, pg_temp AS $$
BEGIN
  IF current_user IN ('anon', 'authenticated') AND NOT public.check_admin_role() THEN
    IF NEW.role IS DISTINCT FROM OLD.role OR NEW.auth_id IS DISTINCT FROM OLD.auth_id
       OR NEW.id IS DISTINCT FROM OLD.id OR NEW.email IS DISTINCT FROM OLD.email
       OR NEW.email_verified IS DISTINCT FROM OLD.email_verified
       OR NEW.two_factor_enabled IS DISTINCT FROM OLD.two_factor_enabled
       OR NEW.two_factor_secret IS DISTINCT FROM OLD.two_factor_secret THEN
      RAISE EXCEPTION 'Protected account fields cannot be changed by the account owner' USING ERRCODE = '42501';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;
CREATE TRIGGER pipesan_protect_profile_identity BEFORE UPDATE ON public.users
  FOR EACH ROW EXECUTE FUNCTION public.pipesan_protect_profile_identity();
-- Restrictive policies are ANDed with the old permissive ones.
CREATE POLICY pipesan_public_product_guard ON public.products AS RESTRICTIVE
  FOR SELECT TO anon, authenticated
  USING ((is_active = true AND is_draft = false) OR public.check_admin_role());
CREATE POLICY pipesan_public_category_guard ON public.categories AS RESTRICTIVE
  FOR SELECT TO anon, authenticated USING (is_active = true OR public.check_admin_role());

SELECT set_config('request.jwt.claim.sub',(select auth_id::text from public.users where role='user' and auth_id is not null limit 1),true);
SET LOCAL ROLE authenticated;
DO $$
BEGIN
 IF auth.uid() IS NULL THEN RAISE EXCEPTION 'No ordinary test user'; END IF;
 IF EXISTS(select 1 from public.users where auth_id <> auth.uid()) THEN RAISE EXCEPTION 'Profile isolation failed'; END IF;
 IF NOT EXISTS(select 1 from public.users where auth_id=auth.uid()) THEN RAISE EXCEPTION 'Own profile missing'; END IF;
 BEGIN
   update public.users set role='admin' where auth_id=auth.uid();
   RAISE EXCEPTION 'Role escalation was allowed';
 EXCEPTION WHEN insufficient_privilege THEN NULL;
 END;
 IF EXISTS(select 1 from public.products where is_active is not true or is_draft is not false) THEN RAISE EXCEPTION 'Draft isolation failed'; END IF;
END $$;
RESET ROLE;
SELECT 'Profile isolation, escalation prevention and product visibility: PASS (rolled back)' as validation;
ROLLBACK;
