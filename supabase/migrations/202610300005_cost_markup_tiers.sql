-- Selling price tiers by purchase cost: up to €10 ×2, up to €20 ×1.5, above €20 ×1.28.
CREATE OR REPLACE FUNCTION public.pipesan_cost_price(cost numeric)
RETURNS numeric LANGUAGE sql IMMUTABLE AS $$
 SELECT round(cost * CASE WHEN cost > 20 THEN 1.28 WHEN cost > 10 THEN 1.5 ELSE 2 END, 2)
$$;
UPDATE public.product_costs SET cost_price=cost_price;
