-- Releases a reservation whose Stripe session could not be created, so its stock is not held.
CREATE OR REPLACE FUNCTION public.pipesan_release_unopened_checkout(checkout uuid)
RETURNS text LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
DECLARE c public.pipesan_checkout_sessions; item jsonb;
BEGIN
 SELECT * INTO c FROM public.pipesan_checkout_sessions WHERE id=checkout FOR UPDATE;
 IF c.id IS NULL OR c.state<>'reserved' OR c.stripe_session_id IS NOT NULL THEN RETURN coalesce(c.state,'unknown'); END IF;
 FOR item IN SELECT value FROM jsonb_array_elements(c.items) LOOP
  IF (item->>'reservedStock')::boolean THEN UPDATE public.products SET stock_quantity=stock_quantity+(item->>'quantity')::integer WHERE id=(item->>'productId')::uuid; END IF;
 END LOOP;
 UPDATE public.orders SET payment_status='failed',status='canceled' WHERE id=c.order_id;
 UPDATE public.pipesan_checkout_sessions SET state='released' WHERE id=c.id;
 RETURN 'released';
END $$;
REVOKE ALL ON FUNCTION public.pipesan_release_unopened_checkout(uuid) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.pipesan_release_unopened_checkout(uuid) TO service_role;
