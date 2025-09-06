import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import LanguageDetector from "i18next-browser-languagedetector";

// Static JSON resources
import enUS from "./locales/en-US.json";
import enCA from "./locales/en-CA.json";
import enAU from "./locales/en-AU.json";
import enUK from "./locales/en-UK.json"; // alias en-GB -> en-UK
import esES from "./locales/es-ES.json";
import frFR from "./locales/fr-FR.json";
import frMC from "./locales/fr-MC.json";
import hiIN from "./locales/hi-IN.json";

const LANGUAGE_ALIASES = {
  "en-GB": "en-UK",
  "en": "en-US",
  "es": "es-ES",
  "fr": "fr-FR",
  "hi": "hi-IN"
};

const resources = {
  "en-US": { translation: enUS },
  "en-CA": { translation: enCA },
  "en-AU": { translation: enAU },
  "en-UK": { translation: enUK },
  "es-ES": { translation: esES },
  "fr-FR": { translation: frFR },
  "fr-MC": { translation: frMC },
  "hi-IN": { translation: hiIN }
};

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: "en-US",
    supportedLngs: Object.keys(resources),
    interpolation: { escapeValue: false },
    detection: {
      order: ["localStorage", "navigator", "htmlTag", "path", "subdomain"],
      caches: ["localStorage"],
      convertDetectedLanguage: (lng) => LANGUAGE_ALIASES[lng] || lng
    }
  });

i18n.on("languageChanged", (lng) => {
  document.documentElement.setAttribute("lang", lng);
});

export default i18n;
