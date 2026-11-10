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
        ink: "#18241b",
        paper: "#f4f3ec",
        leaf: "#1d6b3a",
        deepLeaf: "#134a28",
        haldi: "#f2b81d",
        mirch: "#c8361f",
        steel: "#d8dcd4",
      },
      fontFamily: {
        heading: ["'Bricolage Grotesque'", "sans-serif"],
        body: ["'Hind'", "sans-serif"],
        sans: ["'Hind'", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};
