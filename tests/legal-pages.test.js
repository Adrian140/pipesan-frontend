import { describe, expect, it } from 'vitest';
import { LEGAL_NOTICE_T } from '../src/legal/legalNotice';
import { SHIPPING_T } from '../src/legal/shipping';
import { RETURNS_T } from '../src/legal/returns';
import { PRIVACY_T } from '../src/legal/privacy';
import { WITHDRAWAL_T } from '../src/legal/withdrawal';

const LANGS = ['fr', 'en', 'it', 'de', 'es', 'ro'];
const PAGES = { LEGAL_NOTICE_T, SHIPPING_T, RETURNS_T, PRIVACY_T };

describe('legal pages', () => {
  for (const [name, T] of Object.entries(PAGES)) {
    it(`${name} has every site language with the same sections`, () => {
      expect(Object.keys(T).sort()).toEqual([...LANGS].sort());
      const count = T.fr.sections.length;
      for (const l of LANGS) {
        expect(T[l].title).toBeTruthy();
        expect(T[l].sections).toHaveLength(count);
      }
    });
  }

  it('never names Prep Center or FBA services', () => {
    const text = JSON.stringify(Object.values(PAGES));
    expect(text).not.toMatch(/prep[ -]?center|FBA/i);
  });

  it('withdrawal function copy exists in every language', () => {
    for (const l of LANGS) {
      expect(WITHDRAWAL_T[l].confirm).toBeTruthy();
      expect(RETURNS_T[l].sections.some((s) => s.box?.some((line) => line.includes('FISH VALLEY')))).toBe(true);
    }
  });
});
