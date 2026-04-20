import type { FC } from "react";
import { useEffect, useState } from "react";
import i18n from "../i18n";
import frFlag from "../assets/flags/Flag_of_France_(1794–1815,_1830–1974).svg";
import ukFlag from "../assets/flags/Flag_of_the_United_Kingdom_(3-5).svg";

export type Language = "fr" | "en";

interface LanguagePickerProps {
  className?: string;
  onChange?: (language: Language) => void;
}

const STORAGE_KEY = "apptemplate-language";

const getInitialLanguage = (): Language => {
  if (typeof window === "undefined") {
    return "fr";
  }

  const stored = window.localStorage.getItem(STORAGE_KEY);

  if (stored === "en" || stored === "fr") {
    return stored;
  }

  const current = i18n.language;
  return current === "en" ? "en" : "fr";
};

const LanguagePicker: FC<LanguagePickerProps> = ({ className = "", onChange }) => {
  const [language, setLanguage] = useState<Language>(getInitialLanguage);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    void i18n.changeLanguage(language);
    window.localStorage.setItem(STORAGE_KEY, language);

    if (onChange) {
      onChange(language);
    }
  }, [language, onChange]);

  const handleSelect = (value: Language) => {
    setLanguage(value);
  };

  const baseButton =
    "flex items-center justify-center h-8 w-8 rounded-full overflow-hidden text-[0.65rem] font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-white";

  return (
    <div
      className={`inline-flex items-center gap-1 rounded-full bg-white/10 px-1 py-1 h-9 text-white ${className}`}
      aria-label="Language selection"
    >
      <button
        type="button"
        onClick={() => handleSelect("fr")}
        className={`${baseButton} ${
          language === "fr"
            ? "bg-white text-textPrimary dark:text-textPrimary-dark"
            : "text-white/70 hover:text-white"
        }`}
        aria-pressed={language === "fr"}
      >
        <img
          src={frFlag}
          alt="French"
          className="h-3 w-auto"
        />
      </button>
      <button
        type="button"
        onClick={() => handleSelect("en")}
        className={`${baseButton} ${
          language === "en"
            ? "bg-white text-textPrimary dark:text-textPrimary-dark"
            : "text-white/70 hover:text-white"
        }`}
        aria-pressed={language === "en"}
      >
        <img
          src={ukFlag}
          alt="English"
          className="h-3 w-auto"
        />
      </button>
    </div>
  );
};

export default LanguagePicker;
