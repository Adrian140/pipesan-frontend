import React, { useEffect, useState } from 'react';
import { apiClient } from '../../config/api';
import { SHIPPING_COUNTRIES } from '../../data/chronopostRates';
import { estimateVat } from '../../data/vatRates';
import { countryName } from '../../translations/checkout';

const euro = (value) => `€${value.toFixed(2)}`;

// Shipping from the same shipping_rates the server charges; VAT is an estimate for a private customer.
export default function OrderEstimate({ items, country, onCountryChange, t, language }) {
  const [quote, setQuote] = useState(null);
  const cartKey = items.map((i) => `${i.productId}:${i.quantity}`).join(',');
  useEffect(() => {
    if (!items.length) return undefined;
    let current = true;
    setQuote(null);
    apiClient.shippingRates.quoteCheckout(items, country)
      .then((q) => { if (current) setQuote(q); })
      .catch(() => { if (current) setQuote({ failed: true }); });
    return () => { current = false; };
  }, [cartKey, country]);

  const subtotal = items.reduce((sum, i) => sum + Number(i.price) * i.quantity, 0);
  const shipping = quote && !quote.failed ? quote.shippingCost : null;
  const vat = estimateVat(country, subtotal + (shipping || 0));
  const countries = SHIPPING_COUNTRIES
    .map((c) => ({ code: c.code, name: countryName(c.code, language) }))
    .sort((a, b) => a.name.localeCompare(b.name, language));

  return (
    <div className="space-y-2 text-sm">
      <label className="flex items-center justify-between gap-3">
        <span>{t.deliverTo}</span>
        <select
          value={country}
          onChange={(e) => onCountryChange(e.target.value)}
          className="border border-gray-300 rounded px-2 py-1 text-sm"
        >
          {countries.map((c) => <option key={c.code} value={c.code}>{c.name}</option>)}
        </select>
      </label>
      <div className="flex justify-between"><span>{t.subtotal}</span><span>{euro(subtotal)}</span></div>
      <div className="flex justify-between">
        <span>{t.shipping}{quote?.weightGrams ? ` (${(quote.weightGrams / 1000).toFixed(2).replace('.', ',')} kg)` : ''}</span>
        <span data-testid="estimate-shipping">
          {!quote ? t.calculating : quote.failed ? t.quoteUnavailable : shipping == null ? t.tooHeavy : euro(shipping)}
        </span>
      </div>
      <div className="flex justify-between">
        <span>{vat.rate ? t.vat(String(vat.rate).replace('.', ',')) : t.vatNone}</span>
        <span data-testid="estimate-vat">{vat.rate ? euro(vat.amount) : t.vatOutsideEu}</span>
      </div>
      <div className="border-t pt-2 flex justify-between font-semibold">
        <span>{t.total}</span>
        <span data-testid="estimate-total">{shipping == null ? '—' : euro(subtotal + shipping + vat.amount)}</span>
      </div>
      <p className="text-xs text-gray-500">{t.estimateNote}</p>
    </div>
  );
}
