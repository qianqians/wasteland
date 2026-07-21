/** @type {import('tailwindcss').Config} */

export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    container: {
      center: true,
    },
    extend: {
      colors: {
        ink: {
          950: "#0E0F13",
          900: "#16181F",
          800: "#1C1F28",
          700: "#262932",
          600: "#2E323D",
          500: "#3A3F4B",
        },
        line: "#262932",
        fg: {
          DEFAULT: "#E6E8EC",
          muted: "#8A8F9C",
          dim: "#5B6072",
        },
        accent: {
          DEFAULT: "#C6F432",
          glow: "rgba(198, 244, 50, 0.18)",
          dim: "#9AC226",
        },
        danger: "#FF6B6B",
      },
      fontFamily: {
        sans: ['"Inter Tight"', '"IBM Plex Sans"', "system-ui", "sans-serif"],
        display: ['"Geist"', '"IBM Plex Sans"', "system-ui", "sans-serif"],
        mono: ['"JetBrains Mono"', "ui-monospace", "monospace"],
      },
      boxShadow: {
        glow: "0 0 0 1px rgba(198, 244, 50, 0.35), 0 0 24px rgba(198, 244, 50, 0.18)",
        panel: "0 12px 48px -12px rgba(0, 0, 0, 0.6), inset 0 1px 0 rgba(255, 255, 255, 0.03)",
      },
      animation: {
        "fade-in": "fadeIn 0.4s ease forwards",
        "stagger": "staggerIn 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards",
        "pulse-soft": "pulseSoft 2s ease-in-out infinite",
        "spin-slow": "spin 1.4s linear infinite",
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        staggerIn: {
          "0%": { opacity: "0", transform: "translateY(8px) scale(0.98)" },
          "100%": { opacity: "1", transform: "translateY(0) scale(1)" },
        },
        pulseSoft: {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.55" },
        },
      },
      backgroundImage: {
        "checker":
          "linear-gradient(45deg, #1C1F28 25%, transparent 25%), linear-gradient(-45deg, #1C1F28 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #1C1F28 75%), linear-gradient(-45deg, transparent 75%, #1C1F28 75%)",
        "grid-faint":
          "linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)",
      },
      backgroundSize: {
        "checker": "16px 16px",
        "grid-faint": "32px 32px",
      },
    },
  },
  plugins: [],
};
