// FILE: src/contexts/LanguageContext.jsx
import React, { createContext, useContext, useState, useEffect } from 'react';

const LanguageContext = createContext();

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};

export const languages = {
  fr: { name: 'Français', flag: '🇫🇷' },
  en: { name: 'English', flag: '🇬🇧' },
  it: { name: 'Italiano', flag: '🇮🇹' },
  de: { name: 'Deutsch', flag: '🇩🇪' },
  es: { name: 'Español', flag: '🇪🇸' },
  ro: { name: 'Română', flag: '🇷🇴' },
};

const LanguageProviderComponent = ({ children }) => {
  const [currentLanguage, setCurrentLanguage] = useState('fr'); // Default to French

  useEffect(() => {
    const saved = localStorage.getItem('preferredLanguage');
    const initial = saved && languages[saved] ? saved : 'fr';

    setCurrentLanguage(initial);

    if (typeof document !== 'undefined') {
      document.documentElement.lang = initial;
    }

    if (!saved) {
      localStorage.setItem('preferredLanguage', 'fr');
    }
  }, []);

  const changeLanguage = (languageCode) => {
    if (!languages[languageCode]) return;

    setCurrentLanguage(languageCode);
    localStorage.setItem('preferredLanguage', languageCode);

    if (typeof document !== 'undefined') {
      document.documentElement.lang = languageCode;
    }
  };

  return (
    <LanguageContext.Provider value={{ currentLanguage, changeLanguage, languages }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const LanguageProvider = React.memo(LanguageProviderComponent);
