import React, { useState } from 'react';
import { DollarSign, ChevronDown } from 'lucide-react';
import { useCurrency } from '../contexts/CurrencyContext';

function CurrencySelector() {
  const { currentCurrency, changeCurrency, currencies } = useCurrency();
  const [isOpen, setIsOpen] = useState(false);

  const handleCurrencyChange = (currencyCode) => {
    changeCurrency(currencyCode);
    setIsOpen(false);
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-2 px-3 py-2 text-sm font-medium text-text-secondary hover:text-primary transition-colors border border-gray-300 rounded-lg hover:border-primary"
      >
        <DollarSign className="w-4 h-4" />
        <span className="hidden sm:inline">{currencies[currentCurrency].symbol}</span>
        <span className="hidden md:inline">{currencies[currentCurrency].name}</span>
        <ChevronDown className="w-4 h-4" />
      </button>

      {isOpen && (
        <>
          <div 
            className="fixed inset-0 z-10" 
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-20">
            <div className="py-2">
              {Object.entries(currencies).map(([code, currency]) => (
                <button
                  key={code}
                  onClick={() => handleCurrencyChange(code)}
                  className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-50 flex items-center justify-between ${
                    currentCurrency === code ? 'bg-blue-50 text-primary' : 'text-text-secondary'
                  }`}
                >
                  <span>{currency.symbol} {currency.name}</span>
                  {currentCurrency === code && (
                    <span className="text-primary">✓</span>
                  )}
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default CurrencySelector;
