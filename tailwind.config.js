/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        /* ── Rondo Brand Palette (theme-aware via CSS vars) ── */
        surface: {
          DEFAULT: "rgb(var(--surface-rgb) / <alpha-value>)",
          card: "rgb(var(--surface-card-rgb) / <alpha-value>)",
          hover: "rgb(var(--surface-hover-rgb) / <alpha-value>)",
          raised: "rgb(var(--surface-raised-rgb) / <alpha-value>)",
        },
        accent: {
          DEFAULT: "rgb(var(--accent-rgb) / <alpha-value>)",
          hover: "rgb(var(--accent-hover-rgb) / <alpha-value>)",
          muted: "rgb(var(--accent-muted-rgb) / <alpha-value>)",
          dim: "rgb(var(--accent-muted-rgb) / <alpha-value>)",
          aqua: "rgb(var(--accent-aqua-rgb) / <alpha-value>)",
          brass: "rgb(var(--accent-brass-rgb) / <alpha-value>)",
        },
        border: {
          DEFAULT: "rgb(var(--border-rgb) / 0.08)",
          hover: "rgb(var(--border-rgb) / 0.16)",
          accent: "rgb(var(--border-rgb) / 0.25)",
        },
        /* ── Status colors (theme-aware) ── */
        success: "rgb(var(--success-rgb) / <alpha-value>)",
        error: "rgb(var(--error-rgb) / <alpha-value>)",
        warning: "rgb(var(--warning-rgb) / <alpha-value>)",
        info: "rgb(var(--info-rgb) / <alpha-value>)",
      },
      boxShadow: {
        glow: "0 0 24px rgb(var(--accent-rgb) / 0.18)",
        "card-hover": "0 8px 32px rgba(0,0,0,0.5)",
        "sticky-left": "6px 0 16px rgba(0,0,0,0.5)",
        iris: "0 0 12px rgb(var(--accent-rgb) / 0.25)",
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
