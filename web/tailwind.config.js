/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: "#5C9EAD",
          50: "#f0f8f9",
          100: "#d9eef0",
          200: "#b3dde1",
          300: "#8dc7cd",
          400: "#5C9EAD",
          500: "#3d7a87",
          600: "#2d5d68",
          700: "#1f4249",
          800: "#102830",
          900: "#081418",
        },
        accent: "#9CDB89",
        warm: "#E0B450",
        danger: "#C84B31",
      },
      animation: {
        "fade-in": "fadeIn 0.4s ease-out",
        "slide-up": "slideUp 0.5s ease-out",
        "scale-in": "scaleIn 0.3s ease-out",
        "pulse-soft": "pulseSoft 2s ease-in-out infinite",
        shimmer: "shimmer 2s linear infinite",
      },
      keyframes: {
        fadeIn: { from: { opacity: "0" }, to: { opacity: "1" } },
        slideUp: {
          from: { opacity: "0", transform: "translateY(12px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        scaleIn: {
          from: { opacity: "0", transform: "scale(0.95)" },
          to: { opacity: "1", transform: "scale(1)" },
        },
        pulseSoft: { "0%, 100%": { opacity: "1" }, "50%": { opacity: "0.7" } },
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
      },
    },
  },
  plugins: [],
};
