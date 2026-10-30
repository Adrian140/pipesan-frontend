-- Prep Center warehouse stock becomes the only source of PipeSan stock.
-- The prepcenter-sync Edge Function reads the Prep Center API and calls
-- pipesan_apply_warehouse_stock(); admins can no longer edit stock by hand.
BEGIN;
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

ALTER TABLE public.products
 ADD COLUMN IF NOT EXISTS warehouse_quantity integer,
 ADD COLUMN IF NOT EXISTS prepcenter_skus text[] NOT NULL DEFAULT '{}';

CREATE TABLE public.pipesan_prepcenter_sync_runs (
 id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
 trigger text NOT NULL DEFAULT 'cron' CHECK(trigger IN ('cron','admin')),
 started_at timestamptz NOT NULL DEFAULT now(),
 finished_at timestamptz,
 status text NOT NULL DEFAULT 'running' CHECK(status IN ('running','success','error')),
 warehouse_rows integer,
 pipesan_rows integer,
 matched integer,
 updated integer,
 created_drafts integer,
 error text
);
ALTER TABLE public.pipesan_prepcenter_sync_runs ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.pipesan_prepcenter_sync_runs FROM anon,authenticated;
GRANT SELECT ON public.pipesan_prepcenter_sync_runs TO authenticated;
GRANT ALL ON public.pipesan_prepcenter_sync_runs TO service_role;
CREATE POLICY pipesan_sync_runs_admin_read ON public.pipesan_prepcenter_sync_runs FOR SELECT TO authenticated USING(public.check_admin_role());

-- Browser clients (admin included) cannot change stock; only trusted server code can.
CREATE FUNCTION public.pipesan_protect_stock()
RETURNS trigger LANGUAGE plpgsql SET search_path=public,pg_temp AS $$
BEGIN
 IF coalesce(auth.role(),'') IN ('anon','authenticated') THEN
  IF TG_OP='INSERT' THEN
   NEW.stock_quantity:=0; NEW.warehouse_quantity:=NULL; NEW.prepcenter_skus:='{}';
   NEW.manage_stock:=true; NEW.in_stock:=false; NEW.stock_status:='out_of_stock';
  ELSE
   NEW.stock_quantity:=OLD.stock_quantity; NEW.warehouse_quantity:=OLD.warehouse_quantity; NEW.prepcenter_skus:=OLD.prepcenter_skus;
   NEW.manage_stock:=OLD.manage_stock; NEW.in_stock:=OLD.in_stock; NEW.stock_status:=OLD.stock_status;
  END IF;
 END IF;
 RETURN NEW;
END $$;
CREATE TRIGGER pipesan_protect_stock BEFORE INSERT OR UPDATE ON public.products FOR EACH ROW EXECUTE FUNCTION public.pipesan_protect_stock();

