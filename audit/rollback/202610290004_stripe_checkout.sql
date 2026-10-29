-- Disable entry points; preserve orders, stock reservations and audit records.
-- Reconcile every reserved checkout against Stripe before releasing its stock.
BEGIN;
REVOKE EXECUTE ON FUNCTION public.pipesan_reserve_checkout(uuid,uuid,jsonb,jsonb) FROM service_role;
REVOKE EXECUTE ON FUNCTION public.pipesan_finish_checkout(text,boolean,bigint,bigint,text) FROM service_role;
COMMIT;
-- The corrected item-total trigger and restrictive order policies remain in place.
-- Disable CHECKOUT_ENABLED and VITE_CHECKOUT_ENABLED before rolling back application code.
