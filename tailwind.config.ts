import type { Config } from "tailwindcss";

/**
 * NexusDine design tokens.
 * Primary: Warm Orange/Amber #FF6B35
 * Surface: #F8F9FA · Text charcoal: #2F3E46
 */
const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        primary: {
          50: "#FFF3EE",
          100: "#FFE4D6",
          200: "#FFC4A8",
          300: "#FF9D70",
          400: "#FF7A47",
          500: "#FF6B35",
          600: "#F05520",
          700: "#C94216",
          800: "#A13616",
          900: "#843016",
          DEFAULT: "#FF6B35",
        },
        secondary: {
          50: "#F4F6F7",
          100: "#E3E7E9",
          200: "#C5CDD2",
          300: "#9AA8B0",
          400: "#6B7D88",
          500: "#516370",
          600: "#3F505C",
          700: "#2F3E46",
          800: "#263238",
          900: "#1C252A",
          DEFAULT: "#2F3E46",
        },
        surface: {
          DEFAULT: "#F8F9FA",
          elevated: "#FFFFFF",
          muted: "#EEF1F3",
        },
      },
      screens: {
        pos: "768px",
        station: "1280px",
      },
      fontFamily: {
        display: ["var(--font-display)", "Georgia", "serif"],
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
      },
      boxShadow: {
        nav: "0 -4px 24px rgba(47, 62, 70, 0.08)",
        panel: "0 12px 40px rgba(47, 62, 70, 0.12)",
      },
      keyframes: {
        "fade-up": {
          from: { opacity: "0", transform: "translateY(10px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        "fade-in": {
          from: { opacity: "0" },
          to: { opacity: "1" },
        },
      },
      animation: {
        "fade-up": "fade-up 0.35s ease-out both",
        "fade-in": "fade-in 0.3s ease-out both",
      },
    },
  },
  plugins: [],
};

export default config;
