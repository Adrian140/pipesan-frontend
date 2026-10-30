import { useState } from 'react';
import { SHIPPING_COUNTRIES } from '../data/chronopostRates';

const KEY = 'pipesan-ship-country';
const isServed = (code) => SHIPPING_COUNTRIES.some((c) => c.code === code);

// Destination chosen in the cart, reused by checkout; private-browsing failures fall back to France.
export function useShippingCountry() {
  const [country, setCountryState] = useState(() => {
    try { const saved = localStorage.getItem(KEY); return isServed(saved) ? saved : 'FR'; } catch { return 'FR'; }
  });
  const setCountry = (code) => {
    if (!isServed(code)) return;
    setCountryState(code);
    try { localStorage.setItem(KEY, code); } catch { /* Kept for this page only. */ }
  };
  return [country, setCountry];
}
