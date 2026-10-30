import { it,expect } from 'vitest';
import { priceFromCost } from '../src/domain/pricing';
it('applies 200% markup up to €10 cost and 100% above',()=>{expect(priceFromCost(4.73)).toBe(14.19);expect(priceFromCost(10)).toBe(30);expect(priceFromCost(12)).toBe(24);expect(priceFromCost('')).toBeNull();expect(priceFromCost(0)).toBeNull();});
