import type { FC } from "react";
import { useEffect, useRef, useState } from "react";
import i18n from "../i18n";
import frFlag from "../assets/flags/Flag_of_France_(1794–1815,_1830–1974).svg";
import ukFlag from "../assets/flags/Flag_of_the_United_Kingdom_(3-5).svg";

export type Language = "fr" | "en";

interface LanguagePickerProps {
  className?: string;
  onChange?: (language: Language) => void;
}

const STORAGE_KEY = "grosbuschb2b-language";

const FLAGS: Record<Language, string> = {
  fr: frFlag,
  en: ukFlag,
};

const LABELS: Record<Language, string> = {
  fr: "FR",
  en: "EN",
};

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
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

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

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelect = (value: Language) => {
    setLanguage(value);
    setOpen(false);
  };

  return (
    <div ref={rootRef} className={`relative ${className}`}>
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        className="inline-flex items-center gap-1.5 py-1"
        aria-label="Language selection"
        aria-expanded={open}
      >
        <img src={FLAGS[language]} alt="" className="h-4 w-6 object-cover shadow-sm" />
        <svg className="h-3 w-3 text-textSecondary dark:text-textSecondary-dark" viewBox="0 0 20 20" fill="currentColor">
          <path d="M5.3 7.3a1 1 0 011.4 0L10 10.58l3.3-3.3a1 1 0 111.4 1.42l-4 4a1 1 0 01-1.4 0l-4-4a1 1 0 010-1.42z" />
        </svg>
      </button>
      {open && (
        <div className="absolute right-0 top-full z-50 mt-1 min-w-[7rem] rounded-md border border-border bg-surface py-1 shadow-lg dark:border-border-dark dark:bg-surface-dark">
          {(["fr", "en"] as Language[]).map((value) => (
            <button
              key={value}
              type="button"
              onClick={() => handleSelect(value)}
              className={`flex w-full items-center gap-2 px-3 py-1.5 text-left text-xs font-semibold ${
                language === value
                  ? "bg-background text-textPrimary dark:bg-background-dark dark:text-textPrimary-dark"
                  : "text-textSecondary hover:bg-background dark:text-textSecondary-dark dark:hover:bg-background-dark"
              }`}
            >
              <img src={FLAGS[value]} alt="" className="h-3.5 w-5 object-cover" />
              {LABELS[value]}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default LanguagePicker;
