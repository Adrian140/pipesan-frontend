// FILE: src/translations/i18n.js
import { useLanguage } from '../contexts/LanguageContext';
import dictionaries from './index';

// util: acces "a.b.c"
const get = (obj, path) =>
  path.split('.').reduce((acc, k) => (acc && acc[k] != null ? acc[k] : undefined), obj);

export const useTranslation = (ns = 'nav') => {
  const { currentLanguage } = useLanguage(); // 'fr' by default la tine

  // dicționarul pentru namespace
  const dict =
    dictionaries[currentLanguage]?.[ns] ||
    dictionaries.fr?.[ns] ||
    dictionaries.en?.[ns] ||
    {};

  const t = (key, fallback) => {
    const v = get(dict, key);
    return v == null || v === '' ? (fallback ?? key) : v;
  };

  return { t, lang: currentLanguage };
};
