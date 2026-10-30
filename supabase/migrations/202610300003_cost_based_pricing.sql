-- Purchase cost per product (admin only) and selling price = cost + 200% markup.
CREATE TABLE IF NOT EXISTS public.product_costs (
  product_id uuid PRIMARY KEY REFERENCES public.products(id) ON DELETE CASCADE,
  cost_price numeric(10,2) NOT NULL CHECK (cost_price > 0),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.product_costs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS product_costs_admin ON public.product_costs;
CREATE POLICY product_costs_admin ON public.product_costs FOR ALL USING (public.check_admin_role()) WITH CHECK (public.check_admin_role());
REVOKE ALL ON public.product_costs FROM anon;

CREATE OR REPLACE FUNCTION public.pipesan_cost_price(cost numeric)
RETURNS numeric LANGUAGE sql IMMUTABLE AS $$ SELECT round(cost * 3, 2) $$;

-- Any product write keeps the price derived from its purchase cost, including stock syncs.
CREATE OR REPLACE FUNCTION public.pipesan_price_from_cost()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
DECLARE cost numeric;
BEGIN
 SELECT c.cost_price INTO cost FROM public.product_costs c WHERE c.product_id=NEW.id;
 IF cost IS NOT NULL THEN
  NEW.price:=public.pipesan_cost_price(cost);
  NEW.sale_price:=NULL;
 END IF;
 RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS pipesan_price_from_cost ON public.products;
CREATE TRIGGER pipesan_price_from_cost BEFORE INSERT OR UPDATE ON public.products FOR EACH ROW EXECUTE FUNCTION public.pipesan_price_from_cost();

CREATE OR REPLACE FUNCTION public.pipesan_apply_product_cost()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
BEGIN
 NEW.updated_at:=now();
 UPDATE public.products SET price=public.pipesan_cost_price(NEW.cost_price), sale_price=NULL WHERE id=NEW.product_id;
 RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS pipesan_apply_product_cost ON public.product_costs;
CREATE TRIGGER pipesan_apply_product_cost BEFORE INSERT OR UPDATE ON public.product_costs FOR EACH ROW EXECUTE FUNCTION public.pipesan_apply_product_cost();
