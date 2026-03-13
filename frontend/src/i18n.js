import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import translationEN from './locales/en/translation.json';
import translationJA from './locales/ja/translation.json';

const resources = {
    en: {
        translation: translationEN,
    },
    ja: {
        translation: translationJA,
    },
};

const savedLanguage = localStorage.getItem('bioscope_language') || 'en';

i18n
    .use(initReactI18next)
    .init({
        resources,
        lng: savedLanguage,
        fallbackLng: 'en',

        interpolation: {
            escapeValue: false, // react already safes from xss
        },
    });

i18n.on('languageChanged', (lang) => {
    localStorage.setItem('bioscope_language', lang);
});

export default i18n;
