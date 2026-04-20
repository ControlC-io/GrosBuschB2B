import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

type Theme = "light" | "dark";

interface ThemeContextValue {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

const STORAGE_KEY = "apptemplate-theme";

// CSS custom properties injected on <html> for each theme.
// These mirror the tokens in tailwind.config.js so colors are
// accessible outside Tailwind (e.g. inline styles, canvas, SVG).
const CSS_VARS: Record<Theme, Record<string, string>> = {
  light: {
    "--color-primary":          "#3B82F6",
    "--color-secondary":        "#0EA5E9",
    "--color-background":       "#F8FAFC",
    "--color-surface":          "#FFFFFF",
    "--color-border":           "#E2E8F0",
    "--color-navbar":           "#1D4ED8",
    "--color-text-primary":     "#0F172A",
    "--color-text-secondary":   "#64748B",
    "--color-icon":             "#E2E8F0",
  },
  dark: {
    "--color-primary":          "#3B82F6",
    "--color-secondary":        "#0EA5E9",
    "--color-background":       "#0F172A",
    "--color-surface":          "#1E293B",
    "--color-border":           "#334155",
    "--color-navbar":           "#0F172A",
    "--color-text-primary":     "#F8FAFC",
    "--color-text-secondary":   "#94A3B8",
    "--color-icon":             "#334155",
  },
};

const getInitialTheme = (): Theme => {
  if (typeof window === "undefined") return "light";
  const stored = window.localStorage.getItem(STORAGE_KEY);
  if (stored === "light" || stored === "dark") return stored;
  return window.matchMedia?.("(prefers-color-scheme: dark)").matches ? "dark" : "light";
};

interface ThemeProviderProps {
  children: ReactNode;
}

export const ThemeProvider = ({ children }: ThemeProviderProps) => {
  const [theme, setThemeState] = useState<Theme>(getInitialTheme);

  useEffect(() => {
    const root = document.documentElement;

    // Toggle Tailwind dark class
    root.classList.toggle("dark", theme === "dark");

    // Apply CSS custom properties for this theme
    const vars = CSS_VARS[theme];
    Object.entries(vars).forEach(([key, value]) => root.style.setProperty(key, value));

    window.localStorage.setItem(STORAGE_KEY, theme);
  }, [theme]);

  // Respect OS-level preference changes unless the user has made an explicit choice
  useEffect(() => {
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const handleChange = (e: MediaQueryListEvent) => {
      if (!window.localStorage.getItem(STORAGE_KEY)) {
        setThemeState(e.matches ? "dark" : "light");
      }
    };
    mq.addEventListener("change", handleChange);
    return () => mq.removeEventListener("change", handleChange);
  }, []);

  const setTheme = (value: Theme) => setThemeState(value);
  const toggleTheme = () => setThemeState((t) => (t === "light" ? "dark" : "light"));

  const value = useMemo(() => ({ theme, setTheme, toggleTheme }), [theme]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
};

export const useTheme = (): ThemeContextValue => {
  const context = useContext(ThemeContext);
  if (!context) throw new Error("useTheme must be used within a ThemeProvider");
  return context;
};
