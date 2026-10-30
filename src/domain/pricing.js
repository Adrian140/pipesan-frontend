// Mirrors public.pipesan_cost_price: 200% markup up to €10 purchase cost, 100% above it.
export const priceFromCost = (cost) => {
  const value = Number(cost);
  if (!Number.isFinite(value) || value <= 0) return null;
  return Math.round(value * (value > 10 ? 2 : 3) * 100) / 100;
};
