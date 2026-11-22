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
        // BoiMix Brand Colors
        primary: {
          DEFAULT: "#E84C1E",
          50: "#FEF0EB",
          100: "#FDD5C8",
          200: "#FAA892",
          300: "#F77A5C",
          400: "#F44D26",
          500: "#E84C1E",
          600: "#C43A13",
          700: "#9A2C0E",
          800: "#701E09",
          900: "#461205",
        },
        secondary: {
          DEFAULT: "#1A1A2E",
          light: "#16213E",
        },
        surface: {
          DEFAULT: "#FFFFFF",
          dark: "#F5F5F5",
          card: "#FAFAFA",
        },
        text: {
          primary: "#1A1A2E",
          secondary: "#6B7280",
          muted: "#9CA3AF",
          inverse: "#FFFFFF",
        },
        border: {
          DEFAULT: "#E5E7EB",
          light: "#F3F4F6",
        },
        success: "#10B981",
        warning: "#F59E0B",
        error: "#EF4444",
        info: "#3B82F6",
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
