// Etichete tehnice scoase din denumire (DN15, 1/2", PN16, BSP...)
const SPEC_RE = /\b(?:DN\s?\d{1,3}|PN\s?\d{1,3}|BSP[PT]?|NPT|M\d{1,2}x\d(?:[.,]\d)?|\d+(?:[.,]\d+)?\s?mm)\b|\b\d(?:\s\d)?\/\d{1,2}\s?(?:"|″|”|''|pouces?|zoll|inch)?/gi;
export function extractSpecs(name = "", max = 3) {
  const seen = new Set();
  const out = [];
  for (const m of String(name).matchAll(SPEC_RE)) {
    const v = m[0].replace(/\s+/g, " ").replace(/(''|″|”)$/, '"').trim();
    const key = v.toUpperCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(v);
    if (out.length >= max) break;
  }
  return out;
}
