// src/config/api/vat.js
import { supabase } from '../supabase';
import { handleDatabaseError } from './health';

const EU_COUNTRIES = new Set([
  'AT','BE','BG','HR','CY','CZ','DK','EE','FI','FR','DE','GR','HU','IE',
  'IT','LV','LT','LU','MT','NL','PL','PT','RO','SK','SI','ES','SE','GB'
]);

const basicVatRegexByCountry = {
  FR: /^FR[A-Z0-9]{2}\d{9}$/,
  DE: /^DE\d{9}$/,
  IT: /^IT\d{11}$/,
  ES: /^ES[A-Z0-9]\d{7}[A-Z0-9]$/,
  NL: /^NL\d{9}B\d{2}$/,
  BE: /^BE\d{10}$/,
  PL: /^PL\d{10}$/,
  AT: /^ATU\d{8}$/,
  PT: /^PT\d{9}$/,
  SE: /^SE\d{12}$/,
  DK: /^DK\d{8}$/,
  FI: /^FI\d{8}$/,
  IE: /^IE\d{7}[A-Z]{1,2}$/,
  LU: /^LU\d{8}$/,
  RO: /^RO\d{2,10}$/,
  BG: /^BG\d{9,10}$/,
  HR: /^HR\d{11}$/,
  SI: /^SI\d{8}$/,
  SK: /^SK\d{10}$/,
  EE: /^EE\d{9}$/,
  LV: /^LV\d{11}$/,
  LT: /^LT\d{9,12}$/,
  CY: /^CY\d{8}[A-Z]$/,
  MT: /^MT\d{8}$/,
  GR: /^GR\d{9}$/,
  HU: /^HU\d{8}$/,
  CZ: /^CZ\d{8,10}$/,
};

function isFormatValidVAT(vatNumber, country) {
  if (!vatNumber) return false;
  const clean = String(vatNumber).replace(/\s/g, '').toUpperCase();
  const rx = basicVatRegexByCountry[(country || '').toUpperCase()];
  return rx ? rx.test(clean) : false;
}

export const vatApi = {
  calculateCartVAT: async (cartItems, shippingCountry, customerInfo = {}) => {
    try {
      const subtotal = (cartItems || []).reduce(
        (s, it) => s + Number(it.price || 0) * Number(it.quantity || 0),
        0
      );

      const buyerType = customerInfo.type === 'company' ? 'company' : 'individual';
      const vatNr = buyerType === 'company' ? (customerInfo.vatNumber || '') : '';
      const country = (shippingCountry || 'FR').toUpperCase();

      if (country === 'FR') {
        const vatAmount = subtotal * 0.20;
        return {
          shouldApplyVAT: true,
          vatRate: 20.0,
          vatAmount,
          vatCountry: 'FR',
          taxRuleApplied: buyerType === 'company' ? 'FR_B2B' : 'FR_B2C',
          buyerType,
          hasValidVAT: isFormatValidVAT(vatNr, country),
          priceIncludesVAT: true,
          subtotalBeforeVAT: subtotal,
          totalWithVAT: subtotal + vatAmount,
          displayNote: 'TVA 20% (France)',
        };
      }

      const isEU = EU_COUNTRIES.has(country);
      const hasValidVAT = isFormatValidVAT(vatNr, country);

      if (isEU && buyerType === 'company' && hasValidVAT) {
        return {
          shouldApplyVAT: false,
          vatRate: 0.0,
          vatAmount: 0,
          vatCountry: country,
          taxRuleApplied: 'EU_B2B_REVERSE_CHARGE',
          buyerType,
          hasValidVAT: true,
          priceIncludesVAT: false,
          subtotalBeforeVAT: subtotal,
          totalWithVAT: subtotal,
          displayNote: `Autoliquidation — TVA due dans ${country}`,
        };
      }

      if (isEU) {
        const vatAmount = subtotal * 0.20;
        return {
          shouldApplyVAT: true,
          vatRate: 20.0,
          vatAmount,
          vatCountry: 'FR',
          taxRuleApplied: buyerType === 'company' ? 'EU_B2B_NO_VAT' : 'EU_B2C',
          buyerType,
          hasValidVAT: false,
          priceIncludesVAT: true,
          subtotalBeforeVAT: subtotal,
          totalWithVAT: subtotal + vatAmount,
          displayNote: 'TVA 20% (France) — vente UE depuis la France',
        };
      }

      return {
        shouldApplyVAT: false,
        vatRate: 0.0,
        vatAmount: 0,
        vatCountry: 'NONE',
        taxRuleApplied: 'NON_EU_EXPORT',
        buyerType,
        hasValidVAT: false,
        priceIncludesVAT: false,
        subtotalBeforeVAT: subtotal,
        totalWithVAT: subtotal,
        displayNote: 'Export — TVA 0%',
      };
    } catch {
      const subtotal = (cartItems || []).reduce(
        (s, it) => s + Number(it.price || 0) * Number(it.quantity || 0),
        0
      );
      const vatAmount = subtotal * 0.20;
      return {
        shouldApplyVAT: true,
        vatRate: 20.0,
        vatAmount,
        vatCountry: 'FR',
        taxRuleApplied: 'FALLBACK_FR',
        buyerType: 'individual',
        hasValidVAT: false,
        priceIncludesVAT: true,
        subtotalBeforeVAT: subtotal,
        totalWithVAT: subtotal + vatAmount,
        displayNote: 'TVA 20% (France) — fallback',
      };
    }
  },

  getCustomerVATInfo: async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return { type: 'individual', vatNumber: null, companyName: null };

      const { data: profile } = await supabase
        .from('users')
        .select('id')
        .eq('auth_id', user.id)
        .single();
      if (!profile) return { type: 'individual', vatNumber: null, companyName: null };

      const { data: billing } = await supabase
        .from('billing_profiles')
        .select('type, company_name, vat_number')
        .eq('user_id', profile.id)
        .eq('is_default', true)
        .maybeSingle();

      if (!billing) return { type: 'individual', vatNumber: null, companyName: null };

      return {
        type: billing.type || 'individual',
        vatNumber: billing.vat_number || null,
        companyName: billing.company_name || null,
      };
    } catch {
      return { type: 'individual', vatNumber: null, companyName: null };
    }
  },

  getDefaultShippingCountry: async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return 'FR';

      const { data: profile } = await supabase
        .from('users')
        .select('id, country')
        .eq('auth_id', user.id)
        .single();
      if (!profile) return 'FR';

      const { data: ship } = await supabase
        .from('addresses')
        .select('country')
        .eq('user_id', profile.id)
        .eq('type', 'shipping')
        .eq('is_default', true)
        .maybeSingle();
      if (ship?.country) return ship.country;

      const { data: both } = await supabase
        .from('addresses')
        .select('country')
        .eq('user_id', profile.id)
        .eq('type', 'both')
        .eq('is_default', true)
        .maybeSingle();
      if (both?.country) return both.country;

      return profile.country || 'FR';
    } catch {
      return 'FR';
    }
  },

  // doar validare de format (sync-like pentru UI)
  validateVATNumber: async (vatNumber, country) => {
    const valid = isFormatValidVAT(vatNumber, (country || '').toUpperCase());
    return { valid, country };
  },
};
