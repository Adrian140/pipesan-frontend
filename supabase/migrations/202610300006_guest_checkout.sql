-- Guest checkout: an order can be placed with an email address instead of an account.
ALTER TABLE public.pipesan_checkout_sessions ALTER COLUMN auth_id DROP NOT NULL;
ALTER TABLE public.pipesan_checkout_sessions ADD COLUMN IF NOT EXISTS guest_email text;
ALTER TABLE public.pipesan_checkout_sessions DROP CONSTRAINT IF EXISTS pipesan_checkout_sessions_owner;
ALTER TABLE public.pipesan_checkout_sessions ADD CONSTRAINT pipesan_checkout_sessions_owner CHECK ((auth_id IS NULL) <> (guest_email IS NULL));
CREATE UNIQUE INDEX IF NOT EXISTS pipesan_checkout_sessions_guest_request ON public.pipesan_checkout_sessions(guest_email, request_key) WHERE auth_id IS NULL;

DROP FUNCTION IF EXISTS public.pipesan_reserve_checkout(uuid,uuid,jsonb,jsonb);
CREATE FUNCTION public.pipesan_reserve_checkout(account_id uuid, request_id uuid, cart jsonb, address jsonb, guest_email text DEFAULT NULL)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
DECLARE existing public.pipesan_checkout_sessions; profile public.users; email text;
 p public.products; item record; qty integer; unit numeric; subtotal numeric:=0; shipping numeric; parcel_grams numeric:=0;
 snapshot jsonb:='[]'; order_id_new uuid:=gen_random_uuid(); checkout_id uuid; field text;
BEGIN
 -- Serialize retries for this account/request pair before checking for an existing reservation.
 IF account_id IS NULL THEN
  email:=lower(trim(coalesce(guest_email,'')));
  IF length(email)>254 OR email!~'^[^@\s]+@[^@\s]+\.[a-z]{2,}$' THEN RAISE EXCEPTION 'Enter a valid email address'; END IF;
 END IF;
 PERFORM pg_advisory_xact_lock(hashtextextended(coalesce(account_id::text,email),0));
 SELECT * INTO existing FROM public.pipesan_checkout_sessions s WHERE s.request_key=request_id
  AND (s.auth_id=account_id OR (account_id IS NULL AND s.auth_id IS NULL AND s.guest_email=email));
 IF FOUND THEN RETURN jsonb_build_object('checkout',to_jsonb(existing),'order',(select to_jsonb(o) from public.orders o where o.id=existing.order_id)); END IF;
 IF (SELECT count(*) FROM public.pipesan_checkout_sessions s WHERE s.state='reserved' AND (s.auth_id=account_id OR (account_id IS NULL AND s.guest_email=email)))>=3 THEN RAISE EXCEPTION 'You already have pending checkouts. Complete an existing payment or contact support.'; END IF;
 IF account_id IS NOT NULL THEN
  SELECT * INTO profile FROM public.users WHERE auth_id=account_id;
  IF profile.id IS NULL THEN RAISE EXCEPTION 'Account profile unavailable'; END IF;
  SELECT a.email INTO email FROM auth.users a WHERE a.id=account_id AND a.email_confirmed_at IS NOT NULL;
  IF email IS NULL THEN RAISE EXCEPTION 'Confirm your email before placing an order'; END IF;
 END IF;
 IF jsonb_typeof(cart) IS DISTINCT FROM 'array' OR jsonb_array_length(cart) NOT BETWEEN 1 AND 50 THEN RAISE EXCEPTION 'Invalid cart'; END IF;
 FOREACH field IN ARRAY ARRAY['firstName','lastName','address','city','postalCode','country'] LOOP
  IF length(trim(coalesce(address->>field,''))) NOT BETWEEN 1 AND 250 THEN RAISE EXCEPTION 'Complete the billing and shipping address'; END IF;
 END LOOP;
 IF address->>'country'='OTHER' OR NOT EXISTS(SELECT 1 FROM public.shipping_rates WHERE country_code=address->>'country' AND is_active) THEN RAISE EXCEPTION 'Delivery country is not supported'; END IF;
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
  parcel_grams:=parcel_grams+coalesce(nullif(p.weight_grams,0),500)*qty;
  snapshot:=snapshot||jsonb_build_array(jsonb_build_object('productId',p.id,'name',p.name,'sku',p.sku,'quantity',qty,'unitPrice',unit,'reservedStock',p.manage_stock IS NOT FALSE));
 END LOOP;
 -- Chronopost rate for the parcel weight; a band's max weight is inclusive.
 SELECT r.shipping_cost INTO shipping FROM public.shipping_rates r
  WHERE r.country_code=address->>'country' AND r.is_active AND r.weight_min_grams<=parcel_grams AND (r.weight_max_grams IS NULL OR r.weight_max_grams>=parcel_grams)
  ORDER BY r.weight_min_grams LIMIT 1;
 IF shipping IS NULL THEN RAISE EXCEPTION 'This order is too heavy for online delivery. Contact us for a shipping quote.'; END IF;
 INSERT INTO public.orders(id,user_id,order_number,status,payment_status,customer_email,customer_phone,
 billing_first_name,billing_last_name,billing_company,billing_address,billing_city,billing_postal_code,billing_country,
 shipping_first_name,shipping_last_name,shipping_company,shipping_address,shipping_city,shipping_postal_code,shipping_country,
 subtotal,tax_amount,shipping_amount,total_amount,currency)
 VALUES(order_id_new,profile.id,'PS-'||to_char(now(),'YYYYMMDD')||'-'||upper(substr(order_id_new::text,1,8)),'pending','pending',email,coalesce(address->>'phone',''),
 address->>'firstName',address->>'lastName',coalesce(address->>'company',''),address->>'address',address->>'city',address->>'postalCode',address->>'country',
 address->>'firstName',address->>'lastName',coalesce(address->>'company',''),address->>'address',address->>'city',address->>'postalCode',address->>'country',subtotal,0,shipping,subtotal+shipping,'EUR');
 INSERT INTO public.order_items(order_id,product_id,product_name,product_sku,quantity,unit_price,price,total_price)
 SELECT order_id_new,(v->>'productId')::uuid,v->>'name',v->>'sku',(v->>'quantity')::integer,(v->>'unitPrice')::numeric,(v->>'unitPrice')::numeric,(v->>'unitPrice')::numeric*(v->>'quantity')::integer FROM jsonb_array_elements(snapshot) v;
 INSERT INTO public.pipesan_checkout_sessions(request_key,auth_id,guest_email,order_id,items) VALUES(request_id,account_id,CASE WHEN account_id IS NULL THEN email END,order_id_new,snapshot) RETURNING id INTO checkout_id;
 RETURN jsonb_build_object('checkout',(select to_jsonb(c) from public.pipesan_checkout_sessions c where c.id=checkout_id),'order',(select to_jsonb(o) from public.orders o where o.id=order_id_new));
