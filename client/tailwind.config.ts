import type { Config } from "tailwindcss";

export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        panel: "#11161f",
        ink: "#d9e4f4",
        ember: "#f97316",
        moss: "#34d399",
        steel: "#7dd3fc"
      },
      fontFamily: {
        display: ["Sora", "ui-sans-serif", "system-ui"],
        body: ["Manrope", "ui-sans-serif", "system-ui"]
      },
      boxShadow: {
        glow: "0 24px 80px rgba(15, 23, 42, 0.4)"
      },
      backgroundImage: {
        "board-grid": "radial-gradient(circle at center, rgba(125, 211, 252, 0.08) 0, transparent 1px)"
      }
    }
  },
  plugins: []
} satisfies Config;
