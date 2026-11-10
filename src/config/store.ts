// Single Source of Truth for Chutney Tubes Business Settings & Copy

export interface FlavourItem {
  id: string;
  name: string;
  local: string;
  hindi: string;
  spice: 1 | 2 | 3; // 1 mild, 2 medium, 3 hot
  color: string;
  desc: string;
  goesWith: string;
  icons: string[];
  unitPrice: number;
}

export interface ComingSoonItem {
  id: string;
  name: string;
  hindi: string;
  desc: string;
  spice: 1 | 2 | 3;
  color: string;
}

export interface PackItem {
  id: string;
  name: string;
  subtitle: string;
  badge?: string;
  price: number;
  description: string;
  flavourIds: string[];
}

export interface PostalZoneMap {
  [key: string]: string;
}

export const storeConfig = {
  brand: {
    name: "Chutney Tubes",
    shortName: "Chutney Tubes",
    tagline: "Your favourite chutneys, now in a squeeze tube.",
    subheadline:
      "Ketchup, mayo, Schezwan, hari and imli. No spoon, no spill, no sticky jar. Just squeeze it onto whatever you're eating.",
    netWeight: "100 g",
    packagingFact: "100 g squeeze tube with flip-top cap",
    diet: "100% Vegetarian & Eggless",
    whatsAppNumber: "918224089868", // Empty string "" hides all WhatsApp buttons
    contactEmail: "hello@chutneytubes.in", // Empty string "" hides contact email
    supportCity: "Bengaluru, Karnataka, India",
    surveyDiscountPercent: 20,
    copyright: "© 2026 Chutney Tubes",
  },

  designTokens: {
    colors: {
      ink: "#18241b",
      paper: "#f4f3ec",
      leaf: "#1d6b3a",
      deepLeaf: "#134a28",
      haldi: "#f2b81d",
      mirch: "#c8361f",
      steel: "#d8dcd4",
    },
    fonts: {
      heading: "'Bricolage Grotesque', sans-serif",
      body: "'Hind', sans-serif",
    },
  },

  pricing: {
    singleTubePrice: 99,
  },

  // 8 Active Everyday Squeeze Tubes (All ₹99, 100g, Vegetarian & Eggless)
  flavours: [
    {
      id: "masala-ketchup",
      name: "Masala Tomato Ketchup",
      local: "Desi Ketchup",
      hindi: "मसाला टोमैटो केचप",
      spice: 1,
      color: "#c8361f",
      desc: "Ripe tomatoes blended with warm Indian spices. Sweet, tangy, with a punchy desi twist.",
      goesWith: "Samosa, fries, rolls, paratha",
      icons: ["tomato", "spice"],
      unitPrice: 99,
    },
    {
      id: "tandoori-mayo",
      name: "Tandoori Mayo",
      local: "Smoky Mayo",
      hindi: "तंदूरी मेयो",
      spice: 2,
      color: "#e05e19",
      desc: "Creamy eggless mayo infused with smoky tandoori spices and roasted cumin.",
      goesWith: "Wraps, sandwiches, fries, rolls",
      icons: ["mayo", "tandoor"],
      unitPrice: 99,
    },
    {
      id: "mint-mayo",
      name: "Mint Mayo",
      local: "Pudina Mayo",
      hindi: "मिंट मेयो",
      spice: 1,
      color: "#2e8540",
      desc: "Cool mint and fresh coriander blended with smooth eggless mayo. Herbaceous and refreshing.",
      goesWith: "Sandwiches, wraps, rolls, snacks",
      icons: ["leaf", "mayo"],
      unitPrice: 99,
    },
    {
      id: "garlic-mayo",
      name: "Garlic Mayo",
      local: "Lehsuni Mayo",
      hindi: "गार्लिक मेयो",
      spice: 1,
      color: "#dfd6be",
      desc: "Rich, velvety eggless mayo whipped with slow-roasted mellow garlic.",
      goesWith: "Momos, fries, wraps, sandwiches",
      icons: ["garlic", "mayo"],
      unitPrice: 99,
    },
    {
      id: "schezwan-sauce",
      name: "Schezwan Sauce",
      local: "Desi-Chinese",
      hindi: "शेज़वान सॉस",
      spice: 3,
      color: "#9b1812",
      desc: "Fiery red chillies, garlic and toasted spices with an unmistakable desi-Chinese bite.",
      goesWith: "Noodles, fried rice, momos, spring rolls",
      icons: ["chilli", "garlic"],
      unitPrice: 99,
    },
    {
      id: "chilli-garlic",
      name: "Red Chilli-Garlic Sauce",
      local: "Hot Garlic Dip",
      hindi: "रेड चिली-गार्लिक सॉस",
      spice: 3,
      color: "#dc2626",
      desc: "Pounded red chillies and pungent garlic simmered into a spicy, zesty dipping sauce.",
      goesWith: "Momos, pakoras, noodles, rolls",
      icons: ["chilli", "garlic"],
      unitPrice: 99,
    },
    {
      id: "hari-chutney",
      name: "Hari Chutney",
      local: "Pudina-Dhaniya",
      hindi: "हरी चटनी",
      spice: 2,
      color: "#1d6b3a",
      desc: "Fresh mint and coriander pounded with green chilli, cumin and lemon. Pure street chaat nostalgia.",
      goesWith: "Samosa, pakora, paratha, sandwiches",
      icons: ["leaf", "chilli"],
      unitPrice: 99,
    },
    {
      id: "imli-chutney",
      name: "Khatti-Meethi Imli Chutney",
      local: "Tamarind-Jaggery",
      hindi: "खट्टी-मीठी इमली चटनी",
      spice: 1,
      color: "#6f3c1d",
      desc: "Slow-simmered tamarind and jaggery balanced with roasted cumin and dry ginger. Sweet and tangy.",
      goesWith: "Chaat, samosa, dahi vada, kachori",
      icons: ["tamarind", "spice"],
      unitPrice: 99,
    },
  ] as FlavourItem[],

  // Coming Soon Flavours (with "Notify me" demand capture)
  comingSoon: [
    {
      id: "teekhi-lehsuni",
      name: "Teekhi Lehsuni Chutney",
      hindi: "तीखी लहसुनी",
      desc: "Fresh garlic pounded with roasted red chillies and cumin. Fiery street-side punch.",
      spice: 3,
      color: "#a8201a",
    },
    {
      id: "momo-chutney",
      name: "Momo Chutney",
      hindi: "मोमो चटनी",
      desc: "Steamed red chillies, garlic and ripe tomatoes. The real roadside momo taste.",
      spice: 3,
      color: "#d84315",
    },
    {
      id: "sweet-mango",
      name: "Sweet Mango Chutney",
      hindi: "मीठा आम",
      desc: "Sun-ripened mango slow-cooked with cardamom and mild spices.",
      spice: 1,
      color: "#f59e0b",
    },
  ] as ComingSoonItem[],

  // 4 Packs (Curated value bundles)
  packs: [
    {
      id: "chaat-pair",
      name: "Chaat Pair",
      subtitle: "Hari Chutney + Khatti-Meethi Imli Chutney",
      price: 179,
      flavourIds: ["hari-chutney", "imli-chutney"],
      description: "The iconic street-food duo. One tangy green, one sweet-sour tamarind.",
    },
    {
      id: "desi-chinese-pair",
      name: "Desi-Chinese Pair",
      subtitle: "Schezwan Sauce + Red Chilli-Garlic Sauce",
      price: 179,
      flavourIds: ["schezwan-sauce", "chilli-garlic"],
      description: "The ultimate street-style Chinese pair for noodles, momos and fried rice.",
    },
    {
      id: "mayo-trio",
      name: "Mayo Trio",
      subtitle: "Tandoori Mayo + Mint Mayo + Garlic Mayo",
      badge: "Popular",
      price: 269,
      flavourIds: ["tandoori-mayo", "mint-mayo", "garlic-mayo"],
      description: "Three creamy, 100% vegetarian & eggless spreads for wraps, sandwiches and fries.",
    },
    {
      id: "sampler-8",
      name: "Try-All-8 Sampler",
      subtitle: "One tube of each flavour",
      badge: "Best value",
      price: 699,
      flavourIds: [
        "masala-ketchup",
        "tandoori-mayo",
        "mint-mayo",
        "garlic-mayo",
        "schezwan-sauce",
        "chilli-garlic",
        "hari-chutney",
        "imli-chutney",
      ],
      description: "The complete collection. Taste all 8 sauces and chutneys with family and friends.",
    },
  ] as PackItem[],

  // Indian Delivery Regions Derived from first digit of 6-digit PIN Code
  postalZones: {
    "1": "Delhi, Haryana, Punjab, HP, J&K",
    "2": "Uttar Pradesh, Uttarakhand",
    "3": "Rajasthan, Gujarat",
    "4": "Maharashtra, MP, Chhattisgarh, Goa",
    "5": "Andhra, Telangana, Karnataka",
    "6": "Tamil Nadu, Kerala",
    "7": "West Bengal, Odisha, Northeast",
    "8": "Bihar, Jharkhand",
  } as PostalZoneMap,

  // Copy Strings
  copy: {
    announcement: "Delivery across India · Free delivery on all orders · 100% vegetarian & eggless",
    trustStrip: [
      { title: "Delivery across India", desc: "Free delivery to all serviceable pin codes" },
      { title: "Cash on delivery", desc: "Pay when your package arrives" },
      { title: "100% vegetarian & eggless", desc: "Green veg mark on every tube" },
      { title: "Squeeze tube, no spill", desc: "100 g squeeze tube with flip-top cap" },
    ],
    hero: {
      headlinePart1: "Your favourite chutneys, ",
      headlineHighlight: "now in a squeeze tube.",
      sub: "Ketchup, mayo, Schezwan, hari and imli. No spoon, no spill, no sticky jar. Just squeeze it onto whatever you're eating.",
      everyBiteStrip:
        "Paratha at breakfast · Samosa with chai · Noodles and momos at night · Rolls on the go · Tiffin at school or work · Sandwiches on a trip",
      exploreCta: "Shop the tubes",
      packsCta: "View value packs",
      smallCaps: "Eight everyday favourites · Free delivery across India",
    },
    catalogue: {
      h2: "Everyday flavours in a no-spill squeeze tube",
      lede: "From samosas and parathas to noodles and momos. Same taste you love, now in a clean 100 g squeeze tube with flip-top cap.",
      comingSoonHeading: "Coming soon to the line-up",
      comingSoonLede: "Click Notify Me to vote for the next flavour we produce.",
    },
    steps: {
      heading: "Pick. Squeeze. Enjoy.",
      sub: "Three simple steps for mess-free meals anywhere.",
      items: [
        {
          num: "1",
          title: "Pick",
          desc: "Choose any sauce or chutney, a single tube or a value pack.",
        },
        {
          num: "2",
          title: "Squeeze",
          desc: "Flip the cap, squeeze onto parathas, snacks, noodles or rolls.",
        },
        {
          num: "3",
          title: "Enjoy",
          desc: "Snap the cap shut, pack it in your tiffin or travel bag, and enjoy.",
        },
      ],
    },
    comparison: {
      heading: "Why a squeeze tube?",
      sub: "Compare a clean squeeze tube with clumsy glass jars and leaky packets.",
      rows: [
        { factor: "No spoon needed", tube: "Yes", jar: "No", sachet: "Yes" },
        { factor: "Recloses after use", tube: "Yes", jar: "Yes", sachet: "No" },
        { factor: "Safe to carry in a bag", tube: "Yes", jar: "Risky", sachet: "Bursts easily" },
        { factor: "Take as little as you like", tube: "Yes", jar: "Hard without a spoon", sachet: "All or nothing" },
      ],
    },
    wherePeopleUseIt: [
      { title: "At home", text: "Keep it on the dining table or in the fridge. No dirty spoons in the jar." },
      { title: "In daily tiffins", text: "Tucks neatly inside lunchboxes. Clean flip-top cap keeps bags spot-free." },
      { title: "Travelling", text: "Train journeys, road trips and flights. Squeeze straight onto snacks and meals." },
      { title: "Hostel or PG", text: "Mess food getting plain? One quick squeeze brings real flavour." },
    ],
    faq: [
      {
        q: "Which sauces and chutneys do you offer?",
        a: "We have 8 everyday favourites: Masala Tomato Ketchup, Tandoori Mayo, Mint Mayo, Garlic Mayo, Schezwan Sauce, Red Chilli-Garlic Sauce, Hari Chutney, and Khatti-Meethi Imli Chutney. Three more flavours are coming soon: Teekhi Lehsuni, Momo Chutney, and Sweet Mango Chutney.",
      },
      {
        q: "Are they 100% vegetarian and eggless?",
        a: "Yes. All our chutneys, sauces, and mayos are 100% vegetarian and 100% eggless, carrying the green veg mark.",
      },
      {
        q: "What is the packaging format?",
        a: "Each product comes in a 100 g squeeze tube with flip-top cap. It is no spoon, no spill, and easy to carry anywhere.",
      },
      {
        q: "How much does delivery cost?",
        a: "Delivery is completely free across India on all orders.",
      },
      {
        q: "Where do you deliver?",
        a: "We offer delivery across India. Enter your 6-digit pincode at checkout for instant confirmation.",
      },
    ],
  },
};

// Helper to determine Postal Zone from Pincode
export function getPostalZone(pincode: string): string {
  if (!pincode || pincode.length < 1) return "Unknown";
  const firstDigit = pincode.charAt(0);
  return storeConfig.postalZones[firstDigit] || "India";
}

// Helper to validate Indian Pincode (6 digits, starts with 1-8)
export function isValidPincode(pincode: string): boolean {
  if (!pincode) return false;
  const clean = pincode.trim().replace(/\D/g, "");
  return /^[1-8]\d{5}$/.test(clean);
}

// Indian Number Currency Formatter
export function formatInr(amount: number): string {
  return "₹" + amount.toLocaleString("en-IN");
}

export default storeConfig;