END $$;
REVOKE ALL ON FUNCTION public.pipesan_reserve_checkout(uuid,uuid,jsonb,jsonb,text) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.pipesan_reserve_checkout(uuid,uuid,jsonb,jsonb,text) TO service_role;

-- After payment, a guest who asked for an account gets the order and its address on that account.
CREATE OR REPLACE FUNCTION public.pipesan_link_guest_order(target uuid)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
DECLARE o public.orders; profile public.users;
BEGIN
 SELECT * INTO o FROM public.orders WHERE id=target;
 IF o.id IS NULL OR o.user_id IS NOT NULL THEN RETURN o.user_id; END IF;
 SELECT u.* INTO profile FROM public.users u JOIN auth.users a ON a.id=u.auth_id WHERE lower(a.email)=lower(o.customer_email);
 IF profile.id IS NULL THEN RETURN NULL; END IF;
 UPDATE public.orders SET user_id=profile.id WHERE id=o.id;
 IF NOT EXISTS(SELECT 1 FROM public.addresses a WHERE a.user_id=profile.id AND a.address=o.shipping_address AND a.postal_code=o.shipping_postal_code AND a.country=o.shipping_country) THEN
  INSERT INTO public.addresses(user_id,type,first_name,last_name,company,address,city,postal_code,country,phone,is_default)
  VALUES(profile.id,'both',o.shipping_first_name,o.shipping_last_name,coalesce(o.shipping_company,''),o.shipping_address,o.shipping_city,o.shipping_postal_code,o.shipping_country,coalesce(o.customer_phone,''),
   NOT EXISTS(SELECT 1 FROM public.addresses a WHERE a.user_id=profile.id));
 END IF;
 RETURN profile.id;
END $$;
REVOKE ALL ON FUNCTION public.pipesan_link_guest_order(uuid) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.pipesan_link_guest_order(uuid) TO service_role;
