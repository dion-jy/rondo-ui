/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        /* ── Rondo Brand Palette ── */
        surface: {
          DEFAULT: "#0d1017",     /* deep navy-graphite */
          card: "#141821",        /* raised card */
          hover: "#1c2130",       /* hover state */
          raised: "#252b3a",      /* elevated surface */
        },
        accent: {
          DEFAULT: "#7C6CFF",     /* Rondo Iris — primary */
          hover: "#9B8FFF",       /* lighter iris */
          muted: "#5E50CC",       /* muted iris */
          dim: "#4A3FB3",         /* dim iris */
          aqua: "#33D1C6",        /* Aqua Pulse — secondary */
          brass: "#C8A96B",       /* Brass — warm highlight */
          rose: "#E8527A",        /* rose for errors/alerts */
        },
        border: {
          DEFAULT: "rgba(124,108,255,0.08)",
          hover: "rgba(124,108,255,0.16)",
          accent: "rgba(124,108,255,0.25)",
        },
      },
      boxShadow: {
        glow: "0 0 24px rgba(124,108,255,0.18)",
        "card-hover": "0 8px 32px rgba(0,0,0,0.5)",
        "sticky-left": "6px 0 16px rgba(0,0,0,0.5)",
        "iris": "0 0 12px rgba(124,108,255,0.25)",
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
