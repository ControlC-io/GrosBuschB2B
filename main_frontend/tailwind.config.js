/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        // Brand
        primary: "#3B82F6",
        secondary: "#0EA5E9",

        // Backgrounds
        background: "#F8FAFC",
        "background-dark": "#0F172A",
        surface: "#FFFFFF",
        "surface-dark": "#1E293B",

        // Borders
        border: "#E2E8F0",
        "border-dark": "#334155",
        "navbar-border-dark": "#1E40AF",

        // Navbar
        navbar: "#1D4ED8",
        "navbar-dark": "#0F172A",

        // Text
        textPrimary: "#0F172A",
        "textPrimary-dark": "#F8FAFC",
        textSecondary: "#64748B",
        "textSecondary-dark": "#94A3B8",

        // Icon surfaces
        "icon-dark": "#334155",

        // Contrast tokens
        "primary-on-light": "#FFFFFF",
        "primary-on-dark": "#FFFFFF",
        "secondary-on-light": "#FFFFFF",
        "secondary-on-dark": "#FFFFFF",

        // Status — light
        "status-success": "#16a34a",
        "status-success-bg": "#dcfce7",
        "status-error": "#dc2626",
        "status-error-bg": "#fee2e2",
        "status-warning": "#d97706",
        "status-warning-bg": "#fef3c7",

        // Status — dark
        "status-success-dark": "#4ade80",
        "status-success-bg-dark": "rgba(74,222,128,0.15)",
        "status-error-dark": "#f87171",
        "status-error-bg-dark": "rgba(248,113,113,0.15)",
        "status-warning-dark": "#fbbf24",
        "status-warning-bg-dark": "rgba(251,191,36,0.15)",
      },
      borderRadius: {
        lg: "8px",
      },
      fontFamily: {
        sans: [
          "Roboto",
          "\"Neue Montreal\"",
          "system-ui",
          "-apple-system",
          "BlinkMacSystemFont",
          "\"Segoe UI\"",
          "sans-serif",
        ],
      },
    },
  },
  plugins: [],
}
