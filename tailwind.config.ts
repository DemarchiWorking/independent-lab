import type { Config } from "tailwindcss";
import { color, radius } from "./design-system/tokens";

/**
 * Tailwind consome os design tokens (design-system/tokens.ts) como fonte única
 * de verdade. Regra AGENTS: cor só por token — use estas classes, nunca hex.
 * Nomes prontos para portar ao NativeWind (React Native) no futuro.
 */
const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        night: color.bg.night,
        card: color.bg.card,
        card2: color.bg.card2,
        light: color.bg.light,
        panel: color.bg.panel,
        line: color.bg.line,
        ink: color.text.ink,
        muted: color.text.muted,
        orange: { DEFAULT: color.brand.orange, dark: color.brand.orangeDark },
        teal: color.brand.teal,
        green: color.brand.green,
        coral: { DEFAULT: color.brand.coral, dark: color.brand.coralDark },
        alert: color.alert.bannerBg,
        cat: color.category,
        attr: color.attribute,
        tier: color.tier,
      },
      borderRadius: {
        sm: `${radius.sm}px`,
        md: `${radius.md}px`,
        pill: `${radius.pill}px`,
      },
      fontFamily: {
        ui: ["var(--font-ui)", "Trebuchet MS", "Verdana", "sans-serif"],
        body: ["var(--font-body)", "system-ui", "sans-serif"],
        pixel: ["var(--font-pixel)", "Lucida Console", "monospace"],
      },
      boxShadow: {
        hard: "0 3px 0 rgba(0,0,0,0.25)",
        "hard-lg": "0 6px 0 rgba(0,0,0,0.30)",
        card: "0 4px 16px rgba(8,14,29,0.12)",
        modal: "0 20px 50px rgba(8,14,29,0.5)",
      },
    },
  },
  plugins: [],
};

export default config;
