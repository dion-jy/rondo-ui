/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        surface: {
          DEFAULT: "#0b0713",
          card: "#110e1b",
          hover: "#1a1528",
          raised: "#211b33",
        },
        accent: {
          DEFAULT: "#c084fc",
          hover: "#d8b4fe",
          muted: "#a855f7",
          dim: "#7c3aed",
          pink: "#ec4899",
        },
        border: {
          DEFAULT: "rgba(255,255,255,0.06)",
          hover: "rgba(255,255,255,0.10)",
          accent: "rgba(192,132,252,0.25)",
        },
      },
      boxShadow: {
        glow: "0 0 24px rgba(139,92,246,0.15)",
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
