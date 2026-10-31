-- Product and shipping prices include VAT: Stripe charges exactly subtotal + shipping and reports
-- the VAT contained in it, which the order keeps as tax_amount.
CREATE OR REPLACE FUNCTION public.pipesan_refresh_order_totals()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
DECLARE target uuid; amount numeric;
BEGIN
 FOR target IN SELECT DISTINCT id FROM unnest(ARRAY[CASE WHEN TG_OP<>'INSERT' THEN OLD.order_id END,CASE WHEN TG_OP<>'DELETE' THEN NEW.order_id END]) id WHERE id IS NOT NULL LOOP
  SELECT coalesce(sum(total_price),0) INTO amount FROM public.order_items WHERE order_id=target;
  UPDATE public.orders SET subtotal=amount,total_amount=amount+shipping_amount-coalesce(discount_amount,0) WHERE id=target;
 END LOOP;
 RETURN NULL;
END $$;

CREATE OR REPLACE FUNCTION public.pipesan_finish_checkout(session_id text, paid boolean, total_cents bigint DEFAULT NULL, tax_cents bigint DEFAULT NULL, intent_id text DEFAULT NULL)
RETURNS text LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
DECLARE c public.pipesan_checkout_sessions; o public.orders; item jsonb;
BEGIN
 SELECT * INTO c FROM public.pipesan_checkout_sessions WHERE stripe_session_id=session_id FOR UPDATE;
 IF c.id IS NULL THEN RAISE EXCEPTION 'Unknown checkout session'; END IF;
 IF c.state='paid' THEN RETURN 'paid'; END IF;
 IF c.state='released' THEN IF paid THEN RAISE EXCEPTION 'Payment received for released reservation'; END IF; RETURN 'released'; END IF;
 SELECT * INTO o FROM public.orders WHERE id=c.order_id FOR UPDATE;
 IF paid THEN
  IF total_cents IS NULL OR tax_cents IS NULL OR tax_cents<0 OR tax_cents>total_cents OR total_cents<>round((o.subtotal+o.shipping_amount)*100)::bigint THEN RAISE EXCEPTION 'Payment amount mismatch'; END IF;
  UPDATE public.orders SET payment_status='paid',status='paid',payment_intent_id=intent_id,tax_amount=tax_cents/100.0,total_amount=total_cents/100.0 WHERE id=o.id;
  UPDATE public.pipesan_checkout_sessions SET state='paid' WHERE id=c.id;
  RETURN 'paid';
 ELSE
  FOR item IN SELECT value FROM jsonb_array_elements(c.items) LOOP
   IF (item->>'reservedStock')::boolean THEN UPDATE public.products SET stock_quantity=stock_quantity+(item->>'quantity')::integer WHERE id=(item->>'productId')::uuid; END IF;
  END LOOP;
  UPDATE public.orders SET payment_status='failed',status='canceled' WHERE id=o.id;
  UPDATE public.pipesan_checkout_sessions SET state='released' WHERE id=c.id;
  RETURN 'released';
 END IF;
END $$;
