/** @type {import('tailwindcss').Config} */
export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Inter Variable"', "Inter", "system-ui", "sans-serif"],
      },
      colors: {
        "dw-bg": "var(--background)",
        "dw-surface": "var(--card)",
        "dw-text": "var(--foreground)",
        "dw-muted": "var(--muted-foreground)",
        "dw-border": "var(--border)",
      },
    },
  },
  plugins: [],
};
