/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class', // ← CRITICAL: Tells Tailwind to use the .dark class
  theme: {
    extend: {
      colors: {
        // These create your new utility classes!
        pageBg: "var(--color-page)",       // Use as: bg-pageBg
        cardBg: "var(--color-card)",       // Use as: bg-cardBg
        themeBorder: "var(--color-border)",// Use as: border-themeBorder
        textMain: "var(--color-text-main)",// Use as: text-textMain
        textMuted: "var(--color-text-muted)",// Use as: text-textMuted
        themeAccent: "var(--color-accent)",// Use as: bg-themeAccent or text-themeAccent
        inputBg: "var(--color-input)",
      }
    },
  },
  plugins: [],
}