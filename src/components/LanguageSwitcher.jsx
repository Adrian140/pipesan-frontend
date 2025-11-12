import React, { useState } from 'react';
import { Globe, ChevronDown } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import FlagEmoji from '../components/common/FlagEmoji';

function LanguageSwitcher() {
  const { currentLanguage, changeLanguage, languages } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);

  // mapăm codul de limbă la cod ISO2 de țară pentru emoji
  const langToCountry = { fr: 'FR', en: 'GB', it: 'IT', de: 'DE', es: 'ES', ro: 'RO' };

  const handleLanguageChange = (languageCode) => {
    changeLanguage(languageCode);
    setIsOpen(false);
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-2 px-3 py-2 text-sm font-medium text-text-secondary hover:text-primary transition-colors border border-gray-300 rounded-lg hover:border-primary"
      >
        <Globe className="w-4 h-4" />
        <FlagEmoji code={langToCountry[currentLanguage]} />
        <span className="hidden md:inline">{languages[currentLanguage].name}</span>
        <ChevronDown className="w-4 h-4" />
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute right-0 mt-2 w-64 bg-white border border-gray-200 rounded-lg shadow-lg z-20 max-h-80 overflow-y-auto">
            <div className="py-2">
              {Object.entries(languages).map(([code, language]) => (
                <button
                  key={code}
                  onClick={() => handleLanguageChange(code)}
                  className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-50 flex items-center space-x-3 ${
                    currentLanguage === code ? 'bg-blue-50 text-primary' : 'text-text-secondary'
                  }`}
                >
                  <FlagEmoji code={langToCountry[code]} />
                  <span>{language.name}</span>
                  {currentLanguage === code && (
                    <span className="ml-auto text-primary">✓</span>
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

export default LanguageSwitcher;
