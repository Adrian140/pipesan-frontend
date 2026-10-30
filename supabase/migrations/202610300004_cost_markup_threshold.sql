-- 200% markup up to €10 purchase cost, 100% above it.
CREATE OR REPLACE FUNCTION public.pipesan_cost_price(cost numeric)
RETURNS numeric LANGUAGE sql IMMUTABLE AS $$ SELECT round(cost * CASE WHEN cost > 10 THEN 2 ELSE 3 END, 2) $$;
UPDATE public.product_costs SET cost_price=cost_price;
