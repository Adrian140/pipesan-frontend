// Standard VAT rates (%) used only to show the VAT contained in prices; Stripe Tax computes the
// amount reported on the invoice. Outside the EU no French or EU VAT is invoiced (import taxes may apply).
export const VAT_RATES = {
  AT: 20, BE: 21, BG: 20, HR: 25, CZ: 21, DK: 25, EE: 24, FI: 25.5, FR: 20, DE: 19, GR: 24,
  HU: 27, IE: 23, IT: 22, LV: 21, LT: 21, LU: 17, NL: 21, PL: 23, PT: 23, RO: 21, SK: 23,
  SI: 22, ES: 21, SE: 25, CH: 0, GB: 0, LI: 0, NO: 0
};

// Prices include VAT: this is the VAT contained in a gross amount for a private customer.
export const estimateVat = (countryCode, grossAmount) => {
  const rate = VAT_RATES[countryCode] ?? 0;
  return { rate, amount: Math.round((grossAmount - grossAmount / (1 + rate / 100)) * 100) / 100 };
};
