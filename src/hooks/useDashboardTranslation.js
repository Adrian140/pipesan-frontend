import { dashboardTranslations } from '../translations/dashboard';
import { useLanguage } from '../contexts/LanguageContext';

export const useDashboardTranslation = () => {
  const { currentLanguage } = useLanguage();
  
  const dt = (key) => {
    return dashboardTranslations[currentLanguage]?.[key] || 
           dashboardTranslations.en?.[key] || 
           key;
  };

  return { dt };
};
