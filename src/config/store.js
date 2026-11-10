// CommonJS mirror of store.ts for Node scripts and tests
const storeConfig = {
  brand: {
    name: "Chutney Tubes",
    shortName: "Chutney Tubes",
    tagline: "The chutney you love. Squeeze, eat, done.",
    subheadline: "Everyday Indian chutneys in squeezable tubes. Made in India.",
    netWeight: "100 g",
    diet: "100% Vegetarian",
    whatsAppNumber: "919876543210",
    contactEmail: "hello@chutneytubes.in",
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
    defaultVariant: "a",
    variants: {
      a: { id: "a", label: "Variant A (₹99)", single: 99, combo: 179, pick3: 269 },
      b: { id: "b", label: "Variant B (₹149)", single: 149, combo: 279, pick3: 399 },
      c: { id: "c", label: "Variant C (₹199)", single: 199, combo: 369, pick3: 529 },
    },
  },

  flavours: [
    {
      id: "green",
      name: "Chatpati Hari Chutney",
      local: "Pudina-Dhaniya",
      hindi: "चटपटी हरी",
      spice: 2,
      color: "#2f8f46",
      desc: "Mint and coriander with green chilli and lemon. Tangy, fresh, the one from every chaat stall.",
      goesWith: "Samosa, pakora, sandwiches",
      icons: ["leaf", "chilli"],
    },
    {
      id: "imli",
      name: "Khatti Meethi Imli Chutney",
      local: "Imli-Khajoor",
      hindi: "खट्टी मीठी इमली",
      spice: 1,
      color: "#7a4a25",
      desc: "Tamarind and dates with jaggery, sweet and tangy.",
      goesWith: "Chaat, samosa, dahi vada",
      icons: ["tamarind", "tamarind"],
    },
    {
      id: "saunth",
      name: "Teekhi Imli Saunth",
      local: "Tamarind-Dry Ginger",
      hindi: "तीखी इमली सौंठ",
      spice: 2,
      color: "#5e3a1e",
      desc: "Tamarind with dry ginger and spices, tangy with a kick.",
      goesWith: "Golgappe, aloo tikki, kachori",
      icons: ["tamarind", "chilli"],
    },
    {
      id: "coconut",
      name: "Coconut Chutney",
      local: "Nariyal",
      hindi: "नारियल",
      spice: 1,
      color: "#e9dfc4",
      desc: "Coconut and roasted chana dal with a curry leaf tadka.",
      goesWith: "Idli, dosa, vada",
      icons: ["coconut", "leaf"],
    },
    {
      id: "peanut",
      name: "Peanut Chutney",
      local: "Moongphali",
      hindi: "मूंगफली",
      spice: 2,
      color: "#b98a4a",
      desc: "Roasted peanuts with red chilli and a touch of tamarind.",
      goesWith: "Dosa, idli, upma",
      icons: ["peanut", "chilli"],
    },
    {
      id: "tomato",
      name: "Tomato Chutney",
      local: "Tamatar",
      hindi: "टमाटर",
      spice: 2,
      color: "#c8412f",
      desc: "Slow-cooked tomato with garlic and red chilli.",
      goesWith: "Dosa, paratha, rice",
      icons: ["tomato", "garlic"],
    },
    {
      id: "garlic",
      name: "Teekhi Lehsuni Chutney",
      local: "Garlic-Red Chilli",
      hindi: "तीखी लहसुनी",
      spice: 3,
      color: "#9e2b1a",
      desc: "Garlic pounded with red chilli. A small squeeze brings big heat.",
      goesWith: "Vada pav, roti, dal",
      icons: ["garlic", "chilli"],
    },
    {
      id: "thecha",
      name: "Chilli-Peanut Thecha",
      local: "Thecha",
      hindi: "ठेचा",
      spice: 3,
      color: "#3d6b1f",
      desc: "Coarse green chilli, garlic and roasted peanuts, Maharashtra style.",
      goesWith: "Bhakri, vada pav, rice",
      icons: ["greenchilli", "peanut"],
    },
    {
      id: "schezwan",
      name: "Schezwan Chutney",
      local: "Desi-Chinese",
      hindi: "शेज़वान",
      spice: 3,
      color: "#c23a1a",
      desc: "Red chilli, garlic and a little vinegar, the desi-Chinese favourite.",
      goesWith: "Fried rice, noodles, sandwiches",
      icons: ["chilli", "garlic"],
    },
    {
      id: "momo",
      name: "Momo Chutney",
      local: "Tomato-Chilli Dip",
      hindi: "मोमो",
      spice: 3,
      color: "#e0532f",
      desc: "Fiery tomato, red chilli and garlic, just like the momo stall's.",
      goesWith: "Momos, spring rolls, pakoras",
      icons: ["tomato", "chilli"],
    },
    {
      id: "mango",
      name: "Sweet Mango Chutney",
      local: "Aam ki Chutney",
      hindi: "मीठा आम",
      spice: 1,
      color: "#e8a317",
      desc: "Raw mango cooked sweet with a little spice.",
      goesWith: "Paratha, thepla, puri",
      icons: ["mango", "leaf"],
    },
    {
      id: "kasundi",
      name: "Aam Kasundi",
      local: "Mango-Mustard",
      hindi: "आम कासुंदी",
      spice: 2,
      color: "#a88a1c",
      desc: "Bengal's sharp mustard sauce with raw mango.",
      goesWith: "Fish fry, cutlets, momos, sandwiches",
      icons: ["mango", "mustard"],
    },
  ],

  packs: [
    {
      id: "single",
      name: "Single Tube",
      subtitle: "Choose any 1 flavour",
      description: "Pick your favourite everyday chutney for daily meals.",
    },
    {
      id: "combo",
      name: "Chaat Combo",
      subtitle: "Chatpati Hari + Khatti Meethi Imli",
      description: "The classic street-food pairing. One green, one sweet brown.",
      fixedFlavours: ["green", "imli"],
    },
    {
      id: "pick3",
      name: "Pick Any 3",
      subtitle: "Custom 3-flavour bundle",
      badge: "Best value",
      description: "Choose any 3 different flavours to build your custom tiffin box.",
    },
  ],

  postalZones: {
    "1": "Delhi, Haryana, Punjab, HP, J&K",
    "2": "Uttar Pradesh, Uttarakhand",
    "3": "Rajasthan, Gujarat",
    "4": "Maharashtra, MP, Chhattisgarh, Goa",
    "5": "Andhra, Telangana, Karnataka",
    "6": "Tamil Nadu, Kerala",
    "7": "West Bengal, Odisha, Northeast",
    "8": "Bihar, Jharkhand",
  },

  copy: {
    announcement: "Delivery across India · Cash on delivery available · 100% vegetarian",
    trustStrip: [
      { title: "Delivery across India", desc: "Covers all serviceable pin codes" },
      { title: "Cash on delivery", desc: "Pay when your package arrives" },
      { title: "100% vegetarian", desc: "Green veg mark on every tube" },
      { title: "Squeeze tube, no spill", desc: "Airtight flip-cap, zero mess" },
    ],
    hero: {
      headlinePart1: "Your favourite chutney, ",
      headlineHighlight: "now in a tube.",
      sub: "Hari, imli, schezwan, momo and more, in a squeezable tube. No spoon, no sticky jar, no spill.",
      exploreCta: "Explore the chutneys",
      packsCta: "Build your pack",
      smallCaps: "Twelve everyday favourites · Delivered across India",
    },
    catalogue: {
      h2: "The chutneys India eats every day",
      lede: "Twelve favourites, from the chaat stall to the momo cart to the dosa plate. Same taste you know, in a tube you can squeeze.",
      requestBoxHeading: "Want a chutney we don't have?",
      requestBoxLede: "Tell us which regional chutney you'd like to see in a tube.",
    },
    steps: {
      heading: "Pick. Squeeze. Enjoy.",
      sub: "Three simple steps for mess-free meals anywhere.",
      items: [
        { num: "1", title: "Pick", desc: "Choose any chutney, one tube or a pack." },
        { num: "2", title: "Squeeze", desc: "Flip the cap, squeeze onto roti, dosa, rice or pakora." },
        { num: "3", title: "Enjoy", desc: "Cap it, drop it in your bag, take it wherever you eat." },
      ],
    },
    comparison: {
      heading: "Why a tube?",
      sub: "Compare a squeezy tube with clumsy jars and messy sachets.",
      rows: [
        { factor: "No spoon needed", tube: "Yes", jar: "No", sachet: "Yes" },
        { factor: "Recloses after use", tube: "Yes", jar: "Yes", sachet: "No" },
        { factor: "Safe to carry in a bag", tube: "Yes", jar: "Risky", sachet: "Bursts" },
        { factor: "Take as little as you like", tube: "Yes", jar: "Hard without a spoon", sachet: "All or nothing" },
      ],
    },
    wherePeopleUseIt: [
      { title: "At home", text: "Keep it on the dining table or in the fridge. No dirty spoons in the jar." },
      { title: "At work", text: "Drops into your lunch bag or desk drawer. Zero oily leaks." },
      { title: "Travelling", text: "Train journeys, road trips and flights. Squeeze straight onto your snacks." },
      { title: "Hostel or PG", text: "Mess food getting boring? One squeeze brings real home-style punch." },
    ],
    faq: [
      {
        q: "Which chutneys do you have?",
        a: "We have 12 everyday Indian favourites: Chatpati Hari, Khatti Meethi Imli, Teekhi Imli Saunth, Coconut, Peanut, Tomato, Teekhi Lehsuni, Chilli-Peanut Thecha, Schezwan, Momo, Sweet Mango, and Aam Kasundi.",
      },
      {
        q: "Are they vegetarian? Jain-friendly?",
        a: "All our chutneys are 100% vegetarian. We will clearly mark Jain-friendly recipes without onion and garlic before commercial launch.",
      },
      {
        q: "How spicy are they?",
        a: "Every chutney is marked with a spice indicator: Mild (1), Medium (2), or Hot (3). From gentle Sweet Mango and Coconut to fiery Teekhi Lehsuni and Thecha, there is a level for everyone.",
      },
      {
        q: "How long do they last, and do I refrigerate after opening?",
        a: "We'll publish the full ingredient list, shelf life and storage instructions for every chutney before launch.",
      },
      {
        q: "Where do you deliver?",
        a: "We plan to deliver across India. Enter your pincode at checkout to view delivery confirmation.",
      },
    ],
  },
};

function getPostalZone(pincode) {
  if (!pincode || pincode.length < 1) return "Unknown";
  const firstDigit = pincode.charAt(0);
  return storeConfig.postalZones[firstDigit] || "Other India Zone";
}

function isValidPincode(pincode) {
  if (!pincode) return false;
  const clean = pincode.trim().replace(/\D/g, "");
  return /^[1-8]\d{5}$/.test(clean);
}

function formatInr(amount) {
  return "₹" + Number(amount).toLocaleString("en-IN");
}

module.exports = storeConfig;
module.exports.storeConfig = storeConfig;
module.exports.default = storeConfig;
module.exports.getPostalZone = getPostalZone;
module.exports.isValidPincode = isValidPincode;
module.exports.formatInr = formatInr;
