import i18n from "i18next";
import { initReactI18next } from "react-i18next";

import frCommon from "../locales/fr/common.json";
import enCommon from "../locales/en/common.json";

const STORAGE_KEY = "apptemplate-language";

const getInitialLanguage = (): "fr" | "en" => {
  if (typeof window === "undefined") {
    return "fr";
  }

  const stored = window.localStorage.getItem(STORAGE_KEY);
  if (stored === "fr" || stored === "en") {
    return stored;
  }

  const browserLang = window.navigator.language.toLowerCase();
  if (browserLang.startsWith("en")) {
    return "en";
  }
  if (browserLang.startsWith("fr")) {
    return "fr";
  }

  return "fr";
};

void i18n.use(initReactI18next).init({
  resources: {
    fr: { common: frCommon },
    en: { common: enCommon },
  },
  lng: getInitialLanguage(),
  fallbackLng: "fr",
  interpolation: {
    escapeValue: false,
  },
});

export default i18n;

