import type { Config } from "tailwindcss"

export default {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        display: "var(--font-display)",
        body: "var(--font-body)",
      },
      colors: {
        background: "var(--surface)",
        foreground: "var(--on-surface)",
        card: "var(--surface-container-lowest)",
        "card-foreground": "var(--on-surface)",
        primary: "var(--primary)",
        "primary-foreground": "var(--on-primary)",
        secondary: "var(--secondary)",
        accent: "var(--secondary-light)",
        border: "var(--outline-variant)",
        error: "var(--error)",
        "error-foreground": "var(--on-surface)",
      },
      borderRadius: {
        xs: "var(--radius-xs)",
        sm: "var(--radius-sm)",
        md: "var(--radius-md)",
      },
      boxShadow: {
        ambient: "var(--shadow-ambient)",
      },
      backgroundImage: {
        ocean: "var(--gradient-ocean)",
      },
    },
  },
  plugins: [],
} satisfies Config
