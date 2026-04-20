import type { FC } from "react";
import { useTheme } from "../theme/ThemeProvider";

interface ThemeToggleProps {
  className?: string;
}

const ThemeToggle: FC<ThemeToggleProps> = ({ className = "" }) => {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === "dark";

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className={`relative inline-flex h-7 w-14 items-center rounded-full bg-white shadow-sm transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-transparent ${
        isDark ? "bg-white/90" : "bg-white"
      } ${className}`}
      aria-label="Toggle dark mode"
      aria-pressed={isDark}
    >
      <span className="sr-only">Turn dark mode on or off</span>
      <span
        className={`inline-flex h-5 w-5 transform items-center justify-center rounded-full shadow-sm transition-transform duration-200 ${
          isDark ? "translate-x-7 bg-surface-dark text-textPrimary-dark" : "translate-x-1 bg-surface text-textPrimary"
        }`}
      >
        {isDark ? (
          <svg
            className="h-3 w-3"
            viewBox="0 0 24 24"
            fill="currentColor"
          >
            <path d="M21 12.79A9 9 0 0 1 11.21 3 7 7 0 1 0 21 12.79Z" />
          </svg>
        ) : (
          <svg
            className="h-3 w-3"
            viewBox="0 0 24 24"
            fill="currentColor"
          >
            <path d="M12 4.5a1 1 0 0 1-1-1V2.25a1 1 0 1 1 2 0V3.5a1 1 0 0 1-1 1Zm0 17.25a1 1 0 0 1-1 1v0a1 1 0 0 1-1-1V20.5a1 1 0 0 1 2 0Zm9-8.75a1 1 0 0 1-1 1h-1.25a1 1 0 0 1 0-2H20a1 1 0 0 1 1 1Zm-15.75 1a1 1 0 0 1 0-2H6.5a1 1 0 0 1 0 2Zm11.248-6.532a1 1 0 0 1 1.414-1.414l.884.884a1 1 0 0 1-1.414 1.414Zm-9.9 9.9a1 1 0 0 1 1.414-1.414l.884.884a1 1 0 0 1-1.414 1.414Zm0-9.9.884-.884a1 1 0 1 1 1.414 1.414l-.884.884A1 1 0 0 1 6.6 7.468Zm9.9 9.9.884-.884a1 1 0 1 1 1.414 1.414l-.884.884a1 1 0 0 1-1.414-1.414ZM12 7.25A4.75 4.75 0 1 0 16.75 12 4.756 4.756 0 0 0 12 7.25Z" />
          </svg>
        )}
      </span>
    </button>
  );
};

export default ThemeToggle;

