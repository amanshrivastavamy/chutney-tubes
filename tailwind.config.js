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
        ink: "var(--color-ink)",
        paper: "var(--color-paper)",
        "paper-2": "var(--color-paper-2)",
        "paper-3": "var(--color-paper-3)",
        leaf: "var(--color-leaf)",
        deepLeaf: "var(--color-deep-leaf)",
        haldi: "var(--color-haldi)",
        mirch: "var(--color-mirch)",
        steel: "var(--color-steel)",
        muted: "var(--color-muted)",
        rule: "var(--color-rule)",
        card: "var(--color-card)",
      },
      fontFamily: {
        heading: ["var(--font-display)", "sans-serif"],
        body: ["var(--font-body)", "sans-serif"],
        sans: ["var(--font-body)", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};
