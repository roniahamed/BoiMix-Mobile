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
        sell: "#006B32",
        exchange: "#006B32",
        borrow: "#8B5CF6",
        library: "#D98200",
        // BoiMix brand palette
        primary: {
          DEFAULT: "#006B32",
          50: "#E1F1DF",
          100: "#CFE7CE",
          200: "#A8D7AD",
          300: "#46A66A",
          400: "#278B4E",
          500: "#006B32",
          600: "#005126",
          700: "#005B2D",
          800: "#074824",
          900: "#103B24",
        },
        secondary: {
          DEFAULT: "#103B24",
          light: "#27573A",
          dark: "#092A18",
        },
        accent: {
          DEFAULT: "#FF9900",
          light: "#FFB84D",
          dark: "#D98200",
          soft: "#FFF4E0",
        },
        surface: {
          DEFAULT: "#FFFFFF",
          dark: "#F8F6F0",
          card: "#FFFFFF",
          background: "#F8F6F0",
        },
        text: {
          primary: "#17271D",
          secondary: "#59645C",
          muted: "#89928B",
          inverse: "#FFFFFF",
        },
        border: {
          DEFAULT: "#DEDCD3",
          light: "#EAE8E0",
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
          DEFAULT: "#006B32",
          soft: "#E1F1DF",
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
