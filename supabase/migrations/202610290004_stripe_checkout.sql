BEGIN;
CREATE TABLE public.pipesan_checkout_sessions (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 request_key uuid NOT NULL,
 auth_id uuid NOT NULL,
 order_id uuid NOT NULL UNIQUE REFERENCES public.orders(id),
 state text NOT NULL DEFAULT 'reserved' CHECK(state IN ('reserved','paid','released')),
 stripe_session_id text UNIQUE,
 stripe_url text,
 items jsonb NOT NULL,
 created_at timestamptz NOT NULL DEFAULT now(),
 UNIQUE(auth_id,request_key)
);
ALTER TABLE public.pipesan_checkout_sessions ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.pipesan_checkout_sessions FROM anon,authenticated;
GRANT ALL ON public.pipesan_checkout_sessions TO service_role;

-- Prices, stock, payment state and order history must be written by trusted server code.
CREATE POLICY pipesan_order_insert_guard ON public.orders AS RESTRICTIVE FOR INSERT TO anon,authenticated WITH CHECK(public.check_admin_role());
CREATE POLICY pipesan_order_update_guard ON public.orders AS RESTRICTIVE FOR UPDATE TO anon,authenticated USING(public.check_admin_role()) WITH CHECK(public.check_admin_role());
CREATE POLICY pipesan_order_delete_guard ON public.orders AS RESTRICTIVE FOR DELETE TO anon,authenticated USING(public.check_admin_role());
CREATE POLICY pipesan_items_write_guard ON public.order_items AS RESTRICTIVE FOR INSERT TO anon,authenticated WITH CHECK(public.check_admin_role());
CREATE POLICY pipesan_items_update_guard ON public.order_items AS RESTRICTIVE FOR UPDATE TO anon,authenticated USING(public.check_admin_role()) WITH CHECK(public.check_admin_role());
CREATE POLICY pipesan_items_delete_guard ON public.order_items AS RESTRICTIVE FOR DELETE TO anon,authenticated USING(public.check_admin_role());

-- The legacy BEFORE trigger summed rows before the new item existed.
CREATE OR REPLACE FUNCTION public.calculate_order_totals()
RETURNS trigger LANGUAGE plpgsql SET search_path=public,pg_temp AS $$
BEGIN
 IF NEW.quantity<1 OR NEW.unit_price<0 THEN RAISE EXCEPTION 'Invalid order item'; END IF;
 NEW.total_price:=NEW.unit_price*NEW.quantity;
 RETURN NEW;
END $$;
CREATE FUNCTION public.pipesan_refresh_order_totals()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
DECLARE target uuid; amount numeric;
BEGIN
 FOR target IN SELECT DISTINCT id FROM unnest(ARRAY[CASE WHEN TG_OP<>'INSERT' THEN OLD.order_id END,CASE WHEN TG_OP<>'DELETE' THEN NEW.order_id END]) id WHERE id IS NOT NULL LOOP
  SELECT coalesce(sum(total_price),0) INTO amount FROM public.order_items WHERE order_id=target;
  UPDATE public.orders SET subtotal=amount,total_amount=amount+tax_amount+shipping_amount-coalesce(discount_amount,0) WHERE id=target;
 END LOOP;
 RETURN NULL;
END $$;
CREATE TRIGGER pipesan_refresh_order_totals AFTER INSERT OR UPDATE OR DELETE ON public.order_items FOR EACH ROW EXECUTE FUNCTION public.pipesan_refresh_order_totals();

CREATE FUNCTION public.pipesan_reserve_checkout(account_id uuid, request_id uuid, cart jsonb, address jsonb)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
DECLARE existing public.pipesan_checkout_sessions; profile public.users; email text;
 p public.products; item record; qty integer; unit numeric; subtotal numeric:=0; shipping numeric;
 snapshot jsonb:='[]'; order_id_new uuid:=gen_random_uuid(); checkout_id uuid; field text;
