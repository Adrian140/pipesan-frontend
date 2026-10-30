// Mirrors public.pipesan_cost_price: up to €10 cost ×2, up to €20 ×1.5, above €20 ×1.28.
export const priceFromCost = (cost) => {
  const value = Number(cost);
  if (!Number.isFinite(value) || value <= 0) return null;
  const factor = value > 20 ? 1.28 : value > 10 ? 1.5 : 2;
  return Math.round(value * factor * 100) / 100;
};
