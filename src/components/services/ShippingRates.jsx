import React, { useMemo, useState } from 'react';
import { Calculator, Truck } from 'lucide-react';
import {
  CHRONOPOST_SERVICES,
  CLASSIC_EXTRA_PARCEL,
  CLASSIC_MAX_KG,
  CLASSIC_ZONE_BANDS,
  SHIPPING_COUNTRIES,
  findBand,
  getShippingQuote,
  withMarkup
} from '../../data/chronopostRates';

const ZONES = [1, 2, 3, 4];
const DEFAULT_ROWS_MAX_KG = 30;

const formatEuro = (value) => `€${value.toFixed(2)}`;
const formatKg = (value) => `${String(value).replace('.', ',')} kg`;

const ROW_LIMITS = [0.5, ...CLASSIC_ZONE_BANDS[1].map(([maxKg]) => maxKg)];

const TABLE_COLUMNS = [
  { key: 'c18', label: 'France · Home', bands: CHRONOPOST_SERVICES.c18.bands },
  { key: 'relais', label: 'France · Pickup point', bands: CHRONOPOST_SERVICES.relais.bands },
  ...ZONES.map((zone) => ({ key: `zone${zone}`, label: `Zone ${zone}`, bands: CLASSIC_ZONE_BANDS[zone] }))
];

