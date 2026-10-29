BEGIN;
DROP POLICY pipesan_tracking_insert_guard ON public.tracking_notifications;
DROP POLICY pipesan_legacy_review_insert_guard ON public.reviews;
DROP POLICY pipesan_review_read_guard ON public.product_reviews;
DROP POLICY pipesan_review_insert_guard ON public.product_reviews;
DROP TRIGGER pipesan_protect_review_moderation ON public.product_reviews;
DROP FUNCTION public.pipesan_protect_review_moderation();
COMMIT;
