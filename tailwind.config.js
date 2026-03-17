/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        surface: {
          DEFAULT: "#0a0c11",
          card: "#11141c",
          hover: "#1a1e29",
          raised: "#232836",
        },
        accent: {
          DEFAULT: "#e8a44e",
          hover: "#f2c47a",
          muted: "#cc8a36",
          dim: "#a86e24",
          rose: "#e85c8a",
        },
        border: {
          DEFAULT: "rgba(255,255,255,0.06)",
          hover: "rgba(255,255,255,0.10)",
          accent: "rgba(232,164,78,0.25)",
        },
      },
      boxShadow: {
        glow: "0 0 24px rgba(232,164,78,0.15)",
        "card-hover": "0 8px 32px rgba(0,0,0,0.4)",
        "sticky-left": "6px 0 16px rgba(0,0,0,0.5)",
      },
      animation: {
        "fade-in": "fadeIn 0.2s ease-out",
        "slide-up": "slideUp 0.25s ease-out",
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        slideUp: {
          "0%": { opacity: "0", transform: "translateY(8px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
      },
    },
  },
  plugins: [],
};