function ShippingRates() {
  const [countryCode, setCountryCode] = useState('FR');
  const [serviceId, setServiceId] = useState('c18');
  const [weight, setWeight] = useState('1');
  const [showAllWeights, setShowAllWeights] = useState(false);

  const country = SHIPPING_COUNTRIES.find((c) => c.code === countryCode);
  const quote = getShippingQuote(countryCode, String(weight).replace(',', '.'), serviceId);

  const countriesByZone = useMemo(() => ZONES.map((zone) => ({
    zone,
    countries: SHIPPING_COUNTRIES.filter((c) => c.zone === zone)
  })), []);

  const rows = ROW_LIMITS
    .filter((maxKg) => showAllWeights || maxKg <= DEFAULT_ROWS_MAX_KG)
    .map((maxKg, index, limits) => ({
      label: `${index === 0 ? 0 : String(limits[index - 1]).replace('.', ',')} – ${formatKg(maxKg)}`,
      cells: TABLE_COLUMNS.map(({ key, bands }) => {
        const band = maxKg <= bands[bands.length - 1][0] ? findBand(bands, maxKg) : null;
        return { key, price: band ? withMarkup(band.cost) : null };
      })
    }));

  return (
    <section className="mb-20" id="shipping-rates">
      <div className="text-center mb-12">
        <Truck className="w-12 h-12 text-primary mx-auto mb-4" />
        <h2 className="text-3xl font-bold text-text-primary mb-4">Shipping Rates by Country</h2>
        <p className="text-text-secondary max-w-3xl mx-auto">
          Chronopost delivery from France, priced per parcel by destination and weight. All prices include VAT.
        </p>
      </div>

      <div className="bg-white rounded-xl border-2 border-primary p-8 mb-10">
        <div className="flex items-center mb-6">
          <Calculator className="w-6 h-6 text-primary mr-3" />
          <h3 className="text-2xl font-bold text-text-primary">Shipping Calculator</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <label htmlFor="shipping-country" className="block text-sm font-medium text-text-primary mb-2">
              Destination country
            </label>
            <select
              id="shipping-country"
              value={countryCode}
              onChange={(e) => setCountryCode(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-primary focus:border-primary text-lg"
            >
              {SHIPPING_COUNTRIES.map((c) => (
                <option key={c.code} value={c.code}>{c.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="shipping-weight" className="block text-sm font-medium text-text-primary mb-2">
              Parcel weight (kg)
            </label>
            <input
              id="shipping-weight"
              type="number"
              min="0.01"
              step="0.1"
              value={weight}
              onChange={(e) => setWeight(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-primary focus:border-primary text-lg"
            />
          </div>
          {country?.services ? (
            <div>
              <label htmlFor="shipping-service" className="block text-sm font-medium text-text-primary mb-2">
                Service
              </label>
              <select
                id="shipping-service"
                value={serviceId}
                onChange={(e) => setServiceId(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-primary focus:border-primary text-lg"
              >
                {country.services.map((id) => (
                  <option key={id} value={id}>{CHRONOPOST_SERVICES[id].name}</option>
                ))}
              </select>
            </div>
          ) : (
            <div>
              <p className="block text-sm font-medium text-text-primary mb-2">Service</p>
              <p className="px-4 py-3 bg-gray-50 rounded-lg text-lg text-text-secondary">
                Chronopost Classic · Zone {country?.zone}
              </p>
            </div>
          )}
        </div>

        <div className="mt-8 pt-8 border-t border-gray-200" aria-live="polite">
          {!quote && <p className="text-text-secondary">Enter a parcel weight above 0 kg.</p>}
          {quote && quote.price === null && (
            <p className="text-text-secondary">
              This service carries parcels up to {formatKg(quote.maxKg)}. Contact us for heavier shipments.
            </p>
          )}
          {quote?.price != null && (
            <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
              <div>
                <p className="text-lg font-semibold text-text-primary">Shipping to {quote.country.name}</p>
                <p className="text-sm text-text-secondary mt-1">
                  {quote.service ? quote.service.name : `Chronopost Classic · Zone ${quote.country.zone}`}
                  {' · '}band {quote.band.minKg} – {formatKg(quote.band.maxKg)}
                  {quote.country.days ? ` · about ${quote.country.days} working days` : ''}
                </p>
              </div>
              <div className="text-left md:text-right">
                <p className="text-4xl font-bold text-primary" data-testid="shipping-quote">{formatEuro(quote.price)}</p>
                <p className="text-sm text-text-secondary">per parcel, incl. VAT</p>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
        {countriesByZone.map(({ zone, countries }) => (
          <div key={zone} className="bg-white rounded-xl border border-gray-200 p-5">
            <h3 className="text-lg font-bold text-text-primary mb-3">Zone {zone}</h3>
            <ul className="space-y-1 text-sm text-text-secondary">
              {countries.map((c) => (
                <li key={c.code} className="flex justify-between gap-2">
                  <span>{c.name}{c.surcharge ? ` (+${formatEuro(withMarkup(c.surcharge))})` : ''}</span>
                  <span className="whitespace-nowrap">{c.days} d</span>
                </li>
              ))}
            </ul>
            <p className="text-xs text-text-secondary mt-3">
              Each extra parcel in a multi-parcel shipment: +{formatEuro(withMarkup(CLASSIC_EXTRA_PARCEL[zone]))}
            </p>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th scope="col" className="px-4 py-3 text-left font-semibold text-text-primary">Weight</th>
              {TABLE_COLUMNS.map((column) => (
                <th key={column.key} scope="col" className="px-4 py-3 text-right font-semibold text-text-primary whitespace-nowrap">
                  {column.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.label} className="border-t border-gray-100">
                <th scope="row" className="px-4 py-2 text-left font-medium text-text-primary whitespace-nowrap">{row.label}</th>
                {row.cells.map((cell) => (
                  <td key={cell.key} className="px-4 py-2 text-right text-text-secondary whitespace-nowrap">
                    {cell.price === null ? '—' : formatEuro(cell.price)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="mt-4 flex flex-col md:flex-row md:items-center md:justify-between gap-3 text-sm text-text-secondary">
        <p>
          Prices per parcel, incl. VAT. United Kingdom and Switzerland add the surcharge shown above. France home delivery
          up to 30 kg, pickup point up to 20 kg; Europe up to {CLASSIC_MAX_KG} kg. Online checkout ships to the address
          (home delivery in France) for orders up to 30 kg; contact us for pickup point delivery or heavier orders.
        </p>
        <button
          type="button"
          onClick={() => setShowAllWeights((value) => !value)}
          className="text-primary font-semibold hover:underline whitespace-nowrap"
        >
          {showAllWeights ? `Show up to ${DEFAULT_ROWS_MAX_KG} kg` : `Show all weights up to ${CLASSIC_MAX_KG} kg`}
        </button>
      </div>
    </section>
  );
}

export default ShippingRates;
