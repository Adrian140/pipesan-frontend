-- Future order events are queued; a separate server worker performs actual delivery.
-- No historical email is resent by this migration.
BEGIN;
ALTER TABLE public.email_logs ADD COLUMN IF NOT EXISTS reply_to text;
ALTER TABLE public.email_logs ADD COLUMN IF NOT EXISTS event_key text;
ALTER TABLE public.email_logs ADD COLUMN IF NOT EXISTS provider_id text;
ALTER TABLE public.email_logs ADD COLUMN IF NOT EXISTS attempts integer NOT NULL DEFAULT 0;
ALTER TABLE public.email_logs ADD COLUMN IF NOT EXISTS first_attempt_at timestamptz;
ALTER TABLE public.email_logs ADD COLUMN IF NOT EXISTS locked_at timestamptz;
ALTER TABLE public.email_logs ALTER COLUMN status SET DEFAULT 'queued';
ALTER TABLE public.email_logs ALTER COLUMN sent_at DROP DEFAULT;
CREATE UNIQUE INDEX IF NOT EXISTS pipesan_email_event_key ON public.email_logs(event_key) WHERE event_key IS NOT NULL;
CREATE POLICY pipesan_email_insert_guard ON public.email_logs AS RESTRICTIVE FOR INSERT TO anon,authenticated WITH CHECK(public.check_admin_role());
CREATE POLICY pipesan_email_update_guard ON public.email_logs AS RESTRICTIVE FOR UPDATE TO anon,authenticated USING(public.check_admin_role()) WITH CHECK(public.check_admin_role());
CREATE POLICY pipesan_email_delete_guard ON public.email_logs AS RESTRICTIVE FOR DELETE TO anon,authenticated USING(public.check_admin_role());

CREATE OR REPLACE FUNCTION public.send_order_confirmation_email()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
DECLARE customer text; subject_line text; body_text text;
BEGIN
 SELECT au.email INTO customer FROM auth.users au JOIN public.users u ON u.auth_id=au.id WHERE u.id=NEW.user_id;
 customer := coalesce(nullif(customer,''),nullif(NEW.customer_email,''));
 subject_line := 'PipeSan — Order received: ' || coalesce(NEW.order_number,NEW.id::text);
 body_text := 'We have received order ' || coalesce(NEW.order_number,NEW.id::text) || '. This notification does not confirm payment. For assistance, reply to this email.';
 IF customer IS NOT NULL THEN
  INSERT INTO public.email_logs(user_id,order_id,email_type,recipient_email,subject,message,status,sent_at,reply_to,event_key)
  VALUES(NEW.user_id,NEW.id,'order_confirmation',customer,subject_line,body_text,'queued',NULL,'contact@prep-center.eu','order:'||NEW.id||':customer') ON CONFLICT DO NOTHING;
 END IF;
 INSERT INTO public.email_logs(order_id,email_type,recipient_email,subject,message,status,sent_at,reply_to,event_key)
 SELECT NEW.id,'order_notification',recipient,subject_line,
  'A new PipeSan order has been received. Order: '||coalesce(NEW.order_number,NEW.id::text)||'. Customer email: '||coalesce(customer,'not provided')||'. Review the order and payment status in the administration panel.',
  'queued',NULL,'contact@prep-center.eu','order:'||NEW.id||':internal:'||recipient
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
 'queued',NULL,'contact@prep-center.eu','status:'||NEW.id||':'||txid_current()||':'||NEW.status) ON CONFLICT DO NOTHING;
 END IF;
 RETURN NEW;
END $$;
-- Existing duplicate legacy triggers remain attached but no longer create false sent records.
CREATE OR REPLACE FUNCTION public.send_shipping_notification()
RETURNS trigger LANGUAGE plpgsql SET search_path=public,pg_temp AS $$ BEGIN RETURN NEW; END $$;
CREATE OR REPLACE FUNCTION public.log_shipping_notification()
RETURNS trigger LANGUAGE plpgsql SET search_path=public,pg_temp AS $$ BEGIN RETURN NEW; END $$;
CREATE OR REPLACE FUNCTION public.log_order_confirmation_email()
RETURNS trigger LANGUAGE plpgsql SET search_path=public,pg_temp AS $$ BEGIN RETURN NEW; END $$;

CREATE OR REPLACE FUNCTION public.pipesan_claim_emails(batch_size integer DEFAULT 10)
RETURNS SETOF public.email_logs LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
BEGIN
 -- Avoid automatic resend outside the provider's 24-hour idempotency window.
 UPDATE public.email_logs SET status='manual_review',error_message='Delivery uncertain; reconcile provider records before retrying.'
 WHERE event_key IS NOT NULL AND status IN ('queued','processing') AND first_attempt_at < now()-interval '23 hours';
 RETURN QUERY
 WITH jobs AS (
  SELECT id FROM public.email_logs WHERE event_key IS NOT NULL AND attempts<5 AND
   (status='queued' OR (status='processing' AND locked_at<now()-interval '10 minutes'))
  ORDER BY created_at FOR UPDATE SKIP LOCKED LIMIT least(greatest(batch_size,1),25)
 ) UPDATE public.email_logs e SET status='processing',attempts=e.attempts+1,locked_at=now(),first_attempt_at=coalesce(e.first_attempt_at,now())
 FROM jobs WHERE e.id=jobs.id RETURNING e.*;
END $$;
REVOKE ALL ON FUNCTION public.pipesan_claim_emails(integer) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.pipesan_claim_emails(integer) TO service_role;

CREATE TEMP TABLE pipesan_email_test (LIKE public.orders INCLUDING DEFAULTS) ON COMMIT DROP;
ALTER TABLE pipesan_email_test ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER test_queue AFTER INSERT ON pipesan_email_test FOR EACH ROW EXECUTE FUNCTION public.send_order_confirmation_email();
INSERT INTO pipesan_email_test SELECT * FROM public.orders ORDER BY created_at LIMIT 1;
DO $$ BEGIN
 IF (SELECT count(*) FROM public.email_logs WHERE event_key LIKE 'order:%:internal:%' AND recipient_email IN ('contact@pipesan.eu','contact@prep-center.eu') AND reply_to='contact@prep-center.eu' AND status='queued' AND sent_at IS NULL) <> 2 THEN RAISE EXCEPTION 'Internal recipients / Reply-To test failed'; END IF;
END $$;
SELECT 'Queue recipients, Reply-To, queued status and no false sent timestamp: PASS (rolled back)' as validation;
ROLLBACK;
