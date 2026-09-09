import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      fontFamily: {
        display: ["var(--font-display)", "serif"],
        sans: ["var(--font-sans)", "sans-serif"],
      },
      colors: {
        arcane: {
          100: "#f0ecfb",
          950: "#0a0817",
          900: "#120e26",
          850: "#171233",
          800: "#1d1740",
          700: "#2a2158",
          600: "#3c2f7a",
          500: "#5a4599",
          400: "#8a72c9",
          300: "#b8a6e8",
          200: "#ded4f7",
          gold: "#e8c369",
          "gold-dim": "#9c8347",
        },
        school: {
          fire: "#e2572b",
          ice: "#3bb9d6",
          storm: "#7a5fd0",
          myth: "#c9982f",
          life: "#5fae3b",
          death: "#7a7a86",
          balance: "#d6a83b",
          sun: "#e8c369",
          star: "#d8d0f0",
          moon: "#6c5aa8",
        },
        rarity: {
          common: "#9aa0ab",
          uncommon: "#4fae5f",
          rare: "#3d8fd6",
          epic: "#a463d6",
          legendary: "#e8a53b",
          mythic: "#e0446f",
        },
      },
      boxShadow: {
        glow: "0 0 20px rgba(138, 114, 201, 0.35)",
        "glow-gold": "0 0 20px rgba(232, 195, 105, 0.35)",
      },
      backgroundImage: {
        "radial-fade":
          "radial-gradient(circle at top, rgba(90,69,153,0.25), transparent 60%)",
      },
    },
  },
  plugins: [],
};

export default config;
