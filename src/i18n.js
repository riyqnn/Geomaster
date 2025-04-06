import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import enTranslations from './locales/en.json';
import idTranslations from './locales/id.json';

i18n
  .use(initReactI18next)
  .init({
    resources: {
      en: { translation: enTranslations },
      id: { translation: idTranslations }
    },
    lng: 'en', 
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false 
    }
  });

export default i18n;