// Legacy configuration sanitized for tests and compatibility
const productConfig = {
  brand: {
    name: "Chutney Tubes",
    tagline: "Your favourite chutneys, now in a squeeze tube.",
    subheadline: "Ketchup, mayo, Schezwan, hari and imli. No spoon, no spill, no sticky jar.",
    contactEmail: "hello@chutneytubes.in",
    supportCity: "Bengaluru, India",
    surveyDiscountPercent: 20,
    adminPassword: process.env.ADMIN_PASSWORD,
  },

  theme: {
    name: "Indian Home Kitchen",
    colors: {
      primary: "#C2410C",
      primaryHover: "#9A3412",
      secondary: "#D97706",
      secondaryHover: "#B45309",
      accent: "#15803D",
      accentLight: "#DCFCE7",
      bgWarm: "#FAF7F2",
      surface: "#FFFFFF",
      border: "#E7E5E4",
      textDark: "#1C1917",
      textMuted: "#57534E",
      highlight: "#FEF3C7",
    },
    fonts: {
      heading: "system-ui, -apple-system, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
      body: "system-ui, -apple-system, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    },
  },

  pricing: {
    defaultVariant: "A",
    variants: {
      A: { id: "A", label: "Single (₹99)", singlePrice: 99, threePackPrice: 269, currencySymbol: "₹" },
    },
  },

  flavours: [
    {
      id: "masala-ketchup",
      name: "Masala Tomato Ketchup",
      shortDesc: "Ripe tomatoes with warm Indian spices",
      fullDesc: "Ripe tomatoes blended with warm Indian spices. Sweet, tangy, with a punchy desi twist.",
      image: "/products/masala-ketchup.jpg",
      inStock: true,
      accentColor: "#c8361f",
      tag: "Mild",
      pairing: "Samosa, fries, rolls, paratha",
    },
  ],

  packs: [
    {
      id: "sampler-8",
      name: "Try-All-8 Sampler",
      subtitle: "One tube of each flavour",
      isBundle: true,
      badge: "Best value",
      benefit: "Taste all 8 sauces and chutneys with family and friends",
    },
  ],

  launchPincodes: ["560001", "560034", "110001", "400001"],
  tubeComparisons: [],
  steps: [],
  faq: [],
};

module.exports = productConfig;
module.exports.default = productConfig;
