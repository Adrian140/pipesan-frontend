import { it,expect } from 'vitest';
import { priceFromCost } from '../src/domain/pricing';
it('prices by purchase cost tiers',()=>{expect(priceFromCost(4.73)).toBe(9.46);expect(priceFromCost(10)).toBe(20);expect(priceFromCost(15)).toBe(22.5);expect(priceFromCost(25)).toBe(32);expect(priceFromCost('')).toBeNull();expect(priceFromCost(0)).toBeNull();});
