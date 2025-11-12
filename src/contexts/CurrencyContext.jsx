import React, { createContext, useContext, useState, useEffect } from 'react';

const CurrencyContext = createContext();

export const useCurrency = () => {
  const context = useContext(CurrencyContext);
  if (!context) {
    throw new Error('useCurrency must be used within a CurrencyProvider');
  }
  return context;
};

export const currencies = {
  EUR: { 
    name: 'Euro', 
    symbol: '€', 
    rate: 1.0,
    countries: ['FR', 'DE', 'IT', 'ES', 'NL', 'BE', 'AT', 'PT', 'IE', 'FI', 'EE', 'LV', 'LT', 'LU', 'MT', 'SK', 'SI', 'CY', 'GR']
  },
  USD: { 
    name: 'US Dollar', 
    symbol: '$', 
    rate: 1.08,
    countries: ['US']
  },
  GBP: { 
    name: 'British Pound', 
    symbol: '£', 
    rate: 0.86,
    countries: ['GB']
  },
  CHF: { 
    name: 'Swiss Franc', 
    symbol: 'CHF', 
    rate: 0.97,
    countries: ['CH']
  },
  PLN: { 
    name: 'Polish Złoty', 
    symbol: 'zł', 
    rate: 4.35,
    countries: ['PL']
  },
  CZK: { 
    name: 'Czech Koruna', 
    symbol: 'Kč', 
    rate: 24.50,
    countries: ['CZ']
  },
  HUF: { 
    name: 'Hungarian Forint', 
    symbol: 'Ft', 
    rate: 385.0,
    countries: ['HU']
  },
  RON: { 
    name: 'Romanian Leu', 
    symbol: 'lei', 
    rate: 4.97,
    countries: ['RO']
  },
  BGN: { 
    name: 'Bulgarian Lev', 
    symbol: 'лв', 
    rate: 1.96,
    countries: ['BG']
  },
  HRK: { 
    name: 'Croatian Kuna', 
    symbol: 'kn', 
    rate: 7.53,
    countries: ['HR']
  },
  SEK: { 
    name: 'Swedish Krona', 
    symbol: 'kr', 
    rate: 11.25,
    countries: ['SE']
  },
  DKK: { 
    name: 'Danish Krone', 
    symbol: 'kr', 
    rate: 7.46,
    countries: ['DK']
  },
  NOK: { 
    name: 'Norwegian Krone', 
    symbol: 'kr', 
    rate: 11.80,
    countries: ['NO']
  }
};

const CurrencyProviderComponent = ({ children }) => {
  const [currentCurrency, setCurrentCurrency] = useState('EUR');
  const [exchangeRates, setExchangeRates] = useState(currencies);

  useEffect(() => {
    const savedCurrency = localStorage.getItem('preferredCurrency');
    if (savedCurrency && currencies[savedCurrency]) {
      setCurrentCurrency(savedCurrency);
    }
  }, []);

  const changeCurrency = (currencyCode) => {
    setCurrentCurrency(currencyCode);
    localStorage.setItem('preferredCurrency', currencyCode);
  };

  const convertPrice = (price, fromCurrency = 'EUR', toCurrency = currentCurrency) => {
    if (fromCurrency === toCurrency) return price;
    
    // Convert to EUR first, then to target currency
    const eurPrice = price / exchangeRates[fromCurrency].rate;
    const convertedPrice = eurPrice * exchangeRates[toCurrency].rate;
    
    return convertedPrice;
  };

  const formatPrice = (price, currencyCode = currentCurrency) => {
    const currency = currencies[currencyCode];
    const convertedPrice = convertPrice(price, 'EUR', currencyCode);
    
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currencyCode,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(convertedPrice);
  };

  const value = {
    currentCurrency,
    currencies,
    exchangeRates,
    changeCurrency,
    convertPrice,
    formatPrice
  };

  return (
    <CurrencyContext.Provider value={value}>
      {children}
    </CurrencyContext.Provider>
  );
};

export const CurrencyProvider = React.memo(CurrencyProviderComponent);
