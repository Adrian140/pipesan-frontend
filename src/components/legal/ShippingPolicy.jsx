import React from 'react';
import { Truck } from 'lucide-react';
import LegalPage, { useLegalText } from './LegalPage';
import { SHIPPING_T } from '../../legal/shipping';
import { SHIPPING_COUNTRIES } from '../../data/chronopostRates';
import { countryName } from '../../translations/checkout';

function ShippingTable() {
  const { lang, t } = useLegalText(SHIPPING_T);
  const rows = SHIPPING_COUNTRIES
    .map((c) => ({ code: c.code, name: countryName(c.code, lang), days: c.code === 'FR' ? t.table.france : t.table.unit(c.days) }))
    .sort((a, b) => (a.code === 'FR' ? -1 : b.code === 'FR' ? 1 : a.name.localeCompare(b.name, lang)));

  return (
    <div className="bg-white rounded-2xl border border-gray-200 mb-6 overflow-hidden">
      <table className="w-full text-sm">
        <thead className="bg-graphite-900 text-white">
          <tr>
            <th className="text-left font-semibold px-5 py-3">{t.table.country}</th>
            <th className="text-left font-semibold px-5 py-3">{t.table.days}</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {rows.map((r) => (
            <tr key={r.code}>
              <td className="px-5 py-2 text-text-primary">{r.name}</td>
              <td className="px-5 py-2 text-text-secondary">{r.days}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

const ShippingPolicy = () => (
  <LegalPage T={SHIPPING_T} icon={Truck}>
    <ShippingTable />
  </LegalPage>
);

export default ShippingPolicy;