-- inventory: [{asin, sku, name, quantity}] already filtered to PipeSan rows by the Edge Function.
-- Units held by open or recently paid web checkouts are subtracted until the warehouse ships them.
CREATE FUNCTION public.pipesan_apply_warehouse_stock(run_id bigint, inventory jsonb)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
DECLARE n_matched integer; n_updated integer; n_drafts integer;
BEGIN
 IF jsonb_typeof(inventory)<>'array' THEN RAISE EXCEPTION 'inventory must be an array'; END IF;
 CREATE TEMP TABLE wh ON COMMIT DROP AS
  SELECT upper(trim(x->>'asin')) AS asin, sum(greatest(coalesce((x->>'quantity')::integer,0),0))::integer AS qty,
         coalesce(array_agg(DISTINCT x->>'sku') FILTER (WHERE coalesce(x->>'sku','')<>''),'{}') AS skus,
         min(x->>'name') AS name
  FROM jsonb_array_elements(inventory) x WHERE upper(trim(coalesce(x->>'asin',''))) ~ '^[A-Z0-9]{10}$'
  GROUP BY 1;
 CREATE TEMP TABLE held ON COMMIT DROP AS
  SELECT (i->>'productId')::uuid AS product_id, sum((i->>'quantity')::integer)::integer AS qty
  FROM public.pipesan_checkout_sessions s, jsonb_array_elements(s.items) i
  WHERE s.state='reserved' OR (s.state='paid' AND s.created_at>now()-interval '72 hours')
  GROUP BY 1;

 SELECT count(*) INTO n_matched FROM public.products p JOIN wh ON wh.asin=upper(p.sku);

 WITH target AS (
  SELECT p.id, coalesce(wh.qty,0) AS wqty, coalesce(wh.skus,'{}') AS skus,
         greatest(coalesce(wh.qty,0)-coalesce(held.qty,0),0) AS sellable
  FROM public.products p LEFT JOIN wh ON wh.asin=upper(p.sku) LEFT JOIN held ON held.product_id=p.id
 ), changed AS (
  UPDATE public.products p SET warehouse_quantity=t.wqty, prepcenter_skus=t.skus, stock_quantity=t.sellable,
   manage_stock=true, in_stock=t.sellable>0, stock_status=CASE WHEN t.sellable>0 THEN 'in_stock' ELSE 'out_of_stock' END
  FROM target t WHERE p.id=t.id AND (p.warehouse_quantity IS DISTINCT FROM t.wqty OR p.stock_quantity IS DISTINCT FROM t.sellable
   OR p.prepcenter_skus IS DISTINCT FROM t.skus OR p.manage_stock IS DISTINCT FROM true OR p.in_stock IS DISTINCT FROM (t.sellable>0))
  RETURNING 1
 ) SELECT count(*) INTO n_updated FROM changed;

 -- New PipeSan items in the warehouse appear in admin as drafts to complete (price, photos, texts).
 WITH ins AS (
  INSERT INTO public.products(name,slug,sku,price,currency,is_active,is_draft,created_by_admin,manage_stock,stock_quantity,warehouse_quantity,prepcenter_skus,in_stock,stock_status,amazon_links)
  SELECT left(coalesce(nullif(wh.name,''),wh.asin),250), 'draft-'||lower(wh.asin), wh.asin, 0, 'EUR', false, true, true, true, wh.qty, wh.qty, wh.skus,
         wh.qty>0, CASE WHEN wh.qty>0 THEN 'in_stock' ELSE 'out_of_stock' END, '{}'::jsonb
  FROM wh WHERE NOT EXISTS (SELECT 1 FROM public.products p WHERE upper(p.sku)=wh.asin OR p.amazon_links::text ILIKE '%'||wh.asin||'%')
  ON CONFLICT DO NOTHING RETURNING 1
 ) SELECT count(*) INTO n_drafts FROM ins;

 UPDATE public.pipesan_prepcenter_sync_runs SET matched=n_matched, updated=n_updated, created_drafts=n_drafts WHERE id=run_id;
 RETURN jsonb_build_object('matched',n_matched,'updated',n_updated,'created_drafts',n_drafts);
END $$;
REVOKE ALL ON FUNCTION public.pipesan_apply_warehouse_stock(bigint,jsonb) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.pipesan_apply_warehouse_stock(bigint,jsonb) TO service_role;
COMMIT;

-- Schedule (run once after deploying the function; the secret lives only in Vault):
--   select vault.create_secret('<random>', 'pipesan_prepcenter_cron_secret');
--   select cron.schedule('pipesan-prepcenter-sync', '*/15 * * * *', $$
--     select net.http_post(
--       url := 'https://baazcwosfkaageltesbc.supabase.co/functions/v1/prepcenter-sync',
--       headers := jsonb_build_object('Content-Type','application/json','x-cron-secret',
--         (select decrypted_secret from vault.decrypted_secrets where name='pipesan_prepcenter_cron_secret')),
--       body := '{}'::jsonb, timeout_milliseconds := 60000);
--   $$);
