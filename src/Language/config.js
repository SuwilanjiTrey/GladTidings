// src/Language/config.js
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import en from './language-files/en.json';
import es from './language-files/es.json';
import fr from './language-files/fr.json';
import swed from './language-files/swed.json';
import de from './language-files/de.json';
import it from './language-files/it.json';
import pt from './language-files/pt.json';
import ar from './language-files/ar.json';
import ja from './language-files/jp.json';
import ko from './language-files/ko.json';

i18n
  .use(initReactI18next)
  .init({
    resources: {
      en: { translation: en },
      swed: { translation: swed },
      es: { translation: es },
      fr: { translation: fr },
      de: { translation: de },
      it: { translation: it },
      pt: { translation: pt },
      ar: { translation: ar },
      ja: { translation: ja },
      ko: { translation: ko },
    },
    lng: 'en',
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false
    }
  });



export default i18n;