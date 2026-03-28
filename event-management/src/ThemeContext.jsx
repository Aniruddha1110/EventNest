import { createContext, useContext, useState } from "react";

// ─────────────────────────────────────────────────────────────────────────────
// THEME TOKENS
// These are the actual color/style values for each theme.
// Every component reads from here — change once, updates everywhere.
// ─────────────────────────────────────────────────────────────────────────────

const themes = {

  dark: {
    // Backgrounds
    pageBg:       "bg-[#0c0c0f]",
    cardBg:       "bg-[#111115]",
    inputBg:      "bg-[#1a1a1e]",
    navBg:        "bg-[#0c0c0f]",

    // Borders
    border:       "border-[#1e1e22]",
    borderHover:  "hover:border-[#a3e635]/40",

    // Text
    textPrimary:  "text-white",
    textSecondary:"text-[#a0a0ab]",
    textMuted:    "text-[#5a5a62]",
    textAccent:   "text-[#a3e635]",

    // Accent (lime green)
    accent:       "bg-[#a3e635]",
    accentText:   "text-[#0c0c0f]",
    accentHover:  "hover:bg-[#b8f056]",

    // Raw color values (for inline use if needed)
    raw: {
      pageBg:       "#0c0c0f",
      cardBg:       "#111115",
      border:       "#1e1e22",
      textPrimary:  "#ffffff",
      textSecondary:"#a0a0ab",
      textMuted:    "#5a5a62",
      accent:       "#a3e635",
      accentText:   "#0c0c0f",
    },
  },

  light: {
    // Backgrounds
    pageBg:       "bg-[#f5f5f5]",
    cardBg:       "bg-white",
    inputBg:      "bg-[#f0f0f0]",
    navBg:        "bg-white",

    // Borders
    border:       "border-[#e0e0e0]",
    borderHover:  "hover:border-[#a3e635]/60",

    // Text
    textPrimary:  "text-[#0c0c0f]",
    textSecondary:"text-[#444444]",
    textMuted:    "text-[#888888]",
    textAccent:   "text-[#5a8a00]",   // darker green so it's readable on white

    // Accent
    accent:       "bg-[#a3e635]",
    accentText:   "text-[#0c0c0f]",
    accentHover:  "hover:bg-[#b8f056]",

    // Raw color values
    raw: {
      pageBg:       "#f5f5f5",
      cardBg:       "#ffffff",
      border:       "#e0e0e0",
      textPrimary:  "#0c0c0f",
      textSecondary:"#444444",
      textMuted:    "#888888",
      accent:       "#a3e635",
      accentText:   "#0c0c0f",
    },
  },

};

// ─────────────────────────────────────────────────────────────────────────────
// CONTEXT
// ─────────────────────────────────────────────────────────────────────────────

const ThemeContext = createContext(null);

// ─────────────────────────────────────────────────────────────────────────────
// PROVIDER — wrap your entire app with this in App.jsx
//
// Usage in App.jsx:
//   import { ThemeProvider } from "./ThemeContext";
//   <ThemeProvider> <App /> </ThemeProvider>
// ─────────────────────────────────────────────────────────────────────────────

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState("dark"); // default: dark

  const toggleTheme = () =>
    setTheme((prev) => (prev === "dark" ? "light" : "dark"));

  const t = themes[theme]; // shorthand — use t.cardBg, t.textPrimary etc.

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, t }}>
      {children}
    </ThemeContext.Provider>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// HOOK — use this in any component to get the theme
//
// Usage in any component:
//   import { useTheme } from "./ThemeContext";
//   const { theme, toggleTheme, t } = useTheme();
//
//   <div className={`${t.cardBg} ${t.border} ${t.textPrimary}`}>
// ─────────────────────────────────────────────────────────────────────────────

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used inside a <ThemeProvider>");
  }
  return context;
}

// ─────────────────────────────────────────────────────────────────────────────
// THEME TOGGLE BUTTON — drop this anywhere in your UI
//
// Usage:
//   import { ThemeToggle } from "./ThemeContext";
//   <ThemeToggle />
// ─────────────────────────────────────────────────────────────────────────────

export function ThemeToggle() {
  const { theme, toggleTheme, t } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      className={`
        flex items-center gap-2 px-3 py-2 rounded-xl border transition-all text-sm font-semibold
        ${t.cardBg} ${t.border} ${t.textSecondary}
        hover:${t.textPrimary}
      `}
      title="Toggle theme"
    >
      {theme === "dark" ? "☀️ Light" : "🌙 Dark"}
    </button>
  );
}