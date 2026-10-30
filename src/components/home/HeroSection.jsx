import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import PipeSanWordmark from '../brand/PipeSanWordmark';

const SPEC_CHIPS = ['CW617N', 'BSP · NPT', 'DN8 – DN50', 'PN16 – PN40', 'CE'];

// Titlul vine adesea ca „PipeSan - …”; brandul apare deja în logo, deasupra.
function splitBrand(title = '') {
  const m = String(title).match(/^\s*PipeSan\s*[-–—:]\s*(.+)$/i);
  return m ? m[1] : title;
}

function HeroSection({
  title,
  subtitle,
  ctaLabel = 'Browse Products',
  secondaryLabel = 'Contact',
  eyebrow = 'Pro plumbing components',
  products = [],
}) {
  const tiles = products.slice(0, 4);

  return (
    <section className="relative overflow-hidden bg-blueprint text-white">
      <div className="pointer-events-none absolute -right-40 -top-40 h-[520px] w-[520px] rounded-full bg-brass/10 blur-3xl" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-14 pb-20 lg:py-24 grid lg:grid-cols-12 gap-12 items-center">
        <div className="lg:col-span-6">
          <PipeSanWordmark className="w-44 sm:w-56 -ml-2 mb-4" />
          <p className="inline-flex items-center gap-3 font-mono text-[11px] uppercase tracking-[0.2em] text-brass-light mb-6">
            <span className="h-px w-8 bg-brass-light" />
            {eyebrow}
          </p>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold leading-[1.05] mb-6">
            {splitBrand(title)}
          </h1>
          <p className="text-base sm:text-lg text-gray-300 mb-10 max-w-xl leading-relaxed">
            {subtitle}
          </p>

          <div className="flex flex-col sm:flex-row gap-3 mb-10">
            <Link
              to="/products"
              className="group inline-flex items-center justify-center gap-2 bg-brass-sheen text-graphite-950 px-7 py-4 rounded-lg font-bold shadow-lg shadow-black/30 hover:brightness-110 transition"
            >
              {ctaLabel}
              <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
            </Link>
            <Link
              to="/contact"
              className="inline-flex items-center justify-center px-7 py-4 rounded-lg font-semibold border border-white/20 text-white hover:border-brass-light hover:text-brass-light transition-colors"
            >
              {secondaryLabel}
            </Link>
          </div>

          <ul className="flex flex-wrap gap-2">
            {SPEC_CHIPS.map((chip) => (
              <li
                key={chip}
                className="font-mono text-xs px-3 py-1.5 rounded-md border border-white/10 bg-white/5 text-gray-300"
              >
                {chip}
              </li>
            ))}
          </ul>
        </div>

        {/* Product mosaic */}
        <div className="lg:col-span-6">
          <div className="grid grid-cols-2 gap-4 sm:gap-5">
            {(tiles.length ? tiles : [null, null, null, null]).map((p, i) => (
              <Link
                key={p?.id ?? i}
                to={p ? `/products/${p.id}` : '/products'}
                className={`group relative block rounded-2xl bg-white p-5 sm:p-7 shadow-lift ring-1 ring-black/5 ${
                  i % 2 === 1 ? 'translate-y-8' : ''
                }`}
              >
                <div className="aspect-square">
                  {p?.image ? (
                    <img
                      src={p.image}
                      alt={p.name}
                      className="h-full w-full object-contain transition-transform duration-500 group-hover:scale-105"
                      loading={i < 2 ? 'eager' : 'lazy'}
                    />
                  ) : (
                    <div className="h-full w-full rounded-xl bg-paper animate-pulse" />
                  )}
                </div>
                {p?.sku && (
                  <span className="absolute left-4 top-3 font-mono text-[10px] uppercase tracking-wider text-text-light">
                    {p.sku}
                  </span>
                )}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

export default HeroSection;
