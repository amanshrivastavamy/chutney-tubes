/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    "./public/**/*.html",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          terracotta: "#C2410C",
          turmeric: "#D97706",
          mint: "#15803D",
          cream: "#FAF7F2",
          slate: "#1C1917",
        },
      },
      fontFamily: {
        sans: ["Plus Jakarta Sans", "system-ui", "sans-serif"],
        heading: ["Outfit", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};
