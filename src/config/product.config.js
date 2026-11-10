// Master Configuration for Pre-Launch Demand Testing
// Rename the brand or tweak flavors, packs, and prices here in one place.

const productConfig = {
  brand: {
    name: "Chutney Tubes",
    tagline: "Home-style Indian chutney in a squeezable, mess-free tube.",
    subheadline: "No spoons. No leaking dabbas. Fits right inside your tiffin bag or office drawer.",
    contactEmail: "hello@chutneytubes.example.com",
    supportCity: "Bengaluru, India",
    surveyDiscountPercent: 20,
    adminPassword: process.env.ADMIN_PASSWORD || "chutney2026",
  },

  theme: {
    name: "Indian Home Kitchen",
    colors: {
      primary: "#C2410C", // terracotta red / deep chilli
      primaryHover: "#9A3412",
      secondary: "#D97706", // warm turmeric ochre
      secondaryHover: "#B45309",
      accent: "#15803D", // garden mint green
      accentLight: "#DCFCE7",
      bgWarm: "#FAF7F2", // warm chai cream
      surface: "#FFFFFF",
      border: "#E7E5E4",
      textDark: "#1C1917",
      textMuted: "#57534E",
      highlight: "#FEF3C7", // golden haldi highlight
    },
    fonts: {
      heading: "system-ui, -apple-system, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
      body: "system-ui, -apple-system, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    },
  },

  // A/B/C Pricing test variants
  // Single tube vs 3-pack priced proportionally
  pricing: {
    defaultVariant: "A",
    variants: {
      A: {
        id: "A",
        label: "Variant A (₹99)",
        singlePrice: 99,
        threePackPrice: 249, // saving ₹48
        currencySymbol: "₹",
      },
      B: {
        id: "B",
        label: "Variant B (₹149)",
        singlePrice: 149,
        threePackPrice: 349, // saving ₹98
        currencySymbol: "₹",
      },
      C: {
        id: "C",
        label: "Variant C (₹199)",
        singlePrice: 199,
        threePackPrice: 449, // saving ₹148
        currencySymbol: "₹",
      },
    },
  },

  // Configurable list of flavours
  flavours: [
    {
      id: "tamarind",
      name: "Tamarind (Imli)",
      shortDesc: "Tangy, sweet, and slow-simmered with jaggery and roasted cumin.",
      fullDesc: "The classic street-food sweet chutney reimagined for your lunchbox. Crafted with real tamarind pulp and organic jaggery.",
      image: "/images/flavour-tamarind.svg",
      inStock: true,
      accentColor: "#9A3412",
      tag: "Tangy & Sweet",
      pairing: "Pairs with: Samosas, aloo parathas, dahi vada, kathi rolls",
    },
    {
      id: "garlic-chilli",
      name: "Garlic-Chilli",
      shortDesc: "Bold Kolhapuri-style fiery red chilli and roasted garlic kick.",
      fullDesc: "Intense, spicy, and smoky. Roasted garlic cloves blended with sun-dried red chillies for an authentic dhaba kick.",
      image: "/images/flavour-garlic.svg",
      inStock: true,
      accentColor: "#DC2626",
      tag: "Spicy Kick",
      pairing: "Pairs with: Thepla, dal-rice, sandwiches, vada pav",
    },
    {
      id: "mint-coriander",
      name: "Mint-Coriander",
      shortDesc: "Fresh street-style hari chutney with garden mint, green chillies & lemon.",
      fullDesc: "Vibrant emerald green, zesty, and refreshing. Packed with hand-picked mint leaves, fresh coriander, and a touch of roasted jeera.",
      image: "/images/flavour-mint.svg",
      inStock: true,
      accentColor: "#16A34A",
      tag: "Fresh & Zesty",
      pairing: "Pairs with: Grilled sandwiches, paneer wraps, pakoras, chaat",
    },
  ],

  // Pack options
  packs: [
    {
      id: "single",
      name: "Single Tube (150g)",
      subtitle: "Choose your favourite flavour",
      isBundle: false,
      badge: "Everyday Pack",
      benefit: "Fits easily into lunchboxes and desk drawers",
    },
    {
      id: "three_pack",
      name: "3-Flavour Tiffin Pack (3 x 150g)",
      subtitle: "All 3 flavours: Tamarind, Garlic-Chilli & Mint-Coriander",
      isBundle: true,
      badge: "Best Value",
      benefit: "One for home, one for office, one for snacks",
    },
  ],

  // Delivery check pincodes: Launch metro cities
  // Expand or edit as testing progresses
  launchPincodes: [
    // Bengaluru (560xxx)
    "560001", "560002", "560003", "560004", "560025", "560029", "560034", "560038", "560066", "560068", "560100", "560102", "560103",
    // Mumbai (400xxx)
    "400001", "400013", "400028", "400050", "400051", "400058", "400069", "400076", "400093",
    // Pune (411xxx)
    "411001", "411004", "411007", "411014", "411028", "411038", "411045", "411057",
    // Delhi NCR (110xxx, 122xxx, 201xxx)
    "110001", "110016", "110019", "110020", "110024", "110048", "110092", "122001", "122002", "122018", "201301", "201305",
    // Hyderabad (500xxx)
    "500001", "500032", "500034", "500081", "500082", "500084",
    // Chennai (600xxx)
    "600001", "600004", "600028", "600032", "600096", "600113",
    // Kolkata (700xxx)
    "700001", "700016", "700019", "700029", "700091"
  ],

  // Why a Tube? Comparison benefits table
  // Strictly benefits only, no unprovable claims
  tubeComparisons: [
    {
      factor: "Tiffin Bag Portability",
      tube: "Slim & pocket-sized; won't roll around or crack",
      jar: "Bulky glass; high risk of breaking inside your bag",
      sachet: "Flimsy; easy to puncture under heavy tiffin containers",
      dabba: "Bulky; prone to lid opening inside backpack",
    },
    {
      factor: "Mess & Leak Prevention",
      tube: "Airtight flip-cap; zero grease or oil leakage",
      jar: "Oil often seeps past rim screw threads",
      sachet: "Sticky once torn open; cannot be resealed",
      dabba: "Rubber seal degrades; leaks oily turmeric stains",
    },
    {
      factor: "Spoon Requirement",
      tube: "Zero spoons needed: squeeze straight onto food",
      jar: "Requires carrying a dedicated spoon to office",
      sachet: "No spoon, but messy tearing and finger contact",
      dabba: "Needs spoon or finger dipping at desk",
    },
    {
      factor: "Portion Control",
      tube: "Precision squeeze: get a teaspoon or a swirl",
      jar: "Hard to measure without dripping",
      sachet: "All-or-nothing squeeze; squirts unpredictably",
      dabba: "Messy scooping; ends up smearing edges",
    },
    {
      factor: "Resealability After Lunch",
      tube: "Snap the cap shut; stays clean in your drawer",
      jar: "Sticky rim after closing",
      sachet: "Cannot be resealed; discarded or leaves stains",
      dabba: "Lid needs forceful realignment",
    },
  ],

  // How it works 3 simple steps
  steps: [
    {
      number: "1",
      title: "Unpack Your Lunch",
      description: "Pull out your paratha, roll, sandwich, or tiffin at your desk.",
    },
    {
      number: "2",
      title: "Flip & Squeeze",
      description: "Flip the cap open and squeeze the exact swirl of chutney you desire.",
    },
    {
      number: "3",
      title: "Snap Shut & Enjoy",
      description: "Snap the cap closed. No spoon to wash, no oily bag to wipe.",
    },
  ],

  // FAQ with explicit TBD markers for unverified specifications
  faq: [
    {
      q: "What is the expected shelf life?",
      a: "[TBD: Laboratory shelf-life testing currently in progress with our food technologist. Target ambient shelf-life is 4 to 6 months unopened.]",
    },
    {
      q: "Does it need refrigeration after opening?",
      a: "[TBD: Testing stability under typical Indian office and ambient temperatures. We currently recommend keeping refrigerated after opening for maximum fresh herb aroma.]",
    },
    {
      q: "What ingredients are used?",
      a: "[TBD: Formulation in validation phase. Recipes focus on traditional pantry ingredients (tamarind, jaggery, fresh herbs, roasted cumin, mustard seeds, cold-pressed oil). Full certified FSSAI nutritional panel will be published before the first commercial batch.]",
    },
    {
      q: "Which cities will you deliver to?",
      a: "[TBD: Phase 1 pilot dispatch is planned for select metro pincodes across Bengaluru, Mumbai, Delhi NCR, Pune, Hyderabad, and Chennai. Check your pincode at checkout to view current status.]",
    },
    {
      q: "How does this pre-launch order work?",
      a: "This is an early interest validation preview. No payment is processed, and your card or UPI details are never requested. Registering your preference reserves your spot and unlocks a 20% launch-day discount if we go into production.",
    },
  ],
};

module.exports = productConfig;
