import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import LanguageDetector from "i18next-browser-languagedetector";

// Minimal resources inline; full JSON files are imported below
import en from "./locales/en/common.json";
import de from "./locales/de/common.json";
import fr from "./locales/fr/common.json";
import es from "./locales/es/common.json";
import it from "./locales/it/common.json";
import bg from "./locales/bg/common.json";
import pl from "./locales/pl/common.json";
import nl from "./locales/nl/common.json";
import pt from "./locales/pt/common.json";
import ro from "./locales/ro/common.json";
import el from "./locales/el/common.json";
import sv from "./locales/sv/common.json";
import da from "./locales/da/common.json";
import no_ from "./locales/no/common.json";
import fi from "./locales/fi/common.json";
import cs from "./locales/cs/common.json";
import sk from "./locales/sk/common.json";
import hu from "./locales/hu/common.json";
import hr from "./locales/hr/common.json";
import sl from "./locales/sl/common.json";

const resources = {
  en: { common: en },
  de: { common: de },
  fr: { common: fr },
  es: { common: es },
  it: { common: it },
  bg: { common: bg },
  pl: { common: pl },
  nl: { common: nl },
  pt: { common: pt },
  ro: { common: ro },
  el: { common: el },
  sv: { common: sv },
  da: { common: da },
  no: { common: no_ },
  fi: { common: fi },
  cs: { common: cs },
  sk: { common: sk },
  hu: { common: hu },
  hr: { common: hr },
  sl: { common: sl },
};

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: "en",
    ns: ["common"],
    defaultNS: "common",
    interpolation: { escapeValue: false },
    detection: {
      order: ["localStorage", "navigator", "htmlTag"],
      caches: ["localStorage"],
    },
  });

export default i18n;


