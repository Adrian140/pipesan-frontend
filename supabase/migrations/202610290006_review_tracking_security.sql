BEGIN;
-- Shipping events are written by trusted server triggers or administrators.
CREATE POLICY pipesan_tracking_insert_guard ON public.tracking_notifications AS RESTRICTIVE
 FOR INSERT TO anon,authenticated WITH CHECK(public.check_admin_role());
-- Legacy reviews have no ownership/moderation model; keep publishing admin-only.
CREATE POLICY pipesan_legacy_review_insert_guard ON public.reviews AS RESTRICTIVE
 FOR INSERT TO anon,authenticated WITH CHECK(public.check_admin_role());
-- Full review rows contain private email/admin notes. Public catalog uses product aggregates.
CREATE POLICY pipesan_review_read_guard ON public.product_reviews AS RESTRICTIVE
 FOR SELECT TO anon,authenticated USING(public.check_admin_role() OR user_id=auth.uid());
CREATE POLICY pipesan_review_insert_guard ON public.product_reviews AS RESTRICTIVE
 FOR INSERT TO anon,authenticated WITH CHECK(public.check_admin_role() OR (
 user_id=auth.uid() AND is_approved IS NOT TRUE AND is_featured IS NOT TRUE
 AND is_verified_purchase IS NOT TRUE AND created_by_admin IS NOT TRUE
 AND admin_notes IS NULL AND purchase_date IS NULL AND coalesce(helpful_count,0)=0));
CREATE FUNCTION public.pipesan_protect_review_moderation()
RETURNS trigger LANGUAGE plpgsql SET search_path=public,pg_temp AS $$
BEGIN
 IF current_user IN ('anon','authenticated') AND NOT public.check_admin_role() THEN
  IF NEW.is_approved IS DISTINCT FROM OLD.is_approved OR NEW.is_featured IS DISTINCT FROM OLD.is_featured
   OR NEW.is_verified_purchase IS DISTINCT FROM OLD.is_verified_purchase OR NEW.created_by_admin IS DISTINCT FROM OLD.created_by_admin
   OR NEW.admin_notes IS DISTINCT FROM OLD.admin_notes OR NEW.purchase_date IS DISTINCT FROM OLD.purchase_date
   OR NEW.helpful_count IS DISTINCT FROM OLD.helpful_count OR NEW.product_id IS DISTINCT FROM OLD.product_id
   OR NEW.user_id IS DISTINCT FROM OLD.user_id OR NEW.id IS DISTINCT FROM OLD.id THEN
   RAISE EXCEPTION 'Review moderation fields require administrator access' USING ERRCODE='42501';
  END IF;
 END IF;
 RETURN NEW;
END $$;
CREATE TRIGGER pipesan_protect_review_moderation BEFORE UPDATE ON public.product_reviews
 FOR EACH ROW EXECUTE FUNCTION public.pipesan_protect_review_moderation();
COMMIT;
