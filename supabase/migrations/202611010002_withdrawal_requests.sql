-- Online withdrawal function (Directive (EU) 2023/2673, art. 11a CRD; Code de la consommation L221-21):
-- a consumer withdraws from a purchase on the site and receives an acknowledgement on a durable medium.
-- Customer emails now use PipeSan's own reply address.
BEGIN;
CREATE TABLE public.pipesan_withdrawal_requests (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 full_name text NOT NULL,
 email text NOT NULL,
 order_ref text NOT NULL,
 order_id uuid REFERENCES public.orders(id) ON DELETE SET NULL,
 items text,
 note text,
 language text,
 status text NOT NULL DEFAULT 'received' CHECK(status IN ('received','return_pending','refunded','rejected')),
 admin_note text,
 created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX pipesan_withdrawal_requests_created_idx ON public.pipesan_withdrawal_requests(created_at);
CREATE INDEX pipesan_withdrawal_requests_email_idx ON public.pipesan_withdrawal_requests(lower(email),created_at);
ALTER TABLE public.pipesan_withdrawal_requests ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.pipesan_withdrawal_requests FROM anon,authenticated;
GRANT SELECT,UPDATE ON public.pipesan_withdrawal_requests TO authenticated;
GRANT ALL ON public.pipesan_withdrawal_requests TO service_role;
CREATE POLICY pipesan_withdrawal_admin_read ON public.pipesan_withdrawal_requests FOR SELECT TO authenticated USING(public.check_admin_role());
CREATE POLICY pipesan_withdrawal_admin_update ON public.pipesan_withdrawal_requests FOR UPDATE TO authenticated USING(public.check_admin_role()) WITH CHECK(public.check_admin_role());

-- Never blocks on the order number: guests and typos still get a recorded, acknowledged withdrawal.
CREATE FUNCTION public.pipesan_submit_withdrawal(p_name text, p_email text, p_order_ref text, p_items text, p_note text, p_language text)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
DECLARE
 nm text := left(btrim(coalesce(p_name,'')),200);
 em text := lower(left(btrim(coalesce(p_email,'')),254));
 ref text := upper(left(btrim(coalesce(p_order_ref,'')),60));
 it text := nullif(left(btrim(coalesce(p_items,'')),2000),'');
 nt text := nullif(left(btrim(coalesce(p_note,'')),2000),'');
 lang text := CASE WHEN p_language IN ('fr','en','it','de','es','ro') THEN p_language ELSE 'fr' END;
 oid uuid; uid uuid; req public.pipesan_withdrawal_requests; stamp text; body text;
BEGIN
 IF nm='' OR ref='' OR em !~ '^[^@\s]+@[^@\s]+\.[^@\s]+$' THEN RAISE EXCEPTION 'invalid_withdrawal' USING ERRCODE='22023'; END IF;
 IF (SELECT count(*) FROM public.pipesan_withdrawal_requests WHERE lower(email)=em AND created_at>now()-interval '1 hour')>=5
  OR (SELECT count(*) FROM public.pipesan_withdrawal_requests WHERE created_at>now()-interval '1 hour')>=100 THEN
  RAISE EXCEPTION 'too_many_requests' USING ERRCODE='54000';
 END IF;
 SELECT o.id,o.user_id INTO oid,uid FROM public.orders o
  LEFT JOIN public.users u ON u.id=o.user_id LEFT JOIN auth.users au ON au.id=u.auth_id
  WHERE upper(o.order_number)=ref AND em IN (lower(coalesce(o.customer_email,'')),lower(coalesce(au.email,''))) LIMIT 1;
 INSERT INTO public.pipesan_withdrawal_requests(full_name,email,order_ref,order_id,items,note,language)
 VALUES(nm,em,ref,oid,it,nt,lang) RETURNING * INTO req;
 stamp := to_char(req.created_at AT TIME ZONE 'Europe/Paris','YYYY-MM-DD HH24:MI') || ' (Europe/Paris)';
 body := 'We have received your withdrawal from the contract.'||chr(10)||chr(10)||
  'Reference: '||req.id||chr(10)||'Received: '||stamp||chr(10)||'Name: '||nm||chr(10)||'Email: '||em||chr(10)||
  'Order: '||ref||chr(10)||'Products: '||coalesce(it,'all products of the order')||chr(10)||chr(10)||
  'Next step: send the products back within 14 days. We will reply with the return address. '||
  'We refund the price and standard delivery within 14 days of your withdrawal; we may wait until we receive the products or proof of shipment.'||chr(10)||chr(10)||
  'FISH VALLEY S.R.L. (PipeSan) - contact@pipesan.eu';
 INSERT INTO public.email_logs(user_id,order_id,email_type,recipient_email,subject,message,status,reply_to,event_key)
 VALUES(uid,oid,'withdrawal_ack',em,'PipeSan - Withdrawal received ('||ref||')',body,'queued','contact@pipesan.eu','withdrawal:'||req.id||':customer');
 INSERT INTO public.email_logs(order_id,email_type,recipient_email,subject,message,status,reply_to,event_key)
 VALUES(oid,'withdrawal_notification','contact@pipesan.eu','PipeSan - New withdrawal ('||ref||')',body,'queued',em,'withdrawal:'||req.id||':internal');
 RETURN jsonb_build_object('id',req.id,'created_at',req.created_at,'order_matched',oid IS NOT NULL);
END $$;
REVOKE ALL ON FUNCTION public.pipesan_submit_withdrawal(text,text,text,text,text,text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.pipesan_submit_withdrawal(text,text,text,text,text,text) TO anon,authenticated;

CREATE OR REPLACE FUNCTION public.send_order_confirmation_email()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
DECLARE customer text; subject_line text; body_text text;
BEGIN
 SELECT au.email INTO customer FROM auth.users au JOIN public.users u ON u.auth_id=au.id WHERE u.id=NEW.user_id;
 customer := coalesce(nullif(customer,''),nullif(NEW.customer_email,''));
 subject_line := 'PipeSan — Order received: ' || coalesce(NEW.order_number,NEW.id::text);
 body_text := 'We have received order ' || coalesce(NEW.order_number,NEW.id::text) || '. This notification does not confirm payment. For assistance, reply to this email.'
  || chr(10) || chr(10) || 'You may withdraw within 14 days of delivery: https://www.pipesan.eu/withdrawal';
 IF customer IS NOT NULL THEN
  INSERT INTO public.email_logs(user_id,order_id,email_type,recipient_email,subject,message,status,sent_at,reply_to,event_key)
  VALUES(NEW.user_id,NEW.id,'order_confirmation',customer,subject_line,body_text,'queued',NULL,'contact@pipesan.eu','order:'||NEW.id||':customer') ON CONFLICT DO NOTHING;
 END IF;
 INSERT INTO public.email_logs(order_id,email_type,recipient_email,subject,message,status,sent_at,reply_to,event_key)
 SELECT NEW.id,'order_notification',recipient,subject_line,
  'A new PipeSan order has been received. Order: '||coalesce(NEW.order_number,NEW.id::text)||'. Customer email: '||coalesce(customer,'not provided')||'. Review the order and payment status in the administration panel.',
  'queued',NULL,'contact@pipesan.eu','order:'||NEW.id||':internal:'||recipient
 FROM unnest(ARRAY['contact@pipesan.eu','contact@prep-center.eu']) recipient ON CONFLICT DO NOTHING;
 RETURN NEW;
END $$;

CREATE OR REPLACE FUNCTION public.notify_order_status_change()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
DECLARE customer text;
BEGIN
 IF NEW.status IS NOT DISTINCT FROM OLD.status THEN RETURN NEW; END IF;
 INSERT INTO public.order_status_history(order_id,old_status,new_status,note) VALUES(NEW.id,OLD.status,NEW.status,NEW.admin_comment);
 SELECT au.email INTO customer FROM auth.users au JOIN public.users u ON u.auth_id=au.id WHERE u.id=NEW.user_id;
 customer:=coalesce(nullif(customer,''),nullif(NEW.customer_email,''));
 IF customer IS NOT NULL THEN
 INSERT INTO public.email_logs(user_id,order_id,email_type,recipient_email,subject,message,status,sent_at,reply_to,event_key)
 VALUES(NEW.user_id,NEW.id,'order_status_update',customer,'PipeSan — Order '||coalesce(NEW.order_number,NEW.id::text),
 'Your order status is now: '||NEW.status||'. For assistance, reply to this email.',
 'queued',NULL,'contact@pipesan.eu','status:'||NEW.id||':'||txid_current()||':'||NEW.status) ON CONFLICT DO NOTHING;
 END IF;
 RETURN NEW;
END $$;
UPDATE public.email_logs SET reply_to='contact@pipesan.eu' WHERE reply_to='contact@prep-center.eu' AND status IN ('queued','processing');
COMMIT;