BEGIN
 -- Serialize retries for this account/request pair before checking for an existing reservation.
 PERFORM pg_advisory_xact_lock(hashtextextended(account_id::text,0));
 SELECT * INTO existing FROM public.pipesan_checkout_sessions WHERE auth_id=account_id AND request_key=request_id;
 IF FOUND THEN RETURN jsonb_build_object('checkout',to_jsonb(existing),'order',(select to_jsonb(o) from public.orders o where o.id=existing.order_id)); END IF;
 IF (SELECT count(*) FROM public.pipesan_checkout_sessions WHERE auth_id=account_id AND state='reserved')>=3 THEN RAISE EXCEPTION 'You already have pending checkouts. Complete an existing payment or contact support.'; END IF;
 SELECT * INTO profile FROM public.users WHERE auth_id=account_id;
 IF profile.id IS NULL THEN RAISE EXCEPTION 'Account profile unavailable'; END IF;
 SELECT a.email INTO email FROM auth.users a WHERE a.id=account_id AND a.email_confirmed_at IS NOT NULL;
 IF email IS NULL THEN RAISE EXCEPTION 'Confirm your email before placing an order'; END IF;
 IF jsonb_typeof(cart) IS DISTINCT FROM 'array' OR jsonb_array_length(cart) NOT BETWEEN 1 AND 50 THEN RAISE EXCEPTION 'Invalid cart'; END IF;
 FOREACH field IN ARRAY ARRAY['firstName','lastName','address','city','postalCode','country'] LOOP
  IF length(trim(coalesce(address->>field,''))) NOT BETWEEN 1 AND 250 THEN RAISE EXCEPTION 'Complete the billing and shipping address'; END IF;
 END LOOP;
 IF address->>'country' NOT IN ('FR','DE','IT','ES','NL','BE','PL','RO') THEN RAISE EXCEPTION 'Delivery country is not supported'; END IF;
 IF (SELECT count(*)<>count(DISTINCT value->>'productId') FROM jsonb_array_elements(cart)) THEN RAISE EXCEPTION 'Duplicate product'; END IF;
 FOR item IN SELECT value FROM jsonb_array_elements(cart) ORDER BY value->>'productId' LOOP
  IF (item.value->>'quantity') !~ '^[1-9][0-9]?$' THEN RAISE EXCEPTION 'Quantity must be between 1 and 99'; END IF;
  qty:=(item.value->>'quantity')::integer;
  SELECT * INTO p FROM public.products WHERE id=(item.value->>'productId')::uuid FOR UPDATE;
  IF p.id IS NULL OR p.is_active IS NOT TRUE OR p.is_draft IS NOT FALSE OR p.in_stock IS FALSE OR p.stock_status='out_of_stock' THEN RAISE EXCEPTION 'A product is no longer available'; END IF;
  unit:=CASE WHEN p.sale_price>=0 AND p.sale_price<p.price THEN p.sale_price ELSE p.price END;
  IF unit IS NULL OR unit::text IN ('NaN','Infinity','-Infinity') OR unit<=0 OR unit<>round(unit,2) OR p.currency IS DISTINCT FROM 'EUR' THEN RAISE EXCEPTION 'Invalid product price or currency'; END IF;
  IF p.manage_stock IS NOT FALSE THEN
   IF coalesce(p.stock_quantity,0)<qty THEN RAISE EXCEPTION 'Insufficient stock for %',p.sku; END IF;
   UPDATE public.products SET stock_quantity=stock_quantity-qty WHERE id=p.id;
  END IF;
  subtotal:=subtotal+unit*qty;
  snapshot:=snapshot||jsonb_build_array(jsonb_build_object('productId',p.id,'name',p.name,'sku',p.sku,'quantity',qty,'unitPrice',unit,'reservedStock',p.manage_stock IS NOT FALSE));
 END LOOP;
 shipping:=CASE WHEN subtotal>=100 THEN 0 ELSE 9.99 END;
 INSERT INTO public.orders(id,user_id,order_number,status,payment_status,customer_email,customer_phone,
 billing_first_name,billing_last_name,billing_company,billing_address,billing_city,billing_postal_code,billing_country,
 shipping_first_name,shipping_last_name,shipping_company,shipping_address,shipping_city,shipping_postal_code,shipping_country,
 subtotal,tax_amount,shipping_amount,total_amount,currency)
 VALUES(order_id_new,profile.id,'PS-'||to_char(now(),'YYYYMMDD')||'-'||upper(substr(order_id_new::text,1,8)),'pending','pending',email,coalesce(address->>'phone',''),
 address->>'firstName',address->>'lastName',coalesce(address->>'company',''),address->>'address',address->>'city',address->>'postalCode',address->>'country',
 address->>'firstName',address->>'lastName',coalesce(address->>'company',''),address->>'address',address->>'city',address->>'postalCode',address->>'country',subtotal,0,shipping,subtotal+shipping,'EUR');
 INSERT INTO public.order_items(order_id,product_id,product_name,product_sku,quantity,unit_price,price,total_price)
 SELECT order_id_new,(v->>'productId')::uuid,v->>'name',v->>'sku',(v->>'quantity')::integer,(v->>'unitPrice')::numeric,(v->>'unitPrice')::numeric,(v->>'unitPrice')::numeric*(v->>'quantity')::integer FROM jsonb_array_elements(snapshot) v;
 INSERT INTO public.pipesan_checkout_sessions(request_key,auth_id,order_id,items) VALUES(request_id,account_id,order_id_new,snapshot) RETURNING id INTO checkout_id;
 RETURN jsonb_build_object('checkout',(select to_jsonb(c) from public.pipesan_checkout_sessions c where c.id=checkout_id),'order',(select to_jsonb(o) from public.orders o where o.id=order_id_new));
END $$;
REVOKE ALL ON FUNCTION public.pipesan_reserve_checkout(uuid,uuid,jsonb,jsonb) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.pipesan_reserve_checkout(uuid,uuid,jsonb,jsonb) TO service_role;

CREATE FUNCTION public.pipesan_finish_checkout(session_id text, paid boolean, total_cents bigint DEFAULT NULL, tax_cents bigint DEFAULT NULL, intent_id text DEFAULT NULL)
RETURNS text LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
DECLARE c public.pipesan_checkout_sessions; o public.orders; item jsonb;
BEGIN
 SELECT * INTO c FROM public.pipesan_checkout_sessions WHERE stripe_session_id=session_id FOR UPDATE;
 IF c.id IS NULL THEN RAISE EXCEPTION 'Unknown checkout session'; END IF;
 IF c.state='paid' THEN RETURN 'paid'; END IF;
 IF c.state='released' THEN IF paid THEN RAISE EXCEPTION 'Payment received for released reservation'; END IF; RETURN 'released'; END IF;
 SELECT * INTO o FROM public.orders WHERE id=c.order_id FOR UPDATE;
 IF paid THEN
  IF total_cents IS NULL OR tax_cents IS NULL OR tax_cents<0 OR total_cents<>round((o.subtotal+o.shipping_amount)*100)::bigint+tax_cents THEN RAISE EXCEPTION 'Payment amount mismatch'; END IF;
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
REVOKE ALL ON FUNCTION public.pipesan_finish_checkout(text,boolean,bigint,bigint,text) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.pipesan_finish_checkout(text,boolean,bigint,bigint,text) TO service_role;
COMMIT;
