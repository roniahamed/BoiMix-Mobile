/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: "class",
  content: [
    "./app/**/*.{js,jsx,ts,tsx}",
    "./components/**/*.{js,jsx,ts,tsx}",
    "./providers/**/*.{js,jsx,ts,tsx}",
  ],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        // BoiMix Brand Colors (Mirrors web frontend design-system.css)
        primary: {
          DEFAULT: "#0397D3",
          50: "#E8F7FD",
          100: "#BAE6FD",
          200: "#7DD3FC",
          300: "#38BDF8",
          400: "#0EA5E9",
          500: "#0397D3",
          600: "#027DB0",
          700: "#0369A1",
          800: "#075985",
          900: "#0B2A5B",
        },
        secondary: {
          DEFAULT: "#0B2A5B",
          light: "#1E3A8A",
          dark: "#081B3A",
        },
        accent: {
          DEFAULT: "#FF9900",
          light: "#FFB84D",
          dark: "#D98200",
          soft: "#FFF4E0",
        },
        surface: {
          DEFAULT: "#FFFFFF",
          dark: "#F1F2F4",
          card: "#FFFFFF",
          background: "#F1F2F4",
        },
        text: {
          primary: "#1F2933",
          secondary: "#666666",
          muted: "#9C9C9C",
          inverse: "#FFFFFF",
        },
        border: {
          DEFAULT: "#CDCDCD",
          light: "#E5E5E5",
        },
        success: {
          DEFAULT: "#33C24D",
          soft: "#EAF9ED",
        },
        warning: {
          DEFAULT: "#FF9900",
          soft: "#FFF4E0",
        },
        error: {
          DEFAULT: "#DC2626",
          soft: "#FEF2F2",
        },
        info: {
          DEFAULT: "#0397D3",
          soft: "#E8F7FD",
        },
      },
      fontFamily: {
        sans: ["System"],
        bengali: ["System"],
      },
      borderRadius: {
        card: "12px",
        button: "8px",
        badge: "6px",
      },
    },
  },
  plugins: [],
};
