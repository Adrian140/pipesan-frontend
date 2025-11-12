// src/contexts/VATContext.jsx
import React, { createContext, useContext, useEffect, useState } from 'react';
import { useAuth } from './AuthContext';
import { vatApi } from '../config/api/vat';

const VATContext = createContext();
export const useVAT = () => {
  const ctx = useContext(VATContext);
  if (!ctx) throw new Error('useVAT must be used within a VATProvider');
  return ctx;
};

const initialVAT = {
  shouldApplyVAT: true,
  vatRate: 20.0,
  vatAmount: 0,
  vatCountry: 'FR',
  taxRuleApplied: 'FR_B2C',
  buyerType: 'individual',
  hasValidVAT: false,
  priceIncludesVAT: true,
  displayNote: 'TVA 20% (France)',
  subtotalBeforeVAT: 0,
  totalWithVAT: 0,
};

const regexMap = {
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
const validVATFormat = (vat, country) => {
  if (!vat) return false;
  const clean = String(vat).replace(/\s/g, '').toUpperCase();
  const rx = regexMap[(country || '').toUpperCase()];
  return rx ? rx.test(clean) : false;
};

const VATProviderComponent = ({ children }) => {
  const { user } = useAuth();
  const [vatInfo, setVATInfo] = useState(initialVAT);
  const [loading, setLoading] = useState(false);
  const [customerInfo, setCustomerInfo] = useState({
    type: 'individual',
    vatNumber: null,
    companyName: null,
  });
  const [defaultShippingCountry, setDefaultShippingCountry] = useState('FR');

  useEffect(() => {
    (async () => {
      if (user) {
        try {
          const [info, country] = await Promise.all([
            vatApi.getCustomerVATInfo(),
            vatApi.getDefaultShippingCountry(),
          ]);
          setCustomerInfo(info);
          setDefaultShippingCountry(country || 'FR');
        } catch {
          setCustomerInfo({ type: 'individual', vatNumber: null, companyName: null });
          setDefaultShippingCountry('FR');
        }
      } else {
        setCustomerInfo({ type: 'individual', vatNumber: null, companyName: null });
        setDefaultShippingCountry('FR');
      }
    })();
  }, [user]);

  const calculateVAT = async (cartItems, shippingCountry, customInfo = null) => {
    const items = Array.isArray(cartItems) ? cartItems : [];
    const subtotal = items.reduce((s, it) => s + (Number(it.price) || 0) * (Number(it.quantity) || 0), 0);

    // stabilizare UI instant
    setVATInfo((prev) => ({
      ...prev,
      subtotalBeforeVAT: subtotal,
      vatAmount: subtotal * 0.2,
      totalWithVAT: subtotal * 1.2,
    }));

    setLoading(true);
    try {
      const result = await vatApi.calculateCartVAT(
        items,
        shippingCountry || defaultShippingCountry,
        customInfo || customerInfo
      );
      setVATInfo(result);
    } finally {
      setLoading(false);
    }
  };

  const updateShippingCountry = (code) => setDefaultShippingCountry(code || 'FR');
  const updateCustomerInfo = (patch) =>
    setCustomerInfo((prev) => ({ ...prev, ...(patch || {}) }));

  return (
    <VATContext.Provider
      value={{
        vatInfo,
        loading,
        customerInfo,
        defaultShippingCountry,
        calculateVAT,
        updateShippingCountry,
        updateCustomerInfo,
        validVATFormat, // expus pentru UI
      }}
    >
      {children}
    </VATContext.Provider>
  );
};

export const VATProvider = React.memo(VATProviderComponent);
