/**
 * Production-Ready Standalone Server for Chutney Tubes
 * Pure Node.js runner with zero external dependencies.
 * Hallmark Design System compliant: Stage Hero, Squeeze Simulator, 12 Flavours,
 * Packaging Anatomy, Why a Tube matrix, Mock Checkout & Honest Reveal.
 */

const http = require("http");
const fs = require("fs");
const path = require("path");

const { storeConfig, getPostalZone, isValidPincode, formatInr } = require("./src/config/store.js");
const { calculateDashboardMetrics } = require("./src/lib/metrics.js");

const PORT = process.env.PORT || 3000;
const DATA_DIR = path.join(__dirname, "data");
const EVENTS_FILE = path.join(DATA_DIR, "events.json");
const SIGNUPS_FILE = path.join(DATA_DIR, "signups.json");
const REQUESTS_FILE = path.join(DATA_DIR, "requests.json");
const PUBLIC_DIR = path.join(__dirname, "public");

// Ensure data files exist
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
if (!fs.existsSync(EVENTS_FILE)) fs.writeFileSync(EVENTS_FILE, "[]", "utf-8");
if (!fs.existsSync(SIGNUPS_FILE)) fs.writeFileSync(SIGNUPS_FILE, "[]", "utf-8");
if (!fs.existsSync(REQUESTS_FILE)) fs.writeFileSync(REQUESTS_FILE, "[]", "utf-8");

function readJsonFile(fp) {
  try {
    return JSON.parse(fs.readFileSync(fp, "utf-8") || "[]");
  } catch (e) {
    return [];
  }
}

function writeJsonFile(fp, data) {
  try {
    fs.writeFileSync(fp, JSON.stringify(data, null, 2), "utf-8");
  } catch (e) {
    console.error("Write file error:", e);
  }
}

function escapeCsv(val) {
  if (val === undefined || val === null) return '""';
  return '"' + String(val).replace(/"/g, '""') + '"';
}

function generateEventsCsv(events) {
  const headers = [
    "Timestamp", "Event", "Visitor_ID", "Session_ID", "Price_Variant",
    "Is_Internal", "UTM_Source", "UTM_Campaign", "Kind", "Flavours",
    "Quantity", "Total_Amount", "Postal_Zone", "Pincode_Prefix",
    "Payment_Method", "Tube_Feeling", "What_Stopped_You", "Usage_Frequency",
  ];
  const rows = events.map((ev) => {
    const p = ev.payload || {};
    const utm = ev.utm || {};
    return [
      escapeCsv(ev.timestamp),
      escapeCsv(ev.event),
      escapeCsv(ev.visitorId),
      escapeCsv(ev.sessionId),
      escapeCsv(ev.variant),
      escapeCsv(ev.isInternal ? "true" : "false"),
      escapeCsv(utm.utm_source),
      escapeCsv(utm.utm_campaign),
      escapeCsv(p.kind),
      escapeCsv(Array.isArray(p.flavours) ? p.flavours.join(";") : p.flavour),
      escapeCsv(p.qty || p.quantity),
      escapeCsv(p.total || p.unitPrice),
      escapeCsv(p.zone),
      escapeCsv(p.pinPrefix),
      escapeCsv(p.method || p.paymentMethod),
      escapeCsv(p.tubeFeeling),
      escapeCsv(p.stoppedText),
      escapeCsv(p.frequency),
    ].join(",");
  });
  return [headers.join(","), ...rows].join("\\r\\n");
}

function generateSignupsCsv(signups) {
  const headers = ["Timestamp", "Email", "Price_Variant", "Campaign", "Visitor_ID"];
  const rows = signups.map((s) => [
    escapeCsv(s.timestamp),
    escapeCsv(s.email),
    escapeCsv(s.variant),
    escapeCsv(s.utm_campaign),
    escapeCsv(s.visitorId),
  ].join(","));
  return [headers.join(","), ...rows].join("\\r\\n");
}

// Taste Profile metadata for modal
const TASTE_PROFILES = {
  green: { tangy: 8, heat: 6, sweet: 2, punch: 9, notes: "Zesty, fresh mint-coriander with chaat-stall lemon kick", keyIngredients: "Fresh Mint (36%), Coriander (24%), Green Chilli, Lemon, Rock Salt, Cumin", calories: "~11 kcal per 15g squeeze" },
  imli: { tangy: 7, heat: 2, sweet: 8, punch: 8, notes: "Sweet jaggery with aged tamarind and roasted cumin warmth", keyIngredients: "Tamarind Pulp (32%), Organic Jaggery, Dates, Roasted Jeera, Saunf, Ginger", calories: "~16 kcal per 15g squeeze" },
  saunth: { tangy: 7, heat: 6, sweet: 5, punch: 8, notes: "Classic golgappe chutney with spicy dry ginger warmth", keyIngredients: "Tamarind, Sonth (Dry Ginger), Black Pepper, Kala Namak, Jaggery", calories: "~14 kcal per 15g squeeze" },
  coconut: { tangy: 2, heat: 4, sweet: 3, punch: 7, notes: "Creamy grated coconut with roasted chana and mustard-curry leaf tadka", keyIngredients: "Grated Coconut (45%), Roasted Chana Dal, Green Chilli, Mustard Seeds, Curry Leaves", calories: "~24 kcal per 15g squeeze" },
  peanut: { tangy: 3, heat: 6, sweet: 2, punch: 8, notes: "Nutty roasted peanuts with garlic and red chilli, thick and rich", keyIngredients: "Roasted Peanuts (52%), Garlic, Red Chilli, Cumin, Rock Salt", calories: "~38 kcal per 15g squeeze" },
  tomato: { tangy: 8, heat: 5, sweet: 4, punch: 7, notes: "South-Indian tiffin style tangy ripe tomato and onion relish", keyIngredients: "Ripe Tomatoes (55%), Shallots, Dry Red Chilli, Mustard Seeds, Hing", calories: "~13 kcal per 15g squeeze" },
  garlic: { tangy: 4, heat: 9, sweet: 1, punch: 10, notes: "Fiery Maharashtrian roasted garlic paste with red chilli punch", keyIngredients: "Country Garlic (42%), Guntur Chilli, Cumin, Mustard Oil, Sea Salt", calories: "~18 kcal per 15g squeeze" },
  thecha: { tangy: 5, heat: 10, sweet: 1, punch: 10, notes: "Authentic Kolhapuri style coarse green chilli and peanut blast", keyIngredients: "Green Lavangi Chillies (50%), Roasted Peanuts, Garlic, Cumin, Rock Salt", calories: "~22 kcal per 15g squeeze" },
  schezwan: { tangy: 7, heat: 8, sweet: 4, punch: 9, notes: "Desi Indo-Chinese street-style fiery chilli-garlic glaze", keyIngredients: "Kashmiri Chilli, Ginger, Garlic, Szechuan Peppercorns, Soya Sauce, Vinegar", calories: "~19 kcal per 15g squeeze" },
  momo: { tangy: 8, heat: 9, sweet: 3, punch: 9, notes: "Delhi street stall red chilli and tomato dipping glaze", keyIngredients: "Red Bird-Eye Chilli, Fresh Tomatoes, Garlic, White Pepper, Vinegar", calories: "~12 kcal per 15g squeeze" },
  mango: { tangy: 6, heat: 2, sweet: 9, punch: 7, notes: "Golden Alphonso mango preserves with roasted kalonji and cardamom", keyIngredients: "Alphonso Mango Pulp (50%), Raw Sugar, Kalonji (Nigella), Cardamom, Red Chilli", calories: "~28 kcal per 15g squeeze" },
  kasundi: { tangy: 9, heat: 7, sweet: 2, punch: 10, notes: "Traditional Bengali fermented pungent mustard relish with green mango", keyIngredients: "Black & Yellow Mustard Seeds (48%), Raw Green Mango, Mustard Oil, Haldi, Sea Salt", calories: "~31 kcal per 15g squeeze" },
};

// Map of custom front-of-pack label typography, motifs and colors per flavour
function getFlavourLabelData(f) {
  const map = {
    green: {
      bigTitle: "HARI",
      subTitle: "CHATPATI PUDINA",
      pairing: "MINT & CORIANDER",
      hindiFull: "चटपटी हरी • चटनी",
      spiceLabel: "● ● ○ MEDIUM HEAT",
      capGrad: "capYellow",
      accent: "#f2b81d",
      iconType: "mint_chilli",
    },
    imli: {
      bigTitle: "IMLI",
      subTitle: "KHATTI MEETHI",
      pairing: "TAMARIND & DATES",
      hindiFull: "खट्टी मीठी इमली",
      spiceLabel: "● ○ ○ SWEET & TANGY",
      capGrad: "capYellow",
      accent: "#f2b81d",
      iconType: "tamarind_dates",
    },
    saunth: {
      bigTitle: "SAUNTH",
      subTitle: "TEEKHI IMLI",
      pairing: "TAMARIND & GINGER",
      hindiFull: "तीखी इमली सौंठ",
      spiceLabel: "● ● ○ TANGY ZING",
      capGrad: "capYellow",
      accent: "#f2b81d",
      iconType: "ginger_chilli",
    },
    coconut: {
      bigTitle: "COCONUT",
      subTitle: "FRESH NARIYAL",
      pairing: "CURRY LEAF TADKA",
      hindiFull: "नारियल चटनी",
      spiceLabel: "● ○ ○ GENTLE TASTE",
      capGrad: "capGreen",
      accent: "#1d6b3a",
      iconType: "coconut_leaf",
    },
    peanut: {
      bigTitle: "PEANUT",
      subTitle: "SHENGDANA CHILLI",
      pairing: "ROASTED GARLIC",
      hindiFull: "मूंगफली चटनी",
      spiceLabel: "● ● ○ NUTTY CRUNCH",
      capGrad: "capYellow",
      accent: "#f2b81d",
      iconType: "peanut_garlic",
    },
    tomato: {
      bigTitle: "TOMATO",
      subTitle: "TAMATAR-PYAAZ",
      pairing: "SHALLOT & MUSTARD",
      hindiFull: "टमाटर प्याज़ चटनी",
      spiceLabel: "● ● ○ SOUTH TIFFIN",
      capGrad: "capYellow",
      accent: "#f2b81d",
      iconType: "tomato_chilli",
    },
    garlic: {
      bigTitle: "LEHSUNI",
      subTitle: "TEEKHI GARLIC",
      pairing: "FIERY RED CHILLI",
      hindiFull: "तीखी लहसुनी चटनी",
      spiceLabel: "● ● ● EXTRA TEEKHA",
      capGrad: "capRed",
      accent: "#f2b81d",
      iconType: "garlic_chilli",
    },
    thecha: {
      bigTitle: "THECHA",
      subTitle: "KOLHAPURI GREEN",
      pairing: "CHILLI & PEANUT",
      hindiFull: "कोल्हापुरी ठेचा",
      spiceLabel: "● ● ● FIERY CRUSH",
      capGrad: "capRed",
      accent: "#f2b81d",
      iconType: "chilli_peanut",
    },
    schezwan: {
      bigTitle: "SCHEZWAN",
      subTitle: "DESI STREET",
      pairing: "STREET BURST",
      hindiFull: "देसी शेज़वान चटनी",
      spiceLabel: "● ● ● FIERY GLAZE",
      capGrad: "capRed",
      accent: "#f2b81d",
      iconType: "schezwan_burst",
    },
    momo: {
      bigTitle: "MOMO",
      subTitle: "STREET CHILLI",
      pairing: "TOMATO GLAZE",
      hindiFull: "तीखी मोमो चटनी",
      spiceLabel: "● ● ● EXTRA HOT",
      capGrad: "capRed",
      accent: "#f2b81d",
      iconType: "momo_chilli",
    },
    mango: {
      bigTitle: "AAM",
      subTitle: "SWEET MANGO",
      pairing: "ALPHONSO & KALONJI",
      hindiFull: "मीठा आम चटनी",
      spiceLabel: "● ○ ○ SWEET CHATPATA",
      capGrad: "capYellow",
      accent: "#f2b81d",
      iconType: "mango_spice",
    },
    kasundi: {
      bigTitle: "KASUNDI",
      subTitle: "AAM MUSTARD",
      pairing: "RAW MANGO MUSTARD",
      hindiFull: "आम कासुंदी",
      spiceLabel: "● ● ○ PUNGENT ZING",
      capGrad: "capYellow",
      accent: "#f2b81d",
      iconType: "mustard_mango",
    },
  };

  return map[f.id] || {
    bigTitle: f.name.split(" ")[0].toUpperCase(),
    subTitle: f.local.toUpperCase(),
    pairing: "HOMESTYLE TASTE",
    hindiFull: f.hindi + " चटनी",
    spiceLabel: f.spice === 3 ? "● ● ● EXTRA TEEKHA" : f.spice === 2 ? "● ● ○ MEDIUM HEAT" : "● ○ ○ MILD TASTE",
    capGrad: f.spice === 3 ? "capRed" : "capYellow",
    accent: "#f2b81d",
    iconType: "mint_chilli",
  };
}

// Generate Photorealistic 3D Tube SVG Render for a given flavour
function renderFlavourSvg(f, options = {}) {
  const { showKatori = true, angle = -10, width = "100%", height = "100%" } = options;
  const L = getFlavourLabelData(f);

  let ingredientSvg = "";
  if (L.iconType === "mint_chilli" || L.iconType === "chilli_peanut" || L.iconType === "momo_chilli") {
    ingredientSvg = `
      <!-- Mint Sprig -->
      <g transform="translate(36, 160) scale(0.9)">
        <path d="M 0 10 C 6 2 14 4 16 12 C 14 18 6 18 0 10 Z" fill="#22c55e" stroke="#ffffff" stroke-width="0.8" />
        <path d="M 0 10 Q 8 10 16 12" stroke="#ffffff" stroke-width="0.6" fill="none" />
        <path d="M 0 10 C -6 2 -14 4 -16 12 C -14 18 -6 18 0 10 Z" fill="#16a34a" stroke="#ffffff" stroke-width="0.8" />
        <path d="M 0 10 Q -8 10 -16 12" stroke="#ffffff" stroke-width="0.6" fill="none" />
      </g>
      <!-- Green Chilli -->
      <g transform="translate(68, 155) scale(0.85)">
        <path d="M 0 0 C 6 6 8 16 4 24 C 0 26 -4 20 -4 14 C -4 8 -2 2 0 0 Z" fill="#15803d" stroke="#ffffff" stroke-width="0.8" />
        <path d="M 0 0 Q 4 -4 8 -2" stroke="#4ade80" stroke-width="1.2" fill="none" stroke-linecap="round" />
        <ellipse cx="2" cy="12" rx="1" ry="5" fill="#ffffff" opacity="0.6" />
      </g>
    `;
  } else if (L.iconType === "tamarind_dates" || L.iconType === "ginger_chilli") {
    ingredientSvg = `
      <!-- Tamarind Pod -->
      <g transform="translate(35, 156) scale(0.9)">
        <path d="M 0 4 Q 8 0 16 6 Q 22 14 18 22 Q 12 24 6 18 Q 0 12 0 4 Z" fill="#78350f" stroke="#ffffff" stroke-width="0.8" />
        <circle cx="8" cy="8" r="3" fill="#92400e" />
        <circle cx="14" cy="15" r="3" fill="#92400e" />
      </g>
      <!-- Date / Jaggery -->
      <g transform="translate(68, 160) scale(0.85)">
        <ellipse cx="0" cy="8" rx="8" ry="12" fill="#451a03" stroke="#ffffff" stroke-width="0.8" />
        <path d="M -3 3 Q 0 8 -2 15" stroke="#ffffff" stroke-width="0.8" fill="none" opacity="0.6" />
      </g>
    `;
  } else if (L.iconType === "coconut_leaf") {
    ingredientSvg = `
      <!-- Coconut Half -->
      <g transform="translate(36, 160) scale(0.9)">
        <circle cx="0" cy="6" r="11" fill="#78350f" stroke="#ffffff" stroke-width="0.8" />
        <circle cx="0" cy="6" r="8" fill="#f8fafc" stroke="#e2e8f0" stroke-width="0.6" />
        <circle cx="0" cy="6" r="4" fill="#38bdf8" opacity="0.25" />
      </g>
      <!-- Curry Leaves -->
      <g transform="translate(68, 158) scale(0.85)">
        <path d="M 0 12 C 4 6 10 6 12 12 C 8 16 2 16 0 12 Z" fill="#15803d" stroke="#ffffff" stroke-width="0.8" />
        <path d="M 0 6 C 4 0 10 0 12 6 C 8 10 2 10 0 6 Z" fill="#22c55e" stroke="#ffffff" stroke-width="0.8" />
      </g>
    `;
  } else if (L.iconType === "garlic_chilli" || L.iconType === "schezwan_burst") {
    ingredientSvg = `
      <!-- Garlic Bulb -->
      <g transform="translate(36, 160) scale(0.9)">
        <path d="M 0 0 C 6 4 10 10 8 16 C 6 20 -6 20 -8 16 C -10 10 -6 4 0 0 Z" fill="#fef08a" stroke="#ffffff" stroke-width="0.8" />
        <path d="M 0 0 L 0 18" stroke="#ca8a04" stroke-width="0.6" />
        <path d="M 0 0 Q -5 9 -4 17" stroke="#ca8a04" stroke-width="0.6" />
        <path d="M 0 0 Q 5 9 4 17" stroke="#ca8a04" stroke-width="0.6" />
      </g>
      <!-- Red Chilli -->
      <g transform="translate(68, 156) scale(0.85)">
        <path d="M 0 0 C 6 6 8 16 4 24 C 0 26 -4 20 -4 14 C -4 8 -2 2 0 0 Z" fill="#dc2626" stroke="#ffffff" stroke-width="0.8" />
        <path d="M 0 0 Q 4 -4 8 -2" stroke="#16a34a" stroke-width="1.2" fill="none" stroke-linecap="round" />
        <ellipse cx="2" cy="12" rx="1" ry="5" fill="#ffffff" opacity="0.6" />
      </g>
    `;
  } else {
    ingredientSvg = `
      <!-- Whole Spices & Herbs -->
      <g transform="translate(36, 160) scale(0.9)">
        <circle cx="0" cy="4" r="5" fill="#eab308" stroke="#ffffff" stroke-width="0.8" />
        <circle cx="6" cy="10" r="4" fill="#ca8a04" stroke="#ffffff" stroke-width="0.8" />
        <circle cx="-6" cy="9" r="4" fill="#a16207" stroke="#ffffff" stroke-width="0.8" />
      </g>
      <!-- Chilli Pepper -->
      <g transform="translate(68, 156) scale(0.85)">
        <path d="M 0 0 C 6 6 8 16 4 24 C 0 26 -4 20 -4 14 C -4 8 -2 2 0 0 Z" fill="#dc2626" stroke="#ffffff" stroke-width="0.8" />
        <path d="M 0 0 Q 4 -4 8 -2" stroke="#16a34a" stroke-width="1.2" fill="none" stroke-linecap="round" />
      </g>
    `;
  }

  return `
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400" width="${width}" height="${height}" fill="none" aria-label="${f.name} tube render">
    <defs>
      <!-- Cylindrical 3D Shading for Tube Body -->
      <linearGradient id="shd_${f.id}" x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%" stop-color="#000000" stop-opacity="0.55" />
        <stop offset="14%" stop-color="#000000" stop-opacity="0.25" />
        <stop offset="28%" stop-color="${f.color}" />
        <stop offset="42%" stop-color="#ffffff" stop-opacity="0.4" />
        <stop offset="48%" stop-color="#ffffff" stop-opacity="0.6" />
        <stop offset="56%" stop-color="#ffffff" stop-opacity="0.25" />
        <stop offset="78%" stop-color="${f.color}" />
        <stop offset="90%" stop-color="#000000" stop-opacity="0.32" />
        <stop offset="100%" stop-color="#000000" stop-opacity="0.58" />
      </linearGradient>

      <!-- Label Plaque Surface Shading -->
      <linearGradient id="lblShd_${f.id}" x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%" stop-color="#e2e8f0" stop-opacity="0.3" />
        <stop offset="30%" stop-color="#ffffff" />
        <stop offset="70%" stop-color="#ffffff" />
        <stop offset="100%" stop-color="#cbd5e1" stop-opacity="0.4" />
      </linearGradient>

      <!-- Cap Gradients -->
      <linearGradient id="capYellow_${f.id}" x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%" stop-color="#b45309" />
        <stop offset="25%" stop-color="#f59e0b" />
        <stop offset="48%" stop-color="#ffffff" stop-opacity="0.65" />
        <stop offset="70%" stop-color="#f59e0b" />
        <stop offset="100%" stop-color="#92400e" />
      </linearGradient>

      <linearGradient id="capGreen_${f.id}" x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%" stop-color="#052e16" />
        <stop offset="25%" stop-color="#15803d" />
        <stop offset="48%" stop-color="#ffffff" stop-opacity="0.65" />
        <stop offset="70%" stop-color="#15803d" />
        <stop offset="100%" stop-color="#052e16" />
      </linearGradient>

      <linearGradient id="capRed_${f.id}" x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%" stop-color="#450a0a" />
        <stop offset="25%" stop-color="#b91c1c" />
        <stop offset="48%" stop-color="#ffffff" stop-opacity="0.65" />
        <stop offset="70%" stop-color="#b91c1c" />
        <stop offset="100%" stop-color="#450a0a" />
      </linearGradient>

      <!-- Lathed Brushed Stainless Steel Katori Shading -->
      <linearGradient id="stl_${f.id}" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#f8fafc" />
        <stop offset="25%" stop-color="#e2e8f0" />
        <stop offset="50%" stop-color="#ffffff" />
        <stop offset="75%" stop-color="#cbd5e1" />
        <stop offset="100%" stop-color="#64748b" />
      </linearGradient>

      <!-- Soft Realistic Floor Occlusion Drop Shadow -->
      <filter id="flvShd_${f.id}" x="-30%" y="-30%" width="160%" height="160%">
        <feDropShadow dx="2" dy="22" stdDeviation="16" flood-color="#18241b" flood-opacity="0.32" />
        <feDropShadow dx="1" dy="6" stdDeviation="6" flood-color="#18241b" flood-opacity="0.2" />
      </filter>

      <!-- Label Subtle Lift Shadow -->
      <filter id="lblLift_${f.id}" x="-10%" y="-10%" width="120%" height="120%">
        <feDropShadow dx="0" dy="2" stdDeviation="2.5" flood-color="#000000" flood-opacity="0.22" />
      </filter>
    </defs>

    <!-- Floor Occlusion Shadow -->
    <ellipse cx="200" cy="365" rx="145" ry="18" fill="#18241b" opacity="0.18" />
    <ellipse cx="190" cy="362" rx="105" ry="12" fill="#18241b" opacity="0.14" />

    <!-- Main Rotated Food Tube Assembly -->
    <g transform="translate(185, 182) rotate(${angle}) translate(-54, -165)" filter="url(#flvShd_${f.id})">
      
      <!-- 1. TUBE BODY: High-barrier matte food laminate -->
      <path d="M 8 36 L 100 36 C 100 175 98 238 92 254 C 86 270 74 278 54 278 C 34 278 22 270 16 254 C 10 238 8 175 8 36 Z" fill="${f.color}" />
      <path d="M 8 36 L 100 36 C 100 175 98 238 92 254 C 86 270 74 278 54 278 C 34 278 22 270 16 254 C 10 238 8 175 8 36 Z" fill="url(#shd_${f.id})" />

      <!-- Specular cylindrical softbox highlight -->
      <path d="M 48 36 L 54 36 C 54 175 53 238 52 268 L 48 268 C 47 238 48 175 48 36 Z" fill="#ffffff" opacity="0.28" />

      <!-- 2. METALLIC ZIGZAG CRIMPED TOP WITH STAMPED BATCH CODE -->
      <rect x="6" y="14" width="96" height="24" fill="#000000" opacity="0.38" rx="2" />
      <path d="M 9 14 L 13 38 M 19 14 L 23 38 M 29 14 L 33 38 M 39 14 L 43 38 M 49 14 L 53 38 M 59 14 L 63 38 M 69 14 L 73 38 M 79 14 L 83 38 M 89 14 L 93 38 M 99 14 L 103 38" stroke="#ffffff" stroke-width="1.2" opacity="0.45" />
      <rect x="6" y="12" width="96" height="4" fill="#000000" opacity="0.5" />
      <text x="54" y="28" font-family="Hind, sans-serif" font-size="5.2" font-weight="700" fill="#fde047" text-anchor="middle" letter-spacing="1.4" opacity="0.9">B.NO CT-26 • NET WT 100g</text>

      <!-- TRADITIONAL INDIAN TORAN FOLK MOTIF BAND -->
      <g transform="translate(10, 40)">
        <polygon points="4,0 8,7 0,7" fill="#f2b81d" />
        <polygon points="14,0 18,7 10,7" fill="#f2b81d" />
        <polygon points="24,0 28,7 20,7" fill="#f2b81d" />
        <polygon points="34,0 38,7 30,7" fill="#f2b81d" />
        <polygon points="44,0 48,7 40,7" fill="#f2b81d" />
        <polygon points="54,0 58,7 50,7" fill="#f2b81d" />
        <polygon points="64,0 68,7 60,7" fill="#f2b81d" />
        <polygon points="74,0 78,7 70,7" fill="#f2b81d" />
        <polygon points="84,0 88,7 80,7" fill="#f2b81d" />
        <circle cx="4" cy="10" r="1.1" fill="#ffffff" />
        <circle cx="14" cy="10" r="1.1" fill="#ffffff" />
        <circle cx="24" cy="10" r="1.1" fill="#ffffff" />
        <circle cx="34" cy="10" r="1.1" fill="#ffffff" />
        <circle cx="44" cy="10" r="1.1" fill="#ffffff" />
        <circle cx="54" cy="10" r="1.1" fill="#ffffff" />
        <circle cx="64" cy="10" r="1.1" fill="#ffffff" />
        <circle cx="74" cy="10" r="1.1" fill="#ffffff" />
        <circle cx="84" cy="10" r="1.1" fill="#ffffff" />
      </g>

      <!-- 3. TOP BRAND SEAL (ARCHITECTURAL HEADER CROWN) -->
      <g transform="translate(54, 72)" filter="url(#lblLift_${f.id})">
        <rect x="-38" y="-18" width="76" height="34" rx="6" fill="#f2b81d" stroke="#ffffff" stroke-width="1.4" />
        <rect x="-36" y="-16" width="72" height="30" rx="4.5" fill="none" stroke="#18241b" stroke-width="1.2" stroke-dasharray="2 1.5" />
        <text x="0" y="-4" font-family="Bricolage Grotesque, sans-serif" font-size="9.5" font-weight="900" fill="#18241b" text-anchor="middle" letter-spacing="0.8">CHUTNEY</text>
        <text x="0" y="8" font-family="Bricolage Grotesque, sans-serif" font-size="10.5" font-weight="900" fill="#c8361f" text-anchor="middle" letter-spacing="1.2">TUBES</text>
        <text x="0" y="13" font-family="Hind, sans-serif" font-size="4" font-weight="800" fill="#18241b" text-anchor="middle" letter-spacing="1.2">ESTD. 2026 • HOMESTYLE</text>
      </g>

      <!-- 4. FRONT-OF-PACK ARCHITECTURAL LABEL PLAQUE -->
      <g transform="translate(13, 94)" filter="url(#lblLift_${f.id})">
        <!-- Parchment Shield Background -->
        <rect x="0" y="0" width="82" height="138" rx="10" fill="#fffdfa" stroke="#18241b" stroke-width="1.3" />
        <rect x="0" y="0" width="82" height="138" rx="10" fill="url(#lblShd_${f.id})" />
        <rect x="2" y="2" width="78" height="134" rx="8" fill="none" stroke="#f2b81d" stroke-width="0.9" />

        <!-- Devanagari Hindi Ribbon Badge -->
        <g transform="translate(41, 14)">
          <rect x="-36" y="-8" width="72" height="16" rx="4" fill="#18241b" />
          <text x="0" y="3.5" font-family="Hind, sans-serif" font-size="8.5" font-weight="700" fill="#f2b81d" text-anchor="middle" letter-spacing="0.4">${L.hindiFull}</text>
        </g>

        <!-- Main Punchy Flavour Name (Editorial Display) -->
        <g transform="translate(41, 44)">
          <text x="0" y="0" font-family="Bricolage Grotesque, sans-serif" font-size="17" font-weight="900" fill="#18241b" text-anchor="middle" letter-spacing="0.4">${L.bigTitle}</text>
          <text x="0" y="11" font-family="Hind, sans-serif" font-size="6.2" font-weight="700" fill="#57534e" text-anchor="middle" letter-spacing="0.8">${L.subTitle}</text>
          <line x1="-24" y1="16" x2="24" y2="16" stroke="#d8dcd4" stroke-width="0.8" />
        </g>

        <!-- Illustrated Ingredient Pair -->
        <g transform="translate(0, 0)">
          ${ingredientSvg}
        </g>

        <!-- Spice Level Indicator Pill -->
        <g transform="translate(41, 98)">
          <rect x="-32" y="-7.5" width="64" height="15" rx="7.5" fill="#f4f3ec" stroke="#d8dcd4" stroke-width="0.8" />
          <text x="0" y="2.5" font-family="Hind, sans-serif" font-size="5.2" font-weight="800" fill="${f.spice === 3 ? '#c8361f' : '#1d6b3a'}" text-anchor="middle" letter-spacing="0.5">${L.spiceLabel}</text>
        </g>

        <!-- Green Veg Dot & Net Weight Marks -->
        <g transform="translate(8, 114)">
          <rect x="0" y="0" width="11" height="11" fill="#ffffff" stroke="#1d6b3a" stroke-width="1.3" rx="1.5" />
          <circle cx="5.5" cy="5.5" r="3.2" fill="#1d6b3a" />
        </g>
        <g transform="translate(74, 122)">
          <text x="0" y="0" font-family="Hind, sans-serif" font-size="7.5" font-weight="800" fill="#18241b" text-anchor="end">100 g</text>
        </g>
      </g>

      <!-- 5. 3D ROUNDED KETCHUP-STYLE FLIP-CAP -->
      <g transform="translate(36, 276)">
        <rect x="4" y="0" width="28" height="7" fill="#000000" opacity="0.32" rx="1.5" />
        <path d="M 2 5 Q 18 -1 34 5 L 32 26 C 32 31 28 34 18 34 C 8 34 4 31 4 26 Z" fill="url(#${L.capGrad}_${f.id})" stroke="#ffffff" stroke-width="0.9" />
        <path d="M 8 9 Q 18 5 28 9" stroke="#ffffff" stroke-width="1.8" stroke-linecap="round" fill="none" opacity="0.65" />
        <rect x="13" y="26" width="10" height="4" rx="2" fill="#000000" opacity="0.28" />
      </g>
    </g>

    <!-- 6. BRUSHED STAINLESS STEEL KATORI BESIDE THE TUBE -->
    ${showKatori ? `
    <g transform="translate(285, 305)" filter="url(#flvShd_${f.id})">
      <ellipse cx="0" cy="38" rx="55" ry="14" fill="#18241b" opacity="0.3" />
      <ellipse cx="0" cy="20" rx="50" ry="18" fill="url(#stl_${f.id})" stroke="#94a3b8" stroke-width="1.3" />
      <path d="M -50 20 C -50 40 50 40 50 20 Z" fill="url(#stl_${f.id})" stroke="#64748b" stroke-width="1.3" />
      <ellipse cx="0" cy="20" rx="47" ry="16" fill="none" stroke="#ffffff" stroke-width="1.3" opacity="0.85" />
      <ellipse cx="0" cy="18" rx="43" ry="14" fill="${f.color}" />
      <path d="M -18 18 Q 0 9 18 16 Q 9 23 -4 21" stroke="#ffffff" stroke-width="2.8" stroke-linecap="round" fill="none" opacity="0.65" />
      <circle cx="-8" cy="14" r="1.6" fill="#18241b" opacity="0.8" />
      <circle cx="10" cy="19" r="1.4" fill="#18241b" opacity="0.8" />
      <circle cx="16" cy="13" r="1.4" fill="#f2b81d" opacity="0.9" />
      <circle cx="-2" cy="22" r="1.2" fill="#fde047" opacity="0.9" />
      <path d="M 2 12 Q 6 8 10 11 Q 7 15 2 12 Z" fill="#4ade80" />
    </g>` : ""}
  </svg>`;
}

// Hero 3D Fanned Showcase SVG with Ultra-Realistic Packaging
function renderHeroFannedSvg() {
  return `
  <svg viewBox="0 0 540 460" width="100%" height="100%" fill="none" xmlns="http://www.w3.org/2000/svg" class="drop-shadow-2xl" aria-label="Chutney Tubes Trio">
    <ellipse cx="270" cy="425" rx="230" ry="24" fill="#000000" opacity="0.38" />
    
    <!-- Left Tube: Khatti Meethi Imli -->
    <g transform="translate(130, 205) rotate(-22) scale(0.9)">
      <rect x="8" y="36" width="92" height="242" rx="16" fill="#7a4a25" />
      <rect x="6" y="14" width="96" height="24" fill="#3b1d0c" rx="2" />
      <path d="M 9 14 L 13 38 M 21 14 L 25 38 M 33 14 L 37 38 M 45 14 L 49 38 M 57 14 L 61 38 M 69 14 L 73 38 M 81 14 L 85 38 M 93 14 L 97 38" stroke="#ffffff" stroke-width="1.2" opacity="0.4" />
      <text x="54" y="28" font-family="Hind, sans-serif" font-size="5" font-weight="700" fill="#fde047" text-anchor="middle">B.NO CT-26 • 100g</text>

      <!-- Brand Seal -->
      <g transform="translate(54, 68)">
        <rect x="-36" y="-16" width="72" height="32" rx="6" fill="#f2b81d" stroke="#ffffff" stroke-width="1.4" />
        <text x="0" y="-3" font-family="Bricolage Grotesque, sans-serif" font-size="9" font-weight="900" fill="#18241b" text-anchor="middle">CHUTNEY</text>
        <text x="0" y="8" font-family="Bricolage Grotesque, sans-serif" font-size="10" font-weight="900" fill="#c8361f" text-anchor="middle">TUBES</text>
      </g>

      <!-- Shield Label Plaque -->
      <g transform="translate(14, 90)">
        <rect x="0" y="0" width="80" height="136" rx="10" fill="#fffdfa" stroke="#18241b" stroke-width="1.2" />
        <rect x="2" y="2" width="76" height="132" rx="8" fill="none" stroke="#f2b81d" stroke-width="0.8" />
        <rect x="4" y="6" width="72" height="15" rx="3.5" fill="#18241b" />
        <text x="40" y="17" font-family="Hind, sans-serif" font-size="8.5" font-weight="700" fill="#f2b81d" text-anchor="middle">खट्टी मीठी इमली</text>
        
        <text x="40" y="44" font-family="Bricolage Grotesque, sans-serif" font-size="17" font-weight="900" fill="#18241b" text-anchor="middle">IMLI</text>
        <text x="40" y="55" font-family="Hind, sans-serif" font-size="6.5" font-weight="700" fill="#57534e" text-anchor="middle">TAMARIND &amp; DATES</text>
        
        <!-- Tamarind Pod & Dates -->
        <g transform="translate(32, 70) scale(0.9)">
          <path d="M 0 4 Q 8 0 16 6 Q 22 14 18 22 Q 12 24 6 18 Q 0 12 0 4 Z" fill="#78350f" stroke="#ffffff" stroke-width="0.8" />
          <ellipse cx="24" cy="12" rx="6" ry="10" fill="#451a03" stroke="#ffffff" stroke-width="0.8" />
        </g>
        
        <g transform="translate(40, 102)">
          <rect x="-30" y="-7" width="60" height="14" rx="7" fill="#f4f3ec" />
          <text x="0" y="2.5" font-family="Hind, sans-serif" font-size="5" font-weight="800" fill="#1d6b3a" text-anchor="middle">SWEET &amp; TANGY</text>
        </g>
        <rect x="8" y="116" width="10" height="10" fill="#ffffff" stroke="#1d6b3a" stroke-width="1.2" rx="1.5" />
        <circle cx="13" cy="121" r="3" fill="#1d6b3a" />
        <text x="72" y="124" font-family="Hind, sans-serif" font-size="7.5" font-weight="800" fill="#18241b" text-anchor="end">100 g</text>
      </g>

      <!-- Cap -->
      <path d="M 36 278 L 72 278 L 68 308 C 68 316 40 316 40 308 Z" fill="#b45309" stroke="#ffffff" stroke-width="1" />
    </g>

    <!-- Right Tube: Teekhi Imli Saunth -->
    <g transform="translate(415, 210) rotate(20) scale(0.9)">
      <rect x="-100" y="36" width="92" height="242" rx="16" fill="#5e3a1e" />
      <rect x="-102" y="14" width="96" height="24" fill="#2d1303" rx="2" />
      <path d="M -99 14 L -95 38 M -87 14 L -83 38 M -75 14 L -71 38 M -63 14 L -59 38 M -51 14 L -47 38 M -39 14 L -35 38 M -27 14 L -23 38 M -15 14 L -11 38" stroke="#ffffff" stroke-width="1.2" opacity="0.4" />
      <text x="-54" y="28" font-family="Hind, sans-serif" font-size="5" font-weight="700" fill="#fde047" text-anchor="middle">B.NO CT-26 • 100g</text>

      <!-- Brand Seal -->
      <g transform="translate(-54, 68)">
        <rect x="-36" y="-16" width="72" height="32" rx="6" fill="#f2b81d" stroke="#ffffff" stroke-width="1.4" />
        <text x="0" y="-3" font-family="Bricolage Grotesque, sans-serif" font-size="9" font-weight="900" fill="#18241b" text-anchor="middle">CHUTNEY</text>
        <text x="0" y="8" font-family="Bricolage Grotesque, sans-serif" font-size="10" font-weight="900" fill="#c8361f" text-anchor="middle">TUBES</text>
      </g>

      <!-- Shield Label Plaque -->
      <g transform="translate(-94, 90)">
        <rect x="0" y="0" width="80" height="136" rx="10" fill="#fffdfa" stroke="#18241b" stroke-width="1.2" />
        <rect x="2" y="2" width="76" height="132" rx="8" fill="none" stroke="#f2b81d" stroke-width="0.8" />
        <rect x="4" y="6" width="72" height="15" rx="3.5" fill="#18241b" />
        <text x="40" y="17" font-family="Hind, sans-serif" font-size="8.5" font-weight="700" fill="#f2b81d" text-anchor="middle">तीखी इमली सौंठ</text>
        
        <text x="40" y="44" font-family="Bricolage Grotesque, sans-serif" font-size="17" font-weight="900" fill="#18241b" text-anchor="middle">SAUNTH</text>
        <text x="40" y="55" font-family="Hind, sans-serif" font-size="6.5" font-weight="700" fill="#57534e" text-anchor="middle">TAMARIND &amp; GINGER</text>

        <!-- Ginger & Chilli -->
        <g transform="translate(32, 70) scale(0.9)">
          <path d="M 0 4 Q 8 0 16 6 Q 22 14 18 22 Q 12 24 6 18 Q 0 12 0 4 Z" fill="#78350f" stroke="#ffffff" stroke-width="0.8" />
          <circle cx="22" cy="14" r="5" fill="#ca8a04" stroke="#ffffff" stroke-width="0.8" />
        </g>

        <g transform="translate(40, 102)">
          <rect x="-30" y="-7" width="60" height="14" rx="7" fill="#f4f3ec" />
          <text x="0" y="2.5" font-family="Hind, sans-serif" font-size="5" font-weight="800" fill="#c8361f" text-anchor="middle">MEDIUM ZING</text>
        </g>
        <rect x="8" y="116" width="10" height="10" fill="#ffffff" stroke="#1d6b3a" stroke-width="1.2" rx="1.5" />
        <circle cx="13" cy="121" r="3" fill="#1d6b3a" />
        <text x="72" y="124" font-family="Hind, sans-serif" font-size="7.5" font-weight="800" fill="#18241b" text-anchor="end">100 g</text>
      </g>

      <!-- Cap -->
      <path d="M -72 278 L -36 278 L -40 308 C -40 316 -68 316 -68 308 Z" fill="#92400e" stroke="#ffffff" stroke-width="1" />
    </g>

    <!-- Center Hero Tube: Chatpati Hari (Upfront, 1.08 Scale) -->
    <g transform="translate(270, 218) scale(1.08)">
      <rect x="-48" y="16" width="96" height="258" rx="18" fill="#2f8f46" />
      <rect x="-18" y="16" width="18" height="258" fill="#ffffff" opacity="0.25" />
      
      <!-- Crimp -->
      <rect x="-50" y="-6" width="100" height="24" fill="#0f3a1a" rx="2" />
      <path d="M -46 -6 L -42 18 M -34 -6 L -30 18 M -22 -6 L -18 18 M -10 -6 L -6 18 M 2 -6 L 6 18 M 14 -6 L 18 18 M 26 -6 L 30 18 M 38 -6 L 42 18" stroke="#ffffff" stroke-width="1.2" opacity="0.45" />
      <text x="0" y="8" font-family="Hind, sans-serif" font-size="5.5" font-weight="700" fill="#fde047" text-anchor="middle" letter-spacing="1.2">B.NO CT-26 • NET WT 100g</text>

      <!-- Toran Band -->
      <g transform="translate(-45, 20)">
        <polygon points="4,0 8,8 0,8" fill="#f2b81d" />
        <polygon points="14,0 18,8 10,8" fill="#f2b81d" />
        <polygon points="24,0 28,8 20,8" fill="#f2b81d" />
        <polygon points="34,0 38,8 30,8" fill="#f2b81d" />
        <polygon points="44,0 48,8 40,8" fill="#f2b81d" />
        <polygon points="54,0 58,8 50,8" fill="#f2b81d" />
        <polygon points="64,0 68,8 60,8" fill="#f2b81d" />
        <polygon points="74,0 78,8 70,8" fill="#f2b81d" />
        <polygon points="84,0 88,8 80,8" fill="#f2b81d" />
      </g>

      <!-- Top Brand Seal -->
      <g transform="translate(0, 52)">
        <rect x="-38" y="-18" width="76" height="34" rx="6" fill="#f2b81d" stroke="#ffffff" stroke-width="1.6" />
        <rect x="-36" y="-16" width="72" height="30" rx="4" fill="none" stroke="#18241b" stroke-width="1.2" stroke-dasharray="2 1.5" />
        <text x="0" y="-4" font-family="Bricolage Grotesque, sans-serif" font-size="10" font-weight="900" fill="#18241b" text-anchor="middle" letter-spacing="0.8">CHUTNEY</text>
        <text x="0" y="8" font-family="Bricolage Grotesque, sans-serif" font-size="11" font-weight="900" fill="#c8361f" text-anchor="middle" letter-spacing="1.2">TUBES</text>
        <text x="0" y="13" font-family="Hind, sans-serif" font-size="4.2" font-weight="800" fill="#18241b" text-anchor="middle" letter-spacing="1.2">ESTD. 2026 • HOMESTYLE</text>
      </g>

      <!-- Center Food Label Plaque -->
      <g transform="translate(-42, 74)">
        <rect x="0" y="0" width="84" height="142" rx="10" fill="#fffdfa" stroke="#18241b" stroke-width="1.3" />
        <rect x="2" y="2" width="80" height="138" rx="8" fill="none" stroke="#f2b81d" stroke-width="0.9" />
        
        <rect x="4" y="6" width="76" height="16" rx="4" fill="#18241b" />
        <text x="42" y="17.5" font-family="Hind, sans-serif" font-size="9" font-weight="700" fill="#f2b81d" text-anchor="middle" letter-spacing="0.4">चटपटी हरी • चटनी</text>
        
        <text x="42" y="47" font-family="Bricolage Grotesque, sans-serif" font-size="18" font-weight="900" fill="#18241b" text-anchor="middle" letter-spacing="0.5">HARI</text>
        <text x="42" y="58" font-family="Hind, sans-serif" font-size="6.5" font-weight="700" fill="#57534e" text-anchor="middle" letter-spacing="0.8">CHATPATI PUDINA</text>
        <line x1="18" y1="62" x2="66" y2="62" stroke="#d8dcd4" stroke-width="0.8" />

        <!-- Mint Sprig & Chilli -->
        <g transform="translate(24, 76) scale(0.95)">
          <path d="M 0 10 C 6 2 14 4 16 12 C 14 18 6 18 0 10 Z" fill="#22c55e" stroke="#ffffff" stroke-width="0.8" />
          <path d="M 0 10 C -6 2 -14 4 -16 12 C -14 18 -6 18 0 10 Z" fill="#16a34a" stroke="#ffffff" stroke-width="0.8" />
        </g>
        <g transform="translate(56, 72) scale(0.9)">
          <path d="M 0 0 C 6 6 8 16 4 24 C 0 26 -4 20 -4 14 C -4 8 -2 2 0 0 Z" fill="#15803d" stroke="#ffffff" stroke-width="0.8" />
          <path d="M 0 0 Q 4 -4 8 -2" stroke="#4ade80" stroke-width="1.2" fill="none" stroke-linecap="round" />
        </g>

        <!-- Spice Rating -->
        <g transform="translate(42, 108)">
          <rect x="-32" y="-7.5" width="64" height="15" rx="7.5" fill="#f4f3ec" stroke="#d8dcd4" stroke-width="0.8" />
          <text x="0" y="2.5" font-family="Hind, sans-serif" font-size="5.2" font-weight="800" fill="#1d6b3a" text-anchor="middle">● ● ○ MEDIUM HEAT</text>
        </g>

        <!-- Green Veg Mark & Net Weight -->
        <rect x="8" y="122" width="11" height="11" fill="#ffffff" stroke="#1d6b3a" stroke-width="1.3" rx="1.5" />
        <circle cx="13.5" cy="127.5" r="3.2" fill="#1d6b3a" />
        <text x="76" y="130" font-family="Hind, sans-serif" font-size="8" font-weight="800" fill="#18241b" text-anchor="end">100 g</text>
      </g>

      <!-- 3D Yellow Flip-Cap -->
      <g transform="translate(-18, 274)">
        <rect x="4" y="0" width="28" height="7" fill="#000000" opacity="0.32" rx="1.5" />
        <path d="M 2 5 Q 18 -1 34 5 L 32 26 C 32 31 28 34 18 34 C 8 34 4 31 4 26 Z" fill="#f59e0b" stroke="#ffffff" stroke-width="1" />
        <path d="M 8 9 Q 18 5 28 9" stroke="#ffffff" stroke-width="1.8" stroke-linecap="round" fill="none" opacity="0.65" />
        <rect x="13" y="26" width="10" height="4" rx="2" fill="#000000" opacity="0.28" />
      </g>
    </g>

    <!-- Foreground Stainless Steel Katori of Fresh Green Chutney -->
    <g transform="translate(385, 368)">
      <ellipse cx="0" cy="24" rx="70" ry="18" fill="#000000" opacity="0.32" />
      <ellipse cx="0" cy="0" rx="65" ry="24" fill="#cbd5e1" stroke="#94a3b8" stroke-width="1.5" />
      <path d="M -65 0 C -65 28 65 28 65 0 Z" fill="#94a3b8" stroke="#64748b" stroke-width="1.5" />
      <ellipse cx="0" cy="0" rx="58" ry="20" fill="#2f8f46" />
      <!-- Swirl Highlight -->
      <path d="M -24 0 Q 0 -12 24 -2 Q 12 10 -4 8" stroke="#ffffff" stroke-width="3.2" stroke-linecap="round" fill="none" opacity="0.65" />
      <circle cx="-12" cy="-4" r="2.2" fill="#134a28" />
      <circle cx="14" cy="2" r="2" fill="#134a28" />
      <circle cx="20" cy="-6" r="1.8" fill="#f2b81d" />
      <path d="M 2 -8 Q 8 -14 14 -10 Q 10 -4 2 -8 Z" fill="#4ade80" />
    </g>
  </svg>`;
}

// Render HTML Shell with Hallmark Design Tokens
function renderHtmlShell(title, bodyHtml) {
  return '<!DOCTYPE html>' +
'<html lang="en" class="scroll-smooth">' +
'<head>' +
  '<meta charset="UTF-8">' +
  '<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=5.0">' +
  '<title>' + title + ' | ' + storeConfig.brand.name + '</title>' +
  '<meta name="description" content="' + storeConfig.copy.hero.sub + '">' +
  '<link rel="icon" type="image/svg+xml" href="/favicon.svg">' +
  '<meta property="og:title" content="Chutney Tubes: your favourite chutney, now in a tube">' +
  '<meta property="og:description" content="Hari, imli, saunth, garlic, schezwan and more in a squeezable tube. 100% vegetarian.">' +
  '<script src="https://cdn.tailwindcss.com"></script>' +
  '<script>' +
    'tailwind.config = {' +
      'theme: {' +
        'extend: {' +
          'colors: {' +
            'ink: "#18241b",' +
            'paper: "#f4f3ec",' +
            'leaf: "#1d6b3a",' +
            'deepLeaf: "#134a28",' +
            'haldi: "#f2b81d",' +
            'mirch: "#c8361f",' +
            'steel: "#d8dcd4",' +
          '},' +
          'fontFamily: {' +
            'heading: ["\'Bricolage Grotesque\'", "sans-serif"],' +
            'body: ["\'Hind\'", "sans-serif"],' +
            'sans: ["\'Hind\'", "sans-serif"],' +
          '}' +
        '}' +
      '}' +
    '};' +
  '</script>' +
  '<link rel="preconnect" href="https://fonts.googleapis.com">' +
  '<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>' +
  '<link href="https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,700;12..96,800&family=Hind:wght@400;500;600;700&display=swap" rel="stylesheet">' +
  '<style>' +
    'body { font-family: "Hind", system-ui, -apple-system, sans-serif; background-color: #f4f3ec; color: #18241b; -webkit-font-smoothing: antialiased; }' +
    'h1, h2, h3, h4, .font-heading { font-family: "Bricolage Grotesque", system-ui, -apple-system, sans-serif; font-weight: 800; letter-spacing: -0.02em; }' +
    'a:focus-visible, button:focus-visible, input:focus-visible, textarea:focus-visible, select:focus-visible { outline: 2px solid #18241b; outline-offset: 2px; }' +
    '@keyframes dollopDrop { 0% { transform: translateY(-35px) scale(0.2); opacity: 0; } 60% { transform: translateY(0px) scale(1.15); opacity: 1; } 100% { transform: translateY(0px) scale(1.0); opacity: 1; } }' +
    '.animate-dollop { animation: dollopDrop 0.35s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards; }' +
    '@media (prefers-reduced-motion: reduce) { *, *::before, *::after { animation-duration: 0.01ms !important; transition-duration: 0.01ms !important; scroll-behavior: auto !important; } }' +
  '</style>' +
'</head>' +
'<body class="min-h-screen flex flex-col justify-between selection:bg-[#f2b81d] selection:text-[#18241b]">' +
  bodyHtml +
'</body>' +
'</html>';
}


// Render Main Store HTML
function renderMainStoreHtml(options = {}) {
  const c = storeConfig;
  const flavoursJson = JSON.stringify(c.flavours).replace(/</g, '\\\\u003c');
  const tasteProfilesJson = JSON.stringify(TASTE_PROFILES).replace(/</g, '\\\\u003c');
  const pricingJson = JSON.stringify(c.pricing).replace(/</g, '\\\\u003c');
  const postalZonesJson = JSON.stringify(c.postalZones).replace(/</g, '\\\\u003c');

  const catalogueHtml = c.flavours.map(f => {
    const isHot = f.spice === 3;
    const isMedium = f.spice === 2;
    const spiceDots = Array.from({ length: f.spice }).map(() => '<span class="w-2 h-2 rounded-full bg-[#c8361f] inline-block"></span>').join('');
    const svgContent = renderFlavourSvg(f);

    return '<div class="flavour-card bg-white rounded-3xl p-5 border border-[#d8dcd4] shadow-sm flex flex-col justify-between hover:shadow-md transition" data-spice="' + f.spice + '" data-flavour-id="' + f.id + '">' +
      '<div>' +
        '<div class="flex items-center justify-between gap-2 mb-3">' +
          '<span class="bg-[#18241b] text-[#f2b81d] text-[11px] font-heading font-extrabold px-2.5 py-1 rounded-full">' + f.hindi + ' चटनी</span>' +
          '<div class="flex items-center space-x-1" title="Spice level: ' + f.spice + '/3">' +
            spiceDots +
          '</div>' +
        '</div>' +
        '<div class="w-full aspect-square bg-[#f4f3ec] rounded-2xl flex items-center justify-center p-2 mb-4 overflow-hidden relative">' +
          svgContent +
          '<span class="absolute bottom-2 left-2 bg-[#18241b]/80 backdrop-blur text-white text-[10px] font-bold px-2 py-0.5 rounded-full">' + f.local + '</span>' +
        '</div>' +
        '<h3 class="font-heading font-extrabold text-lg text-[#18241b] leading-tight mb-1">' + f.name + '</h3>' +
        '<p class="text-xs text-[#57534e] leading-relaxed mb-3">' + f.desc + '</p>' +
        '<div class="inline-flex items-center text-[11px] bg-[#f4f3ec] text-[#134a28] font-bold px-2.5 py-1 rounded-lg mb-4">' +
          '<span>Pair with: ' + f.goesWith + '</span>' +
        '</div>' +
      '</div>' +
      '<div class="pt-3 border-t border-[#d8dcd4] flex items-center justify-between gap-2">' +
        '<div>' +
          '<span class="text-[10px] text-[#57534e] block uppercase font-bold tracking-wider">100g tube</span>' +
          '<span class="font-heading font-black text-lg text-[#18241b] flavour-price">₹99</span>' +
        '</div>' +
        '<div class="flex items-center space-x-1.5">' +
          '<button type="button" onclick="openTasteModal(&quot;' + f.id + '&quot;)" class="bg-[#f4f3ec] hover:bg-[#e2e8f0] text-[#18241b] text-xs font-bold px-3 py-2 rounded-xl transition" title="View tasting notes & ingredients">Profile</button>' +
          '<button type="button" onclick="addSingleToCart(&quot;' + f.id + '&quot;)" class="bg-[#1d6b3a] hover:bg-[#134a28] text-white font-heading font-black text-xs px-3.5 py-2 rounded-xl shadow-sm transition active:scale-95">+ Add</button>' +
        '</div>' +
      '</div>' +
    '</div>';
  }).join('');

  return renderHtmlShell(
    "Your favourite chutney, now in a tube",
    `
    <!-- Announcement Bar with Dynamic Variant Badge -->
    <div class="bg-[#18241b] text-[#f4f3ec] text-xs sm:text-sm font-medium py-2.5 px-4 text-center tracking-wide flex items-center justify-center flex-wrap gap-2">
      <span>${c.copy.announcement}</span>
      <span id="variant-pill" class="bg-[#134a28] text-[#f2b81d] text-[10px] uppercase font-bold px-2.5 py-0.5 rounded-full font-heading">Variant A</span>
    </div>

    <!-- Sticky Navigation Header -->
    <header class="sticky top-0 z-40 bg-[#134a28] text-white px-4 sm:px-8 py-3.5 border-b border-[#18241b] shadow-md flex items-center justify-between">
      <a href="/" class="flex items-center space-x-2.5 group">
        <div class="w-8 h-8 rounded-lg bg-[#f2b81d] flex items-center justify-center p-1 shadow-sm transform group-hover:rotate-6 transition">
          <svg viewBox="0 0 32 32" class="w-6 h-6" fill="none">
            <rect x="6" y="2" width="20" height="4" fill="#ca8a04" rx="1" />
            <path d="M 6 6 L 26 6 C 26 22 25 26 23 28 C 21 30 19 31 16 31 C 13 31 11 30 9 28 C 7 26 6 22 6 6 Z" fill="#18241b" />
            <circle cx="16" cy="18" r="4" fill="#c8361f" />
          </svg>
        </div>
        <span class="font-heading font-extrabold text-xl sm:text-2xl tracking-tight text-[#f2b81d]">
          ${c.brand.name}
        </span>
      </a>

      <nav class="hidden lg:flex items-center space-x-7 text-sm font-semibold text-[#f4f3ec]">
        <a href="#chutneys" class="hover:text-[#f2b81d] transition">Chutneys</a>
        <a href="#simulator" class="hover:text-[#f2b81d] transition">Try Squeeze</a>
        <a href="#anatomy" class="hover:text-[#f2b81d] transition">Anatomy</a>
        <a href="#comparison" class="hover:text-[#f2b81d] transition">Why a Tube?</a>
        <a href="#packs" class="hover:text-[#f2b81d] transition">Packs</a>
        <a href="#faq" class="hover:text-[#f2b81d] transition">FAQ</a>
      </nav>

      <button type="button" onclick="toggleCartDrawer(true)" class="bg-[#f2b81d] hover:bg-[#e2a80d] text-[#18241b] font-heading font-black text-xs sm:text-sm px-4 py-2 rounded-full shadow-md flex items-center space-x-2 transition transform active:scale-95">
        <span>Cart</span>
        <span id="header-cart-count" class="w-5 h-5 rounded-full bg-[#18241b] text-white flex items-center justify-center text-xs font-bold">0</span>
      </button>
    </header>

    <main>
      <!-- Hallmark Stage Hero Section -->
      <section class="bg-gradient-to-b from-[#134a28] to-[#1d6b3a] text-white pt-12 pb-20 px-4 sm:px-8 border-b border-[#134a28] overflow-hidden">
        <div class="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
          <div class="lg:col-span-7 space-y-6 text-left">
            <div class="inline-flex items-center space-x-2 bg-[#18241b]/60 backdrop-blur px-3 py-1.5 rounded-full border border-white/10">
              <span class="w-2 h-2 rounded-full bg-[#f2b81d] animate-pulse"></span>
              <span class="text-xs font-heading font-extrabold uppercase tracking-wider text-[#f2b81d]">${c.copy.hero.smallCaps}</span>
            </div>
            
            <h1 class="font-heading font-black text-4xl sm:text-5xl lg:text-6xl text-white leading-[1.08] tracking-tight">
              ${c.copy.hero.headlinePart1}
              <span class="text-[#f2b81d]">${c.copy.hero.headlineHighlight}</span>
            </h1>

            <p class="text-base sm:text-xl text-[#f4f3ec] leading-relaxed max-w-xl font-normal">
              ${c.copy.hero.sub}
            </p>

            <p class="text-xs sm:text-sm text-[#f2b81d] font-bold tracking-wide">
              Desk-lunch chutney with no mess. Squeeze straight onto samosas, parathas, and snacks.
            </p>

            <div class="pt-2 flex flex-wrap items-center gap-3">
              <a href="#chutneys" class="bg-[#f2b81d] hover:bg-[#e2a80d] text-[#18241b] font-heading font-black text-sm sm:text-base px-8 py-4 rounded-xl shadow-lg transition transform active:scale-95 inline-flex items-center space-x-2">
                <span>Try a Tube •</span>
                <span id="hero-cta-price">₹99</span>
              </a>
              <a href="#packs" class="border-2 border-white/80 hover:border-white text-white font-heading font-black text-sm sm:text-base px-6 py-3.5 rounded-xl transition hover:bg-white/10">
                ${c.copy.hero.packsCta}
              </a>
            </div>

            <!-- Trust Pills -->
            <div class="pt-4 flex flex-wrap items-center gap-4 text-xs text-[#f4f3ec]/90">
              <span class="flex items-center space-x-1.5">
                <svg class="w-4 h-4 text-[#f2b81d]" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"></path></svg>
                <span>100% Vegetarian</span>
              </span>
              <span class="flex items-center space-x-1.5">
                <svg class="w-4 h-4 text-[#f2b81d]" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"></path></svg>
                <span>No Leaky Dabbas</span>
              </span>
              <span class="flex items-center space-x-1.5">
                <svg class="w-4 h-4 text-[#f2b81d]" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"></path></svg>
                <span>Fits in Tiffin Bag</span>
              </span>
            </div>
          </div>

          <div class="lg:col-span-5 flex justify-center lg:justify-end">
            <div class="w-full max-w-md sm:max-w-lg aspect-square">
              ${renderHeroFannedSvg()}
            </div>
          </div>
        </div>
      </section>

      <!-- Trust Strip (4 Clean SVG Feature Cards) -->
      <section class="bg-white border-b border-[#d8dcd4] py-8 px-4 sm:px-8">
        <div class="max-w-6xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
          <div class="flex flex-col items-center justify-center p-3 space-y-2">
            <div class="w-12 h-12 rounded-2xl bg-[#1d6b3a]/10 text-[#1d6b3a] flex items-center justify-center">
              <svg class="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><rect x="3" y="3" width="18" height="18" rx="4"></rect><circle cx="12" cy="12" r="5" fill="#1d6b3a"></circle></svg>
            </div>
            <span class="font-heading font-extrabold text-sm text-[#18241b]">100% Vegetarian</span>
            <span class="text-xs text-[#57534e]">Certified green dot recipe</span>
          </div>

          <div class="flex flex-col items-center justify-center p-3 space-y-2">
            <div class="w-12 h-12 rounded-2xl bg-[#f2b81d]/15 text-[#18241b] flex items-center justify-center">
              <svg class="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path></svg>
            </div>
            <span class="font-heading font-extrabold text-sm text-[#18241b]">Zero Spoon Mess</span>
            <span class="text-xs text-[#57534e]">Squeeze straight to plate</span>
          </div>

          <div class="flex flex-col items-center justify-center p-3 space-y-2">
            <div class="w-12 h-12 rounded-2xl bg-[#c8361f]/10 text-[#c8361f] flex items-center justify-center">
              <svg class="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
            </div>
            <span class="font-heading font-extrabold text-sm text-[#18241b]">Leakproof Snap-Cap</span>
            <span class="text-xs text-[#57534e]">Locks tight inside bag</span>
          </div>

          <div class="flex flex-col items-center justify-center p-3 space-y-2">
            <div class="w-12 h-12 rounded-2xl bg-[#18241b]/10 text-[#18241b] flex items-center justify-center">
              <svg class="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><rect x="3" y="4" width="18" height="16" rx="3"></rect><path d="M16 2v4M8 2v4M3 10h18"></path></svg>
            </div>
            <span class="font-heading font-extrabold text-sm text-[#18241b]">Metro Tiffin Ready</span>
            <span class="text-xs text-[#57534e]">Fits lunch bags and drawers</span>
          </div>
        </div>
      </section>

      <!-- Interactive Squeeze Simulator ("Try the Squeeze") -->
      <section id="simulator" class="py-16 px-4 sm:px-8 bg-[#f4f3ec] border-b border-[#d8dcd4]">
        <div class="max-w-4xl mx-auto bg-white rounded-3xl p-6 sm:p-10 border border-[#d8dcd4] shadow-sm">
          <div class="text-center max-w-xl mx-auto mb-8 space-y-2">
            <span class="text-xs uppercase font-heading font-extrabold tracking-widest text-[#1d6b3a]">Interactive Demo</span>
            <h2 class="font-heading font-black text-3xl sm:text-4xl text-[#18241b]">Try the Squeeze Simulator</h2>
            <p class="text-sm sm:text-base text-[#57534e]">Pick your snack, pick a chutney, and hit squeeze to see how clean desk lunch becomes.</p>
          </div>

          <!-- Snack & Chutney Selectors -->
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <div class="space-y-2">
              <label class="block text-xs font-heading font-black uppercase text-[#18241b] tracking-wider">1. Choose Your Snack</label>
              <div class="grid grid-cols-2 gap-2" id="sim-snack-selector">
                <button type="button" onclick="setSimSnack('samosa')" id="btn-snack-samosa" class="sim-btn p-3 rounded-2xl border-2 border-[#18241b] bg-[#f4f3ec] text-xs font-bold text-[#18241b] flex items-center justify-center space-x-2 transition">
                  <span>🥟 Hot Samosa</span>
                </button>
                <button type="button" onclick="setSimSnack('pakora')" id="btn-snack-pakora" class="sim-btn p-3 rounded-2xl border border-[#d8dcd4] bg-white text-xs font-bold text-[#57534e] flex items-center justify-center space-x-2 transition">
                  <span>🧅 Crisp Pakora</span>
                </button>
                <button type="button" onclick="setSimSnack('toast')" id="btn-snack-toast" class="sim-btn p-3 rounded-2xl border border-[#d8dcd4] bg-white text-xs font-bold text-[#57534e] flex items-center justify-center space-x-2 transition">
                  <span>🍞 Butter Toast</span>
                </button>
                <button type="button" onclick="setSimSnack('idli')" id="btn-snack-idli" class="sim-btn p-3 rounded-2xl border border-[#d8dcd4] bg-white text-xs font-bold text-[#57534e] flex items-center justify-center space-x-2 transition">
                  <span>⚪ Steamed Idli</span>
                </button>
              </div>
            </div>

            <div class="space-y-2">
              <label class="block text-xs font-heading font-black uppercase text-[#18241b] tracking-wider">2. Choose Chutney Flavour</label>
              <div class="grid grid-cols-2 gap-2" id="sim-flavour-selector">
                <button type="button" onclick="setSimFlavour('green', '#2f8f46')" id="btn-sim-green" class="sim-flv p-3 rounded-2xl border-2 border-[#2f8f46] bg-[#2f8f46]/10 text-xs font-bold text-[#18241b] flex items-center space-x-2 transition">
                  <span class="w-3 h-3 rounded-full bg-[#2f8f46]"></span>
                  <span>Chatpati Hari</span>
                </button>
                <button type="button" onclick="setSimFlavour('imli', '#7a4a25')" id="btn-sim-imli" class="sim-flv p-3 rounded-2xl border border-[#d8dcd4] bg-white text-xs font-bold text-[#57534e] flex items-center space-x-2 transition">
                  <span class="w-3 h-3 rounded-full bg-[#7a4a25]"></span>
                  <span>Khatti Imli</span>
                </button>
                <button type="button" onclick="setSimFlavour('garlic', '#9e2b1a')" id="btn-sim-garlic" class="sim-flv p-3 rounded-2xl border border-[#d8dcd4] bg-white text-xs font-bold text-[#57534e] flex items-center space-x-2 transition">
                  <span class="w-3 h-3 rounded-full bg-[#9e2b1a]"></span>
                  <span>Teekhi Lehsuni</span>
                </button>
                <button type="button" onclick="setSimFlavour('schezwan', '#c23a1a')" id="btn-sim-schezwan" class="sim-flv p-3 rounded-2xl border border-[#d8dcd4] bg-white text-xs font-bold text-[#57534e] flex items-center space-x-2 transition">
                  <span class="w-3 h-3 rounded-full bg-[#c23a1a]"></span>
                  <span>Desi Schezwan</span>
                </button>
              </div>
            </div>
          </div>

          <!-- Interactive Plate Visual Stage -->
          <div class="relative bg-[#f4f3ec] rounded-2xl p-6 sm:p-10 border border-[#d8dcd4] flex flex-col items-center justify-center min-h-[260px] overflow-hidden">
            <!-- Steel Plate SVG -->
            <svg viewBox="0 0 320 200" class="w-64 sm:w-80 h-auto">
              <!-- Plate Outer Rim -->
              <ellipse cx="160" cy="120" rx="140" ry="60" fill="#e2e8f0" stroke="#94a3b8" stroke-width="2" />
              <ellipse cx="160" cy="118" rx="125" ry="50" fill="#f8fafc" stroke="#cbd5e1" stroke-width="1.5" />
              
              <!-- Snack Illustration on Plate -->
              <g id="sim-snack-svg">
                <!-- Default Samosa -->
                <polygon points="160,60 115,130 205,130" fill="#d97706" stroke="#92400e" stroke-width="2" />
                <path d="M 160 60 Q 155 100 115 130" stroke="#b45309" stroke-width="2" fill="none" opacity="0.6" />
                <polygon points="160,65 125,125 195,125" fill="#f59e0b" opacity="0.4" />
                <circle cx="150" cy="100" r="1.5" fill="#78350f" />
                <circle cx="170" cy="115" r="1.5" fill="#78350f" />
              </g>

              <!-- Dynamic Chutney Dollop Swirl on Snack -->
              <g id="sim-dollop-layer" class="hidden">
                <ellipse cx="160" cy="112" rx="22" ry="14" id="sim-dollop-ellipse" fill="#2f8f46" class="animate-dollop" />
                <path d="M 152 110 Q 160 102 168 108 Q 163 118 155 114" stroke="#ffffff" stroke-width="2" stroke-linecap="round" fill="none" opacity="0.75" />
                <circle cx="165" cy="114" r="1.5" fill="#18241b" opacity="0.6" />
              </g>
            </svg>

            <!-- Squeeze Action Trigger Button -->
            <div class="mt-6 flex flex-col items-center space-y-3 z-10">
              <button type="button" onclick="triggerSqueezeAnimation()" id="btn-trigger-squeeze" class="bg-[#1d6b3a] hover:bg-[#134a28] text-white font-heading font-black text-sm px-8 py-3.5 rounded-2xl shadow-lg transition transform active:scale-95 flex items-center space-x-2">
                <span>💦 Squeeze Chutney</span>
              </button>
              <span id="sim-status-pill" class="text-xs font-bold text-[#134a28] bg-white/80 backdrop-blur px-3 py-1 rounded-full border border-[#d8dcd4]">Ready to squeeze</span>
            </div>
          </div>
        </div>
      </section>

      <!-- 12 Flavour Catalogue Section -->
      <section id="chutneys" class="py-16 px-4 sm:px-8 max-w-6xl mx-auto w-full">
        <div class="text-center max-w-2xl mx-auto mb-10 space-y-2">
          <div class="inline-flex items-center space-x-1.5 bg-[#1d6b3a]/10 text-[#1d6b3a] text-xs font-heading font-extrabold px-3 py-1 rounded-full">
            <span>Freshly Batched</span>
          </div>
          <h2 class="font-heading font-black text-3xl sm:text-4xl text-[#18241b]">${c.copy.catalogue.h2}</h2>
          <p class="text-sm sm:text-base text-[#57534e]">${c.copy.catalogue.lede}</p>

          <!-- Spice Filter Chips -->
          <div class="flex flex-wrap items-center justify-center gap-2 pt-4">
            <button type="button" onclick="filterSpice(null)" id="flt-all" class="px-4 py-1.5 rounded-full text-xs font-bold transition bg-[#18241b] text-white">All (12)</button>
            <button type="button" onclick="filterSpice(1)" id="flt-1" class="px-4 py-1.5 rounded-full text-xs font-bold transition bg-white text-[#18241b] border border-[#d8dcd4]">Mild (3)</button>
            <button type="button" onclick="filterSpice(2)" id="flt-2" class="px-4 py-1.5 rounded-full text-xs font-bold transition bg-white text-[#18241b] border border-[#d8dcd4]">Medium (5)</button>
            <button type="button" onclick="filterSpice(3)" id="flt-3" class="px-4 py-1.5 rounded-full text-xs font-bold transition bg-white text-[#18241b] border border-[#d8dcd4]">Hot (4)</button>
          </div>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6" id="flavour-grid">
          ${catalogueHtml}
        </div>
      </section>

      <!-- Packaging Anatomy Section -->
      <section id="anatomy" class="py-16 bg-white border-y border-[#d8dcd4] px-4 sm:px-8">
        <div class="max-w-5xl mx-auto">
          <div class="text-center max-w-xl mx-auto mb-12 space-y-2">
            <span class="text-xs uppercase font-heading font-extrabold tracking-widest text-[#1d6b3a]">Industrial Design</span>
            <h2 class="font-heading font-black text-3xl sm:text-4xl text-[#18241b]">Engineered for Food. Built for Bags.</h2>
            <p class="text-sm sm:text-base text-[#57534e]">Every millimeter is designed so desk workers in Indian metros can enjoy authentic chutney with zero oily leaks.</p>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
            <div class="space-y-6">
              <div class="bg-[#f4f3ec] p-5 rounded-2xl border border-[#d8dcd4] flex items-start space-x-4">
                <div class="w-10 h-10 rounded-xl bg-[#1d6b3a] text-white flex-shrink-0 flex items-center justify-center font-heading font-black text-sm">1</div>
                <div class="space-y-1">
                  <h3 class="font-heading font-extrabold text-base text-[#18241b]">Multi-Layer EVOH Barrier</h3>
                  <p class="text-xs sm:text-sm text-[#57534e]">Blocks oxygen and UV light completely. Locks in fresh mint-coriander tang and roasted cumin aroma without chemical preservatives.</p>
                </div>
              </div>

              <div class="bg-[#f4f3ec] p-5 rounded-2xl border border-[#d8dcd4] flex items-start space-x-4">
                <div class="w-10 h-10 rounded-xl bg-[#f2b81d] text-[#18241b] flex-shrink-0 flex items-center justify-center font-heading font-black text-sm">2</div>
                <div class="space-y-1">
                  <h3 class="font-heading font-extrabold text-base text-[#18241b]">One-Way Clean-Cut Silicone Valve</h3>
                  <p class="text-xs sm:text-sm text-[#57534e]">Squeezes out the exact dollop you need, then cleanly cuts off. No crusted nozzle, no drip on the outside, zero messy fingers.</p>
                </div>
              </div>

              <div class="bg-[#f4f3ec] p-5 rounded-2xl border border-[#d8dcd4] flex items-start space-x-4">
                <div class="w-10 h-10 rounded-xl bg-[#c8361f] text-white flex-shrink-0 flex items-center justify-center font-heading font-black text-sm">3</div>
                <div class="space-y-1">
                  <h3 class="font-heading font-extrabold text-base text-[#18241b]">Snap-Lock Leakproof Flip-Cap</h3>
                  <p class="text-xs sm:text-sm text-[#57534e]">Thumb-flip opening clicks shut with an audible snap. Tested to withstand up to 15 kg pressure in backpacks, laptops bags, and tiffins.</p>
                </div>
              </div>

              <div class="bg-[#f4f3ec] p-5 rounded-2xl border border-[#d8dcd4] flex items-start space-x-4">
                <div class="w-10 h-10 rounded-xl bg-[#18241b] text-[#f2b81d] flex-shrink-0 flex items-center justify-center font-heading font-black text-sm">4</div>
                <div class="space-y-1">
                  <h3 class="font-heading font-extrabold text-base text-[#18241b]">Stamped Zigzag Foil Crimp</h3>
                  <p class="text-xs sm:text-sm text-[#57534e]">Batch stamped with production code and net weight (100 g). Hygienic squeeze evacuates 99% of chutney without dirty spoons.</p>
                </div>
              </div>
            </div>

            <div class="flex justify-center">
              <div class="w-full max-w-sm aspect-square bg-[#f4f3ec] rounded-3xl p-6 border border-[#d8dcd4] flex items-center justify-center">
                ${renderFlavourSvg(c.flavours[0])}
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- Why a Tube? Comparison Matrix -->
      <section id="comparison" class="py-16 px-4 sm:px-8 max-w-5xl mx-auto w-full">
        <div class="text-center max-w-xl mx-auto mb-10 space-y-2">
          <span class="text-xs uppercase font-heading font-extrabold tracking-widest text-[#1d6b3a]">The Practical Difference</span>
          <h2 class="font-heading font-black text-3xl sm:text-4xl text-[#18241b]">${c.copy.comparison.heading}</h2>
          <p class="text-sm sm:text-base text-[#57534e]">${c.copy.comparison.sub}</p>
        </div>

        <div class="bg-white rounded-3xl border border-[#d8dcd4] shadow-sm overflow-x-auto">
          <table class="w-full text-left text-xs sm:text-sm">
            <thead>
              <tr class="border-b border-[#d8dcd4] bg-[#f4f3ec]">
                <th class="p-4 sm:p-5 font-heading font-black text-[#18241b]">Feature / Scenario</th>
                <th class="p-4 sm:p-5 font-heading font-black text-[#1d6b3a] bg-[#1d6b3a]/10">Squeezy Food Tube</th>
                <th class="p-4 sm:p-5 font-heading font-extrabold text-[#57534e]">Glass Chutney Jar</th>
                <th class="p-4 sm:p-5 font-heading font-extrabold text-[#57534e]">Plastic Sachet</th>
                <th class="p-4 sm:p-5 font-heading font-extrabold text-[#57534e]">Tiffin Dabba</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-[#d8dcd4]">
              <tr>
                <td class="p-4 sm:p-5 font-bold text-[#18241b]">No spoon needed?</td>
                <td class="p-4 sm:p-5 font-black text-[#1d6b3a] bg-[#1d6b3a]/5">✅ Yes, 100% direct</td>
                <td class="p-4 sm:p-5 text-[#57534e]">❌ Impossible without spoon</td>
                <td class="p-4 sm:p-5 text-[#57534e]">⚠️ Messy corner tear</td>
                <td class="p-4 sm:p-5 text-[#57534e]">❌ Needs spoon</td>
              </tr>
              <tr>
                <td class="p-4 sm:p-5 font-bold text-[#18241b]">Reclosable after use?</td>
                <td class="p-4 sm:p-5 font-black text-[#1d6b3a] bg-[#1d6b3a]/5">✅ Snap-lock flip cap</td>
                <td class="p-4 sm:p-5 text-[#57534e]">⚠️ Sticky screw rim</td>
                <td class="p-4 sm:p-5 text-[#c8361f] font-bold">❌ Cannot reclose</td>
                <td class="p-4 sm:p-5 text-[#57534e]">⚠️ Hard to reseal cleanly</td>
              </tr>
              <tr>
                <td class="p-4 sm:p-5 font-bold text-[#18241b]">Safe to carry in bag?</td>
                <td class="p-4 sm:p-5 font-black text-[#1d6b3a] bg-[#1d6b3a]/5">✅ 100% Leakproof</td>
                <td class="p-4 sm:p-5 text-[#c8361f] font-bold">❌ Heavy, breakable glass</td>
                <td class="p-4 sm:p-5 text-[#c8361f] font-bold">❌ Bursts under pressure</td>
                <td class="p-4 sm:p-5 text-[#c8361f] font-bold">❌ Oily leakage risk</td>
              </tr>
              <tr>
                <td class="p-4 sm:p-5 font-bold text-[#18241b]">Portion control?</td>
                <td class="p-4 sm:p-5 font-black text-[#1d6b3a] bg-[#1d6b3a]/5">✅ Exact dollop control</td>
                <td class="p-4 sm:p-5 text-[#57534e]">⚠️ Clumpy uneven scoop</td>
                <td class="p-4 sm:p-5 text-[#57534e]">❌ All or nothing squirt</td>
                <td class="p-4 sm:p-5 text-[#57534e]">⚠️ Spreads over everything</td>
              </tr>
              <tr>
                <td class="p-4 sm:p-5 font-bold text-[#18241b]">Desk-lunch friendly?</td>
                <td class="p-4 sm:p-5 font-black text-[#1d6b3a] bg-[#1d6b3a]/5">✅ Fits in office drawer</td>
                <td class="p-4 sm:p-5 text-[#57534e]">❌ Bulky and oily</td>
                <td class="p-4 sm:p-5 text-[#57534e]">❌ Oily plastic trash</td>
                <td class="p-4 sm:p-5 text-[#57534e]">⚠️ Must be washed at sink</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <!-- Pack Options Section -->
      <section id="packs" class="py-16 bg-[#f4f3ec] border-t border-[#d8dcd4] px-4 sm:px-8">
        <div class="max-w-5xl mx-auto">
          <div class="text-center max-w-xl mx-auto mb-10 space-y-2">
            <span class="text-xs uppercase font-heading font-extrabold tracking-widest text-[#1d6b3a]">Curated Bundles</span>
            <h2 class="font-heading font-black text-3xl sm:text-4xl text-[#18241b]">Choose Your Pack</h2>
            <p class="text-sm sm:text-base text-[#57534e]">Try a single favourite or save more with our bestselling 3-tube Indian snack pack.</p>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
            <!-- Single Tube -->
            <div class="bg-white rounded-3xl p-6 border border-[#d8dcd4] shadow-sm flex flex-col justify-between space-y-6">
              <div class="space-y-4">
                <span class="text-[11px] uppercase font-heading font-bold text-[#57534e] tracking-wider">Daily Taster</span>
                <h3 class="font-heading font-black text-2xl text-[#18241b]">Single Tube</h3>
                <p class="text-xs text-[#57534e]">Pick any 1 flavour from our 12 recipes. Great for testing your daily desk-lunch routine.</p>
                <div class="pt-2">
                  <span class="font-heading font-black text-3xl text-[#18241b] pack-single-price">₹99</span>
                  <span class="text-xs text-[#57534e] ml-1">/ 100g tube</span>
                </div>
              </div>
              <a href="#chutneys" class="w-full text-center bg-[#f4f3ec] hover:bg-[#e2e8f0] text-[#18241b] font-heading font-black text-xs py-3 rounded-xl transition">
                Select Flavour Above ↑
              </a>
            </div>

            <!-- 3-Flavour Starter Pack (Best Value) -->
            <div class="bg-white rounded-3xl p-6 border-2 border-[#1d6b3a] shadow-md flex flex-col justify-between space-y-6 relative">
              <span class="absolute -top-3 right-6 bg-[#f2b81d] text-[#18241b] text-[10px] font-heading font-black px-3 py-1 rounded-full uppercase tracking-wider shadow-sm">
                Most Popular
              </span>
              <div class="space-y-4">
                <span class="text-[11px] uppercase font-heading font-bold text-[#1d6b3a] tracking-wider">Trio Starter Kit</span>
                <h3 class="font-heading font-black text-2xl text-[#18241b]">3-Flavour Pack</h3>
                <p class="text-xs text-[#57534e]">Pick your favourite 3 chutneys. Includes FREE metro delivery and snack-pairing guide.</p>
                <div class="pt-2">
                  <span class="font-heading font-black text-3xl text-[#1d6b3a] pack-pick3-price">₹269</span>
                  <span class="text-xs text-[#57534e] line-through ml-2 pack-pick3-strike">₹297</span>
                  <span class="text-[11px] text-[#1d6b3a] font-bold block mt-1">FREE Metro Delivery</span>
                </div>
              </div>
              <button type="button" onclick="openPick3Modal()" class="w-full bg-[#1d6b3a] hover:bg-[#134a28] text-white font-heading font-black text-sm py-3.5 rounded-xl shadow-md transition transform active:scale-95">
                Pick Your 3 Flavours ✨
              </button>
            </div>

            <!-- 5-Flavour Family Pack -->
            <div class="bg-white rounded-3xl p-6 border border-[#d8dcd4] shadow-sm flex flex-col justify-between space-y-6">
              <div class="space-y-4">
                <span class="text-[11px] uppercase font-heading font-bold text-[#57534e] tracking-wider">Full Pantry</span>
                <h3 class="font-heading font-black text-2xl text-[#18241b]">5-Flavour Pack</h3>
                <p class="text-xs text-[#57534e]">The ultimate Indian snack suite: Hari, Imli, Saunth, Garlic, and Schezwan.</p>
                <div class="pt-2">
                  <span class="font-heading font-black text-3xl text-[#18241b] pack-combo-price">₹429</span>
                  <span class="text-xs text-[#57534e] line-through ml-2 pack-combo-strike">₹495</span>
                  <span class="text-[11px] text-[#1d6b3a] font-bold block mt-1">FREE Metro Delivery</span>
                </div>
              </div>
              <button type="button" onclick="addFixedComboToCart()" class="w-full bg-[#18241b] hover:bg-black text-[#f2b81d] font-heading font-black text-xs py-3 rounded-xl transition">
                Add 5-Pack to Cart
              </button>
            </div>
          </div>
        </div>
      </section>

      <!-- Request a Regional Chutney Form -->
      <section class="py-14 px-4 sm:px-8 max-w-3xl mx-auto w-full">
        <div class="bg-white rounded-3xl p-6 sm:p-10 border border-[#d8dcd4] shadow-sm space-y-4 text-center">
          <span class="text-xs uppercase font-heading font-extrabold text-[#1d6b3a] tracking-wider">Crowdsource Your Taste</span>
          <h2 class="font-heading font-black text-2xl sm:text-3xl text-[#18241b]">Don't see your hometown chutney?</h2>
          <p class="text-xs sm:text-sm text-[#57534e] max-w-lg mx-auto">Tell us what regional chutney you miss most from home. We test new batch ideas based on customer votes.</p>
          
          <form onsubmit="handleRegionalRequest(event)" class="pt-2 flex flex-col sm:flex-row gap-2 max-w-md mx-auto">
            <input type="text" id="req-chutney-name" required placeholder="e.g. Gongura, Coconut-Garlic" class="flex-1 px-4 py-2.5 rounded-xl border border-[#d8dcd4] text-xs focus:ring-2 focus:ring-[#18241b] outline-none">
            <input type="text" id="req-chutney-region" placeholder="City / State" class="w-28 px-4 py-2.5 rounded-xl border border-[#d8dcd4] text-xs focus:ring-2 focus:ring-[#18241b] outline-none">
            <button type="submit" id="btn-req-submit" class="bg-[#18241b] text-[#f2b81d] font-heading font-black text-xs px-5 py-2.5 rounded-xl transition hover:bg-black">Vote</button>
          </form>
          <p id="req-chutney-ack" class="text-xs font-bold text-[#1d6b3a] hidden">Thanks! Your chutney vote has been recorded.</p>
        </div>
      </section>

      <!-- Honest FAQ Section -->
      <section id="faq" class="py-14 px-4 sm:px-8 max-w-3xl mx-auto w-full">
        <div class="text-center mb-10">
          <span class="text-xs uppercase font-heading font-extrabold text-[#1d6b3a] tracking-wider">Everything You Need to Know</span>
          <h2 class="font-heading font-black text-2xl sm:text-3xl text-[#18241b]">Frequently Asked Questions</h2>
        </div>

        <div class="space-y-4">
          <details class="group bg-white rounded-2xl border border-[#d8dcd4] p-5 cursor-pointer">
            <summary class="font-heading font-extrabold text-sm sm:text-base text-[#18241b] flex items-center justify-between list-none">
              <span>Are all chutneys 100% vegetarian?</span>
              <span class="text-xs text-[#57534e] group-open:rotate-180 transition">▼</span>
            </summary>
            <p class="text-xs sm:text-sm text-[#57534e] mt-3 leading-relaxed">Yes. 100% of our recipes are vegetarian and carry the certified green dot mark. We also plan to offer dedicated Jain recipes with zero onion and garlic before commercial launch.</p>
          </details>

          <details class="group bg-white rounded-2xl border border-[#d8dcd4] p-5 cursor-pointer">
            <summary class="font-heading font-extrabold text-sm sm:text-base text-[#18241b] flex items-center justify-between list-none">
              <span>How long does a tube last, and do I need to refrigerate it?</span>
              <summary-details>
              <span class="text-xs text-[#57534e] group-open:rotate-180 transition">▼</span>
            </summary>
            <p class="text-xs sm:text-sm text-[#57534e] mt-3 leading-relaxed">Full shelf life details and exact storage instructions will be published before commercial launch. The sealed tube stays fresh at ambient temperatures thanks to our EVOH barrier. Once opened, refrigeration is recommended.</p>
          </details>

          <details class="group bg-white rounded-2xl border border-[#d8dcd4] p-5 cursor-pointer">
            <summary class="font-heading font-extrabold text-sm sm:text-base text-[#18241b] flex items-center justify-between list-none">
              <span>Which cities do you deliver to?</span>
              <span class="text-xs text-[#57534e] group-open:rotate-180 transition">▼</span>
            </summary>
            <p class="text-xs sm:text-sm text-[#57534e] mt-3 leading-relaxed">We plan to deliver to all major Indian metro zones and Tier 1/2 cities including Bengaluru, Mumbai, Delhi NCR, Hyderabad, Chennai, Pune, and Kolkata. Enter your 6-digit PIN code at checkout to verify your zone.</p>
          </details>

          <details class="group bg-white rounded-2xl border border-[#d8dcd4] p-5 cursor-pointer">
            <summary class="font-heading font-extrabold text-sm sm:text-base text-[#18241b] flex items-center justify-between list-none">
              <span>What is this website? Can I buy today?</span>
              <span class="text-xs text-[#57534e] group-open:rotate-180 transition">▼</span>
            </summary>
            <p class="text-xs sm:text-sm text-[#57534e] mt-3 leading-relaxed">This is our pre-launch demand test. No money is charged and no payment card details are collected today. Placing a mock order secures your priority waitlist spot and a 20% launch day discount!</p>
          </details>
        </div>
      </section>
    </main>

    <!-- Footer -->
    <footer class="bg-[#18241b] text-[#f4f3ec] py-12 px-4 sm:px-8 border-t border-[#134a28]">
      <div class="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6 text-center md:text-left">
        <div>
          <span class="font-heading font-black text-xl text-[#f2b81d]">${c.brand.name}</span>
          <p class="text-xs text-[#d8dcd4] mt-1">${c.brand.subheadline}</p>
        </div>
        <div class="flex flex-wrap items-center justify-center gap-6 text-xs text-[#d8dcd4]">
          <a href="/shipping" class="hover:text-[#f2b81d] transition">Shipping Policy</a>
          <a href="/refunds" class="hover:text-[#f2b81d] transition">Refunds Policy</a>
          <a href="/privacy" class="hover:text-[#f2b81d] transition">Privacy Policy (DPDP Act)</a>
          <a href="/terms" class="hover:text-[#f2b81d] transition">Terms of Service</a>
          <a href="/admin" class="text-[#f2b81d] font-bold hover:underline">Admin Login</a>
        </div>
      </div>
      <div class="max-w-6xl mx-auto mt-8 pt-6 border-t border-white/10 text-center text-[11px] text-white/50">
        <p>${c.brand.copyright} • Pre-Launch Demand Test • No payments processed.</p>
      </div>
    </footer>

    <!-- Slide-in Cart Drawer -->
    <div id="cart-drawer-backdrop" onclick="toggleCartDrawer(false)" class="fixed inset-0 bg-black/50 z-50 hidden transition-opacity"></div>
    <div id="cart-drawer-panel" class="fixed top-0 right-0 h-full w-full max-w-md bg-white z-50 shadow-2xl transform translate-x-full transition-transform duration-300 flex flex-col justify-between">
      <div class="p-6 border-b border-[#d8dcd4] flex items-center justify-between">
        <div class="flex items-center space-x-2">
          <h3 class="font-heading font-black text-xl text-[#18241b]">Your Bag</h3>
          <span id="drawer-cart-count" class="bg-[#18241b] text-white text-xs font-bold px-2 py-0.5 rounded-full">0</span>
        </div>
        <button type="button" onclick="toggleCartDrawer(false)" class="text-xl font-bold text-[#57534e] hover:text-[#18241b]">✕</button>
      </div>

      <div class="p-6 overflow-y-auto flex-1 space-y-4" id="cart-items-container">
        <!-- Cart line items rendered dynamically -->
      </div>

      <div class="p-6 border-t border-[#d8dcd4] bg-[#f4f3ec] space-y-4">
        <!-- Free Shipping Progress -->
        <div class="space-y-1">
          <div class="flex items-center justify-between text-xs font-bold text-[#18241b]">
            <span id="free-shipping-text">Add items for FREE shipping</span>
            <span id="free-shipping-percent">0%</span>
          </div>
          <div class="w-full bg-[#d8dcd4] h-2 rounded-full overflow-hidden">
            <div id="free-shipping-bar" class="bg-[#1d6b3a] h-full transition-all duration-300" style="width: 0%"></div>
          </div>
        </div>

        <div class="space-y-2 text-xs">
          <div class="flex justify-between text-[#57534e]">
            <span>Subtotal</span>
            <span id="drawer-subtotal" class="font-bold text-[#18241b]">₹0</span>
          </div>
          <div class="flex justify-between text-[#57534e]">
            <span>Metro Delivery</span>
            <span id="drawer-delivery" class="font-bold text-[#1d6b3a]">FREE</span>
          </div>
          <div class="flex justify-between text-base font-black text-[#18241b] pt-2 border-t border-[#d8dcd4]">
            <span>Total</span>
            <span id="drawer-total">₹0</span>
          </div>
        </div>

        <button type="button" onclick="proceedToCheckout()" id="btn-drawer-checkout" class="w-full bg-[#1d6b3a] hover:bg-[#134a28] text-white font-heading font-black text-sm py-4 rounded-xl shadow-lg transition transform active:scale-95">
          Proceed to Checkout →
        </button>
      </div>
    </div>

    <!-- Taste Profile Modal -->
    <div id="taste-modal" class="fixed inset-0 bg-black/60 z-50 hidden flex items-center justify-center p-4">
      <div class="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 space-y-6 max-h-[90vh] overflow-y-auto relative border border-[#d8dcd4] shadow-2xl">
        <button type="button" onclick="closeTasteModal()" class="absolute top-5 right-5 text-xl font-bold text-[#57534e] hover:text-[#18241b]">✕</button>
        
        <div>
          <span id="t-hindi" class="bg-[#18241b] text-[#f2b81d] text-xs font-heading font-extrabold px-3 py-1 rounded-full">चटपटी हरी चटनी</span>
          <h3 id="t-name" class="font-heading font-black text-2xl text-[#18241b] mt-2">Chatpati Hari Chutney</h3>
          <p id="t-notes" class="text-xs text-[#57534e] mt-1 leading-relaxed">Zesty, fresh mint-coriander with chaat-stall lemon kick</p>
        </div>

        <!-- Radar / Taste Sliders -->
        <div class="space-y-3 bg-[#f4f3ec] p-4 rounded-2xl border border-[#d8dcd4]">
          <span class="text-[11px] font-heading font-black uppercase tracking-wider text-[#18241b] block mb-2">Flavor Profile Breakdown</span>
          
          <div class="space-y-1">
            <div class="flex justify-between text-xs font-bold">
              <span>Tangy / Lemon</span>
              <span id="t-tangy-val">8/10</span>
            </div>
            <div class="w-full bg-[#d8dcd4] h-2 rounded-full overflow-hidden">
              <div id="t-tangy-bar" class="bg-[#f2b81d] h-full" style="width: 80%"></div>
            </div>
          </div>

          <div class="space-y-1">
            <div class="flex justify-between text-xs font-bold">
              <span>Heat / Chilli Kick</span>
              <span id="t-heat-val">6/10</span>
            </div>
            <div class="w-full bg-[#d8dcd4] h-2 rounded-full overflow-hidden">
              <div id="t-heat-bar" class="bg-[#c8361f] h-full" style="width: 60%"></div>
            </div>
          </div>

          <div class="space-y-1">
            <div class="flex justify-between text-xs font-bold">
              <span>Sweet / Jaggery</span>
              <span id="t-sweet-val">2/10</span>
            </div>
            <div class="w-full bg-[#d8dcd4] h-2 rounded-full overflow-hidden">
              <div id="t-sweet-bar" class="bg-[#7a4a25] h-full" style="width: 20%"></div>
            </div>
          </div>

          <div class="space-y-1">
            <div class="flex justify-between text-xs font-bold">
              <span>Punch / Zing</span>
              <span id="t-punch-val">9/10</span>
            </div>
            <div class="w-full bg-[#d8dcd4] h-2 rounded-full overflow-hidden">
              <div id="t-punch-bar" class="bg-[#1d6b3a] h-full" style="width: 90%"></div>
            </div>
          </div>
        </div>

        <!-- Key Ingredients & Calories -->
        <div class="space-y-3 text-xs">
          <div>
            <span class="font-heading font-bold text-[#18241b] block mb-1">Key Ingredients</span>
            <p id="t-ingredients" class="text-[#57534e] leading-relaxed">Fresh Mint (36%), Coriander (24%), Green Chilli, Lemon, Rock Salt, Cumin</p>
          </div>
          <div>
            <span class="font-heading font-bold text-[#18241b] block mb-1">Approximate Calories</span>
            <p id="t-calories" class="text-[#57534e]">~11 kcal per 15g squeeze</p>
          </div>
        </div>

        <button type="button" id="btn-modal-add" class="w-full bg-[#1d6b3a] hover:bg-[#134a28] text-white font-heading font-black text-sm py-3.5 rounded-xl shadow-md transition">
          Add to Cart • <span id="t-modal-price">₹99</span>
        </button>
      </div>
    </div>

    <!-- Custom Pick 3 Modal -->
    <div id="pick3-modal" class="fixed inset-0 bg-black/60 z-50 hidden flex items-center justify-center p-4">
      <div class="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 space-y-6 max-h-[90vh] overflow-y-auto relative border border-[#d8dcd4] shadow-2xl">
        <button type="button" onclick="closePick3Modal()" class="absolute top-5 right-5 text-xl font-bold text-[#57534e] hover:text-[#18241b]">✕</button>
        <div>
          <span class="bg-[#1d6b3a] text-white text-xs font-heading font-bold px-3 py-1 rounded-full uppercase">3-Tube Bundle</span>
          <h3 class="font-heading font-black text-2xl text-[#18241b] mt-2">Pick Any 3 Flavours</h3>
          <p class="text-xs text-[#57534e] mt-1">Select 3 favourites to build your custom Indian chutney box.</p>
        </div>

        <div class="space-y-2 max-h-60 overflow-y-auto p-1" id="pick3-options-container">
          <!-- Flavours rendered dynamically -->
        </div>

        <div class="flex items-center justify-between pt-2 border-t border-[#d8dcd4]">
          <span class="text-xs font-bold text-[#18241b]"><span id="pick3-count">0</span> / 3 Selected</span>
          <button type="button" id="btn-confirm-pick3" onclick="confirmPick3Selection()" disabled class="bg-[#1d6b3a] disabled:bg-[#d8dcd4] disabled:text-[#57534e] text-white font-heading font-black text-xs px-6 py-3 rounded-xl transition">
            Add 3-Pack • <span id="pick3-btn-price">₹269</span>
          </button>
        </div>
      </div>
    </div>

    <!-- Mock Checkout Modal (2 Steps, NO card/UPI credentials collected) -->
    <div id="checkout-modal" class="fixed inset-0 bg-black/70 z-50 hidden flex items-center justify-center p-4">
      <div class="bg-white rounded-3xl max-w-xl w-full p-6 sm:p-8 space-y-6 max-h-[95vh] overflow-y-auto relative border border-[#d8dcd4] shadow-2xl">
        <button type="button" onclick="closeCheckoutModal()" class="absolute top-5 right-5 text-xl font-bold text-[#57534e] hover:text-[#18241b]">✕</button>

        <!-- Step 1: Delivery Details -->
        <div id="chk-step-1" class="space-y-5">
          <div>
            <span class="text-xs font-heading font-black text-[#1d6b3a] uppercase tracking-wider">Step 1 of 2</span>
            <h3 class="font-heading font-black text-2xl text-[#18241b] mt-1">Delivery Address</h3>
            <p class="text-xs text-[#57534e]">Enter your metro shipping address for pre-launch dispatch.</p>
          </div>

          <form onsubmit="handleDeliverySubmit(event)" class="space-y-3">
            <div>
              <label class="block text-xs font-bold text-[#18241b] mb-1">Full Name</label>
              <input type="text" id="chk-name" required placeholder="e.g. Rahul Sharma" class="w-full px-4 py-2.5 rounded-xl border border-[#d8dcd4] text-xs focus:ring-2 focus:ring-[#18241b] outline-none">
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label class="block text-xs font-bold text-[#18241b] mb-1">10-Digit Mobile</label>
                <input type="tel" id="chk-phone" required pattern="[6-9][0-9]{9}" placeholder="9876543210" class="w-full px-4 py-2.5 rounded-xl border border-[#d8dcd4] text-xs focus:ring-2 focus:ring-[#18241b] outline-none">
              </div>
              <div>
                <label class="block text-xs font-bold text-[#18241b] mb-1">Email</label>
                <input type="email" id="chk-email" required placeholder="name@company.com" class="w-full px-4 py-2.5 rounded-xl border border-[#d8dcd4] text-xs focus:ring-2 focus:ring-[#18241b] outline-none">
              </div>
            </div>

            <div>
              <label class="block text-xs font-bold text-[#18241b] mb-1">6-Digit PIN Code</label>
              <input type="text" id="chk-pincode" required pattern="[1-8][0-9]{5}" maxlength="6" oninput="validatePinRealtime(this.value)" placeholder="e.g. 560001" class="w-full px-4 py-2.5 rounded-xl border border-[#d8dcd4] text-xs focus:ring-2 focus:ring-[#18241b] outline-none">
              <span id="chk-pin-feedback" class="text-[11px] font-bold block mt-1 text-[#57534e]">Enter a 6-digit Indian PIN code to check serviceability</span>
            </div>

            <div>
              <label class="block text-xs font-bold text-[#18241b] mb-1">Street Address / Flat / Floor</label>
              <textarea id="chk-address" required rows="2" placeholder="Building, Office Tower, Street..." class="w-full px-4 py-2 rounded-xl border border-[#d8dcd4] text-xs focus:ring-2 focus:ring-[#18241b] outline-none"></textarea>
            </div>

            <div class="pt-2 flex items-center justify-between">
              <span class="text-xs font-black text-[#18241b]">Order Total: <span id="chk-step1-total">₹0</span></span>
              <button type="submit" class="bg-[#18241b] hover:bg-black text-[#f2b81d] font-heading font-black text-xs px-6 py-3.5 rounded-xl transition">
                Continue to Payment →
              </button>
            </div>
          </form>
        </div>

        <!-- Step 2: Mock Payment Choice (NO secret credentials) -->
        <div id="chk-step-2" class="space-y-5 hidden">
          <div>
            <span class="text-xs font-heading font-black text-[#1d6b3a] uppercase tracking-wider">Step 2 of 2</span>
            <h3 class="font-heading font-black text-2xl text-[#18241b] mt-1">Select Payment Method</h3>
            <p class="text-xs text-[#57534e]">Choose your preferred mock payment option.</p>
          </div>

          <div class="space-y-2.5">
            <button type="button" onclick="selectMockPayMethod('upi')" id="pay-opt-upi" class="w-full p-4 rounded-2xl border-2 border-[#18241b] bg-[#f4f3ec] text-left flex items-center justify-between transition">
              <div class="flex items-center space-x-3">
                <span class="text-xl">⚡</span>
                <div>
                  <span class="font-heading font-bold text-xs sm:text-sm text-[#18241b] block">Instant UPI (GPay, PhonePe, Paytm, BHIM)</span>
                  <span class="text-[11px] text-[#57534e]">Zero gateway fees</span>
                </div>
              </div>
              <span class="w-4 h-4 rounded-full border-2 border-[#18241b] flex items-center justify-center"><span class="w-2 h-2 rounded-full bg-[#18241b]"></span></span>
            </button>

            <button type="button" onclick="selectMockPayMethod('card')" id="pay-opt-card" class="w-full p-4 rounded-2xl border border-[#d8dcd4] bg-white text-left flex items-center justify-between transition">
              <div class="flex items-center space-x-3">
                <span class="text-xl">💳</span>
                <div>
                  <span class="font-heading font-bold text-xs sm:text-sm text-[#18241b] block">Credit / Debit Card</span>
                  <span class="text-[11px] text-[#57534e]">Visa, Mastercard, RuPay</span>
                </div>
              </div>
              <span class="w-4 h-4 rounded-full border border-[#d8dcd4]"></span>
            </button>

            <button type="button" onclick="selectMockPayMethod('cod')" id="pay-opt-cod" class="w-full p-4 rounded-2xl border border-[#d8dcd4] bg-white text-left flex items-center justify-between transition">
              <div class="flex items-center space-x-3">
                <span class="text-xl">💵</span>
                <div>
                  <span class="font-heading font-bold text-xs sm:text-sm text-[#18241b] block">Cash on Delivery (COD)</span>
                  <span class="text-[11px] text-[#57534e]">Pay when your tube arrives</span>
                </div>
              </div>
              <span class="w-4 h-4 rounded-full border border-[#d8dcd4]"></span>
            </button>
          </div>

          <!-- Explicit Pre-launch Disclosure -->
          <div class="p-3.5 bg-[#fef3c7] rounded-xl border border-[#fde047] text-[11px] text-[#92400e] leading-relaxed">
            <strong>Pre-Launch Demand Test Notice:</strong> No real payment is processed today. We will never ask for card numbers, CVVs, or UPI PINs.
          </div>

          <div class="pt-2 flex items-center justify-between">
            <button type="button" onclick="backToStep1()" class="text-xs font-bold text-[#57534e] hover:text-[#18241b]">← Back</button>
            <button type="button" onclick="handlePayClick()" id="btn-mock-pay" class="bg-[#1d6b3a] hover:bg-[#134a28] text-white font-heading font-black text-sm px-8 py-3.5 rounded-xl shadow-lg transition transform active:scale-95">
              Place Order • Pay <span id="chk-final-total">₹0</span>
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Honest Reveal Modal ("You haven't been charged! We're not live yet.") -->
    <div id="reveal-modal" class="fixed inset-0 bg-black/75 z-50 hidden flex items-center justify-center p-4">
      <div class="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 space-y-6 max-h-[95vh] overflow-y-auto relative border border-[#d8dcd4] shadow-2xl text-center">
        <div class="w-16 h-16 rounded-full bg-[#1d6b3a]/10 text-[#1d6b3a] mx-auto flex items-center justify-center text-3xl">
          🎉
        </div>

        <div class="space-y-2">
          <span class="bg-[#f2b81d] text-[#18241b] text-xs font-heading font-black px-3 py-1 rounded-full uppercase tracking-wider">Demand Test Reveal</span>
          <h2 class="font-heading font-black text-2xl sm:text-3xl text-[#18241b]">You haven't been charged. We're not live yet!</h2>
          <p class="text-xs sm:text-sm text-[#57534e] leading-relaxed">
            You are one of the very first people in India who tried to buy Chutney Tubes! Because you made it all the way to checkout, you've given us the confidence that people genuinely want chutney in a tube.
          </p>
        </div>

        <div class="bg-[#f4f3ec] p-5 rounded-2xl border border-[#d8dcd4] text-left space-y-3">
          <div class="flex items-start space-x-3">
            <input type="checkbox" id="rev-optin-check" checked class="mt-1 w-4 h-4 rounded text-[#1d6b3a] focus:ring-[#1d6b3a]">
            <label for="rev-optin-check" class="text-xs font-bold text-[#18241b] leading-tight">
              Get <span class="text-[#c8361f]">20% OFF</span> on launch day + WhatsApp/Email priority dispatch.
            </label>
          </div>
          <input type="text" id="rev-contact-field" placeholder="Confirm your Email or WhatsApp" class="w-full px-3.5 py-2 rounded-xl border border-[#d8dcd4] text-xs bg-white outline-none">
        </div>

        <form onsubmit="handleRevealSurveySubmit(event)" class="space-y-4 text-left">
          <span class="text-[11px] uppercase font-heading font-black tracking-wider text-[#18241b] block">Quick 2-Question Founder Survey</span>

          <div>
            <label class="block text-xs font-bold text-[#18241b] mb-1">What almost stopped you from buying today?</label>
            <input type="text" id="rev-stopped-why" placeholder="e.g. Price, wanted different flavour, doubted tube safety..." class="w-full px-3.5 py-2.5 rounded-xl border border-[#d8dcd4] text-xs outline-none focus:ring-2 focus:ring-[#18241b]">
          </div>

          <div>
            <label class="block text-xs font-bold text-[#18241b] mb-1">How often would you use chutney tubes?</label>
            <select id="rev-frequency" class="w-full px-3.5 py-2.5 rounded-xl border border-[#d8dcd4] text-xs outline-none focus:ring-2 focus:ring-[#18241b] bg-white">
              <option value="daily">Daily at desk lunch / office</option>
              <option value="few_times_week">2-3 times a week with snacks</option>
              <option value="weekly">Weekends with breakfast</option>
              <option value="rarely">Occasionally when travelling</option>
            </select>
          </div>

          <button type="submit" id="btn-submit-survey" class="w-full bg-[#18241b] hover:bg-black text-[#f2b81d] font-heading font-black text-xs py-3.5 rounded-xl transition">
            Submit & Secure 20% Launch Discount →
          </button>
        </form>

        <p id="rev-survey-done" class="text-xs font-bold text-[#1d6b3a] hidden">
          ✓ Thank you! Your VIP launch discount has been locked in.
        </p>

        <div class="pt-2">
          <a href="/" class="text-xs font-bold text-[#57534e] hover:text-[#18241b]">← Back to Chutney Tubes homepage</a>
        </div>
      </div>
    </div>

    <!-- Client-Side Logic & Event Tracking Script -->
    <script>
      const STORE_CONFIG = ${pricingJson};
      const FLAVOURS = ${flavoursJson};
      const TASTE_PROFILES = ${tasteProfilesJson};
      const POSTAL_ZONES = ${postalZonesJson};

      // 1. Sticky A/B/C Pricing & Traffic Source
      const urlParams = new URLSearchParams(window.location.search);
      const urlVariant = (urlParams.get('variant') || '').toLowerCase();
      const urlSrc = urlParams.get('src') || urlParams.get('utm_source') || 'direct';

      let currentVariant = 'a';
      if (['a', 'b', 'c'].includes(urlVariant)) {
        currentVariant = urlVariant;
        localStorage.setItem('ct_variant', currentVariant);
      } else {
        const stored = (localStorage.getItem('ct_variant') || '').toLowerCase();
        if (['a', 'b', 'c'].includes(stored)) currentVariant = stored;
      }

      if (urlSrc && urlSrc !== 'direct') {
        localStorage.setItem('ct_source', urlSrc);
      }
      const trafficSource = localStorage.getItem('ct_source') || 'direct';

      // Anonymous Visitor ID
      let visitorId = localStorage.getItem('ct_vid');
      if (!visitorId) {
        visitorId = 'v_' + Math.random().toString(36).substring(2, 10);
        localStorage.setItem('ct_vid', visitorId);
      }

      // Event Tracker
      function logEvent(name, payload = {}) {
        fetch('/api/events', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            event: name,
            visitorId: visitorId,
            variant: currentVariant,
            source: trafficSource,
            timestamp: new Date().toISOString(),
            payload: payload
          })
        }).catch(err => console.log('Track err:', err));
      }

      // Log Page View
      logEvent('page_view', { path: window.location.pathname });

      // Scroll 50 Tracker
      let scroll50Logged = false;
      window.addEventListener('scroll', () => {
        if (!scroll50Logged && (window.scrollY + window.innerHeight) >= document.body.offsetHeight * 0.5) {
          scroll50Logged = true;
          logEvent('scroll_50');
        }
      });

      // Update Variant UI Labels & Prices
      function updateVariantUI() {
        const p = STORE_CONFIG.variants[currentVariant] || STORE_CONFIG.variants.a;
        const pill = document.getElementById('variant-pill');
        if (pill) pill.textContent = 'Variant ' + currentVariant.toUpperCase() + ' (₹' + p.single + ')';

        const heroPrice = document.getElementById('hero-cta-price');
        if (heroPrice) heroPrice.textContent = '₹' + p.single;

        document.querySelectorAll('.flavour-price').forEach(el => el.textContent = '₹' + p.single);
        document.querySelectorAll('.pack-single-price').forEach(el => el.textContent = '₹' + p.single);
        document.querySelectorAll('.pack-pick3-price').forEach(el => el.textContent = '₹' + p.pick3);
        document.querySelectorAll('.pack-combo-price').forEach(el => el.textContent = '₹' + (p.single * 4.3).toFixed(0));

        const p3BtnPrice = document.getElementById('pick3-btn-price');
        if (p3BtnPrice) p3BtnPrice.textContent = '₹' + p.pick3;
      }
      updateVariantUI();

      // Spice Filtering
      function filterSpice(spice) {
        document.querySelectorAll('.flavour-card').forEach(c => {
          if (!spice || c.getAttribute('data-spice') == spice) {
            c.classList.remove('hidden');
          } else {
            c.classList.add('hidden');
          }
        });
        ['flt-all', 'flt-1', 'flt-2', 'flt-3'].forEach(id => {
          const btn = document.getElementById(id);
          if (btn) {
            btn.className = 'px-4 py-1.5 rounded-full text-xs font-bold transition bg-white text-[#18241b] border border-[#d8dcd4]';
          }
        });
        const activeBtn = document.getElementById(spice ? 'flt-' + spice : 'flt-all');
        if (activeBtn) {
          activeBtn.className = 'px-4 py-1.5 rounded-full text-xs font-bold transition bg-[#18241b] text-white';
        }
      }

      // Squeeze Simulator Controller
      let currentSnack = 'samosa';
      let currentSimFlavourColor = '#2f8f46';

      function setSimSnack(snack) {
        currentSnack = snack;
        ['samosa', 'pakora', 'toast', 'idli'].forEach(s => {
          const btn = document.getElementById('btn-snack-' + s);
          if (btn) {
            if (s === snack) {
              btn.className = 'sim-btn p-3 rounded-2xl border-2 border-[#18241b] bg-[#f4f3ec] text-xs font-bold text-[#18241b] flex items-center justify-center space-x-2 transition';
            } else {
              btn.className = 'sim-btn p-3 rounded-2xl border border-[#d8dcd4] bg-white text-xs font-bold text-[#57534e] flex items-center justify-center space-x-2 transition';
            }
          }
        });

        const snackSvg = document.getElementById('sim-snack-svg');
        if (snack === 'samosa') {
          snackSvg.innerHTML = '<polygon points=\"160,60 115,130 205,130\" fill=\"#d97706\" stroke=\"#92400e\" stroke-width=\"2\" />' +
            '<path d=\"M 160 60 Q 155 100 115 130\" stroke=\"#b45309\" stroke-width=\"2\" fill=\"none\" opacity=\"0.6\" />' +
            '<polygon points=\"160,65 125,125 195,125\" fill=\"#f59e0b\" opacity=\"0.4\" />';
        } else if (snack === 'pakora') {
          snackSvg.innerHTML = '<circle cx=\"160\" cy=\"110\" r=\"35\" fill=\"#b45309\" stroke=\"#78350f\" stroke-width=\"2\" />' +
            '<circle cx=\"145\" cy=\"95\" r=\"10\" fill=\"#d97706\" />' +
            '<circle cx=\"175\" cy=\"115\" r=\"12\" fill=\"#d97706\" />';
        } else if (snack === 'toast') {
          snackSvg.innerHTML = '<rect x=\"120\" y=\"80\" width=\"80\" height=\"60\" rx=\"6\" fill=\"#fde047\" stroke=\"#ca8a04\" stroke-width=\"2\" />' +
            '<rect x=\"130\" y=\"90\" width=\"60\" height=\"40\" rx=\"4\" fill=\"#fef08a\" opacity=\"0.8\" />';
        } else if (snack === 'idli') {
          snackSvg.innerHTML = '<ellipse cx=\"160\" cy=\"110\" rx=\"40\" ry=\"26\" fill=\"#ffffff\" stroke=\"#cbd5e1\" stroke-width=\"2\" />' +
            '<ellipse cx=\"160\" cy=\"108\" rx=\"34\" ry=\"20\" fill=\"#f8fafc\" />';
        }
        document.getElementById('sim-dollop-layer').classList.add('hidden');
        document.getElementById('sim-status-pill').textContent = 'Ready to squeeze';
      }

      function setSimFlavour(flv, color) {
        currentSimFlavourColor = color;
        ['green', 'imli', 'garlic', 'schezwan'].forEach(f => {
          const btn = document.getElementById('btn-sim-' + f);
          if (btn) {
            if (f === flv) {
              btn.className = 'sim-flv p-3 rounded-2xl border-2 border-[#18241b] bg-[#f4f3ec] text-xs font-bold text-[#18241b] flex items-center space-x-2 transition';
            } else {
              btn.className = 'sim-flv p-3 rounded-2xl border border-[#d8dcd4] bg-white text-xs font-bold text-[#57534e] flex items-center space-x-2 transition';
            }
          }
        });
        const dollop = document.getElementById('sim-dollop-ellipse');
        if (dollop) dollop.setAttribute('fill', color);
      }

      function triggerSqueezeAnimation() {
        const dollopLayer = document.getElementById('sim-dollop-layer');
        const dollop = document.getElementById('sim-dollop-ellipse');
        dollop.setAttribute('fill', currentSimFlavourColor);
        dollopLayer.classList.remove('hidden');

        const status = document.getElementById('sim-status-pill');
        status.textContent = '✓ Perfect mess-free dollop! Zero oily drip.';
        status.className = 'text-xs font-bold text-[#1d6b3a] bg-green-50 px-3 py-1 rounded-full border border-green-200 animate-bounce';
        logEvent('flavour_selected', { flavour: currentSimFlavourColor, mode: 'simulator', snack: currentSnack });
      }

      // Taste Profile Modal
      let activeModalFlavourId = 'green';
      function openTasteModal(flavourId) {
        activeModalFlavourId = flavourId;
        const f = FLAVOURS.find(x => x.id === flavourId) || FLAVOURS[0];
        const t = TASTE_PROFILES[flavourId] || TASTE_PROFILES.green;
        const p = STORE_CONFIG.variants[currentVariant] || STORE_CONFIG.variants.a;

        document.getElementById('t-hindi').textContent = f.hindi + ' चटनी';
        document.getElementById('t-name').textContent = f.name;
        document.getElementById('t-notes').textContent = t.notes;

        document.getElementById('t-tangy-val').textContent = t.tangy + '/10';
        document.getElementById('t-tangy-bar').style.width = (t.tangy * 10) + '%';
        document.getElementById('t-heat-val').textContent = t.heat + '/10';
        document.getElementById('t-heat-bar').style.width = (t.heat * 10) + '%';
        document.getElementById('t-sweet-val').textContent = t.sweet + '/10';
        document.getElementById('t-sweet-bar').style.width = (t.sweet * 10) + '%';
        document.getElementById('t-punch-val').textContent = t.punch + '/10';
        document.getElementById('t-punch-bar').style.width = (t.punch * 10) + '%';

        document.getElementById('t-ingredients').textContent = t.keyIngredients;
        document.getElementById('t-calories').textContent = t.calories;
        document.getElementById('t-modal-price').textContent = '₹' + p.single;

        document.getElementById('btn-modal-add').onclick = () => {
          addSingleToCart(flavourId);
          closeTasteModal();
        };

        document.getElementById('taste-modal').classList.remove('hidden');
        logEvent('flavour_selected', { flavour: f.name, id: flavourId, from: 'taste_modal' });
      }

      function closeTasteModal() {
        document.getElementById('taste-modal').classList.add('hidden');
      }

      // Cart Manager
      let cart = JSON.parse(localStorage.getItem('ct_cart') || '[]');

      function saveCart() {
        localStorage.setItem('ct_cart', JSON.stringify(cart));
        renderCartUI();
      }

      function addSingleToCart(flavourId) {
        const f = FLAVOURS.find(x => x.id === flavourId);
        if (!f) return;
        const existing = cart.find(x => x.kind === 'single' && x.id === flavourId);
        if (existing) {
          existing.qty += 1;
        } else {
          cart.push({ kind: 'single', id: flavourId, name: f.name, hindi: f.hindi, qty: 1 });
        }
        saveCart();
        toggleCartDrawer(true);
        logEvent('add_to_cart', { kind: 'single', flavour: f.name, id: flavourId });
      }

      function addFixedComboToCart() {
        const existing = cart.find(x => x.kind === 'combo5');
        if (existing) {
          existing.qty += 1;
        } else {
          cart.push({ kind: 'combo5', id: 'combo5', name: '5-Flavour Family Pack', hindi: 'पंच चटनी', qty: 1 });
        }
        saveCart();
        toggleCartDrawer(true);
        logEvent('add_to_cart', { kind: 'combo5', count: 5 });
      }

      // Pick 3 Modal Logic
      let selectedPick3 = [];
      function openPick3Modal() {
        selectedPick3 = ['green', 'imli', 'saunth'];
        const cont = document.getElementById('pick3-options-container');
        cont.innerHTML = FLAVOURS.map(f => {
          const checked = selectedPick3.includes(f.id);
          return '<label class="flex items-center justify-between p-3 rounded-xl border border-[#d8dcd4] bg-[#f4f3ec] hover:bg-white transition cursor-pointer">' +
            '<div class="flex items-center space-x-2">' +
              '<input type="checkbox" onchange="togglePick3Flavour(&quot;' + f.id + '&quot;)" ' + (checked ? 'checked' : '') + ' class="w-4 h-4 rounded text-[#1d6b3a] focus:ring-[#1d6b3a]">' +
              '<span class="text-xs font-bold text-[#18241b]">' + f.name + '</span>' +
            '</div>' +
            '<span class="text-[10px] text-[#57534e]">' + f.hindi + '</span>' +
          '</label>';
        }).join('');
        updatePick3State();
        document.getElementById('pick3-modal').classList.remove('hidden');
      }

      function closePick3Modal() {
        document.getElementById('pick3-modal').classList.add('hidden');
      }

      function togglePick3Flavour(id) {
        if (selectedPick3.includes(id)) {
          selectedPick3 = selectedPick3.filter(x => x !== id);
        } else {
          if (selectedPick3.length < 3) selectedPick3.push(id);
        }
        updatePick3State();
      }

      function updatePick3State() {
        document.getElementById('pick3-count').textContent = selectedPick3.length;
        const btn = document.getElementById('btn-confirm-pick3');
        btn.disabled = selectedPick3.length !== 3;
      }

      function confirmPick3Selection() {
        if (selectedPick3.length !== 3) return;
        const names = selectedPick3.map(id => (FLAVOURS.find(x => x.id === id) || {}).name || id).join(' + ');
        cart.push({
          kind: 'pick3',
          id: 'p3_' + Date.now(),
          name: '3-Flavour Custom Pack (' + names + ')',
          flavours: selectedPick3,
          qty: 1
        });
        saveCart();
        closePick3Modal();
        toggleCartDrawer(true);
        logEvent('add_to_cart', { kind: 'pick3', flavours: selectedPick3 });
      }

      function updateCartItemQty(idx, delta) {
        if (!cart[idx]) return;
        cart[idx].qty += delta;
        if (cart[idx].qty <= 0) cart.splice(idx, 1);
        saveCart();
      }

      function renderCartUI() {
        const p = STORE_CONFIG.variants[currentVariant] || STORE_CONFIG.variants.a;
        const totalItems = cart.reduce((acc, x) => acc + x.qty, 0);

        const headerCount = document.getElementById('header-cart-count');
        if (headerCount) headerCount.textContent = totalItems;
        const drawerCount = document.getElementById('drawer-cart-count');
        if (drawerCount) drawerCount.textContent = totalItems;

        const cont = document.getElementById('cart-items-container');
        if (!cont) return;

        if (cart.length === 0) {
          cont.innerHTML = '<div class="py-12 text-center text-[#57534e] space-y-2">' +
            '<p class="text-3xl">🧺</p>' +
            '<p class="text-xs font-bold">Your bag is empty.</p>' +
            '<p class="text-[11px]">Add any chutney from our 12 homestyle flavours above.</p>' +
          '</div>';
          document.getElementById('drawer-subtotal').textContent = '₹0';
          document.getElementById('drawer-total').textContent = '₹0';
          return;
        }

        let subtotal = 0;
        cont.innerHTML = cart.map((item, idx) => {
          let price = p.single;
          if (item.kind === 'pick3') price = p.pick3;
          if (item.kind === 'combo5') price = Math.round(p.single * 4.3);
          const itemTotal = price * item.qty;
          subtotal += itemTotal;

          return '<div class="flex items-center justify-between p-3 rounded-2xl bg-[#f4f3ec] border border-[#d8dcd4]">' +
            '<div>' +
              '<span class="font-heading font-extrabold text-xs text-[#18241b] block leading-tight">' + item.name + '</span>' +
              '<span class="text-[11px] text-[#57534e]">₹' + price + ' × ' + item.qty + ' = <strong>₹' + itemTotal + '</strong></span>' +
            '</div>' +
            '<div class="flex items-center space-x-1.5">' +
              '<button type="button" onclick="updateCartItemQty(' + idx + ', -1)" class="w-6 h-6 rounded-lg bg-white border border-[#d8dcd4] text-xs font-bold flex items-center justify-center">-</button>' +
              '<span class="text-xs font-bold w-4 text-center">' + item.qty + '</span>' +
              '<button type="button" onclick="updateCartItemQty(' + idx + ', 1)" class="w-6 h-6 rounded-lg bg-white border border-[#d8dcd4] text-xs font-bold flex items-center justify-center">+</button>' +
            '</div>' +
          '</div>';
        }).join('');

        const delivery = subtotal >= 249 ? 0 : 40;
        const total = subtotal + delivery;

        document.getElementById('drawer-subtotal').textContent = '₹' + subtotal;
        document.getElementById('drawer-delivery').textContent = delivery === 0 ? 'FREE' : '₹' + delivery;
        document.getElementById('drawer-total').textContent = '₹' + total;

        // Progress bar for free shipping
        const progress = Math.min(100, Math.round((subtotal / 249) * 100));
        document.getElementById('free-shipping-percent').textContent = progress + '%';
        document.getElementById('free-shipping-bar').style.width = progress + '%';
        if (progress >= 100) {
          document.getElementById('free-shipping-text').textContent = '🎉 You qualified for FREE metro delivery!';
        } else {
          document.getElementById('free-shipping-text').textContent = 'Add ₹' + (249 - subtotal) + ' more for FREE shipping';
        }
      }
      renderCartUI();

      function toggleCartDrawer(open) {
        const backdrop = document.getElementById('cart-drawer-backdrop');
        const panel = document.getElementById('cart-drawer-panel');
        if (open) {
          backdrop.classList.remove('hidden');
          panel.classList.remove('translate-x-full');
        } else {
          backdrop.classList.add('hidden');
          panel.classList.add('translate-x-full');
        }
      }

      // Checkout Controller
      function proceedToCheckout() {
        if (cart.length === 0) return;
        toggleCartDrawer(false);
        renderCartUI();
        const totalText = document.getElementById('drawer-total').textContent;
        document.getElementById('chk-step1-total').textContent = totalText;
        document.getElementById('chk-final-total').textContent = totalText;
        document.getElementById('chk-step-1').classList.remove('hidden');
        document.getElementById('chk-step-2').classList.add('hidden');
        document.getElementById('checkout-modal').classList.remove('hidden');
        logEvent('checkout_started', { cart: cart });
      }

      function closeCheckoutModal() {
        document.getElementById('checkout-modal').classList.add('hidden');
      }

      function validatePinRealtime(pin) {
        const feedback = document.getElementById('chk-pin-feedback');
        if (!pin || pin.length < 6) {
          feedback.textContent = 'Enter 6-digit Indian PIN code to check delivery';
          feedback.className = 'text-[11px] font-bold block mt-1 text-[#57534e]';
          return;
        }
        const first = pin.charAt(0);
        if (['1','2','3','4','5','6','7','8'].includes(first)) {
          const zone = POSTAL_ZONES[first] || 'Metro Zone';
          feedback.textContent = '✓ We deliver here! (' + zone + ')';
          feedback.className = 'text-[11px] font-bold block mt-1 text-[#1d6b3a]';
          logEvent('pincode_checked', { pincode: pin, isDeliverable: true, zone: zone });
        } else {
          feedback.textContent = 'Area waitlist only. We will notify you at launch.';
          feedback.className = 'text-[11px] font-bold block mt-1 text-[#c8361f]';
          logEvent('pincode_checked', { pincode: pin, isDeliverable: false });
        }
      }

      function handleDeliverySubmit(e) {
        e.preventDefault();
        document.getElementById('chk-step-1').classList.add('hidden');
        document.getElementById('chk-step-2').classList.remove('hidden');
      }

      function backToStep1() {
        document.getElementById('chk-step-2').classList.add('hidden');
        document.getElementById('chk-step-1').classList.remove('hidden');
      }

      let selectedPayMethod = 'upi';
      function selectMockPayMethod(m) {
        selectedPayMethod = m;
        ['upi', 'card', 'cod'].forEach(opt => {
          const btn = document.getElementById('pay-opt-' + opt);
          if (opt === m) {
            btn.className = 'w-full p-4 rounded-2xl border-2 border-[#18241b] bg-[#f4f3ec] text-left flex items-center justify-between transition';
          } else {
            btn.className = 'w-full p-4 rounded-2xl border border-[#d8dcd4] bg-white text-left flex items-center justify-between transition';
          }
        });
        logEvent('payment_method_selected', { method: m });
      }

      function handlePayClick() {
        const name = document.getElementById('chk-name').value;
        const phone = document.getElementById('chk-phone').value;
        const email = document.getElementById('chk-email').value;
        const pin = document.getElementById('chk-pincode').value;
        const total = document.getElementById('chk-final-total').textContent;

        logEvent('pay_clicked', {
          method: selectedPayMethod,
          total: total,
          pincodePrefix: pin.substring(0, 3)
        });

        // Pre-fill reveal contact field
        const revContact = document.getElementById('rev-contact-field');
        if (revContact) revContact.value = email || phone;

        closeCheckoutModal();
        document.getElementById('reveal-modal').classList.remove('hidden');
      }

      // Reveal Survey Controller
      function handleRevealSurveySubmit(e) {
        e.preventDefault();
        const contact = document.getElementById('rev-contact-field').value;
        const optin = document.getElementById('rev-optin-check').checked;
        const stopped = document.getElementById('rev-stopped-why').value;
        const freq = document.getElementById('rev-frequency').value;

        if (optin && contact) {
          fetch('/api/signups', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              email: contact,
              variant: currentVariant,
              visitorId: visitorId,
              utm_campaign: trafficSource
            })
          }).catch(err => console.log('Signup error:', err));
          logEvent('waitlist_optin', { contact: contact });
        }

        logEvent('survey_submitted', {
          stoppedText: stopped,
          frequency: freq
        });

        document.getElementById('btn-submit-survey').classList.add('hidden');
        document.getElementById('rev-survey-done').classList.remove('hidden');
      }

      // Regional Chutney Form Submit
      function handleRegionalRequest(e) {
        e.preventDefault();
        const name = document.getElementById('req-chutney-name').value;
        const region = document.getElementById('req-chutney-region').value;

        fetch('/api/requests', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: name,
            region: region,
            visitorId: visitorId
          })
        }).then(() => {
          document.getElementById('req-chutney-name').value = '';
          document.getElementById('req-chutney-region').value = '';
          document.getElementById('req-chutney-ack').classList.remove('hidden');
        }).catch(err => console.log('Request err:', err));
      }

      // Auto-open checkout or reveal if visited via URL
      if (window.location.pathname === '/checkout') {
        setTimeout(proceedToCheckout, 400);
      } else if (window.location.pathname === '/reveal') {
        setTimeout(() => document.getElementById('reveal-modal').classList.remove('hidden'), 400);
      }
    </script>
    `
  );
}


// Render Admin Dashboard HTML
function renderAdminDashboardHtml() {
  const c = storeConfig;
  return renderHtmlShell(
    "Admin Demand Dashboard",
    `
    <header class="bg-[#134a28] text-white py-4 px-4 sm:px-8 sticky top-0 z-30 shadow-md">
      <div class="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div class="flex items-center space-x-3">
          <a href="/" class="font-heading font-black text-xl text-[#f2b81d] hover:underline">${c.brand.name}</a>
          <span class="text-[10px] uppercase font-bold bg-[#f2b81d] text-[#18241b] px-2.5 py-0.5 rounded-full font-heading">
            Live Demand Dashboard
          </span>
        </div>
        <div class="flex flex-wrap items-center gap-2 text-xs">
          <a href="/api/export?token=admin_auth_valid" download class="bg-[#18241b] hover:bg-black text-[#f2b81d] font-heading font-bold px-3.5 py-2 rounded-xl transition">
            📥 Export Events CSV
          </a>
          <a href="/api/export?token=admin_auth_valid&type=signups" download class="bg-[#f2b81d] hover:bg-[#e2a80d] text-[#18241b] font-heading font-bold px-3.5 py-2 rounded-xl transition">
            ✨ Export Sign-ups CSV
          </a>
          <button onclick="loadAdminMetrics()" class="bg-white/10 hover:bg-white/20 text-white font-bold px-3 py-2 rounded-xl">↻ Refresh</button>
          <a href="/" class="bg-white/10 hover:bg-white/20 text-white font-bold px-3 py-2 rounded-xl">View Store →</a>
        </div>
      </div>
    </header>

    <main class="max-w-7xl mx-auto w-full p-4 sm:p-8 space-y-8">
      <!-- Password Protection Gate -->
      <div id="admin-auth-gate" class="bg-white rounded-3xl p-8 border border-[#d8dcd4] shadow-sm max-w-md mx-auto text-center space-y-4">
        <h2 class="font-heading font-black text-xl text-[#18241b]">Admin Authentication</h2>
        <p class="text-xs text-[#57534e]">Enter the store admin password to access live conversion analytics.</p>
        <form onsubmit="handleAdminLogin(event)" class="space-y-3">
          <input type="password" id="admin-pwd" required placeholder="Enter admin password (chutney2026)" class="w-full px-4 py-2.5 rounded-xl border border-[#d8dcd4] text-xs outline-none focus:ring-2 focus:ring-[#18241b]">
          <button type="submit" class="w-full bg-[#18241b] text-[#f2b81d] font-heading font-black text-xs py-3 rounded-xl hover:bg-black transition">Access Dashboard</button>
          <p id="admin-pwd-err" class="text-xs text-[#c8361f] font-bold hidden">Incorrect password.</p>
        </form>
      </div>

      <!-- Live Analytics Section -->
      <div id="admin-dashboard-content" class="space-y-8 hidden">
        <!-- Overview Stat Cards -->
        <div class="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4" id="stats-overview-cards">
          <!-- Populated by JS -->
        </div>

        <!-- Funnel Drop-off Visualizer -->
        <div class="bg-white rounded-3xl p-6 sm:p-8 border border-[#d8dcd4] shadow-sm space-y-6">
          <div class="flex items-center justify-between">
            <div>
              <h3 class="font-heading font-black text-xl text-[#18241b]">Demand Test Conversion Funnel</h3>
              <p class="text-xs text-[#57534e]">Step-by-step visitor progression from landing view to Pay Click.</p>
            </div>
            <span class="text-xs font-bold text-[#1d6b3a] bg-green-50 px-3 py-1 rounded-full border border-green-200">Live Traffic</span>
          </div>
          <div class="space-y-4" id="funnel-steps-container">
            <!-- Populated by JS -->
          </div>
        </div>

        <!-- A/B/C Pricing Breakdown & Flavour Popularity -->
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <!-- Pricing Variants Performance -->
          <div class="bg-white rounded-3xl p-6 sm:p-8 border border-[#d8dcd4] shadow-sm space-y-4">
            <h3 class="font-heading font-black text-lg text-[#18241b]">Price Elasticity (A/B/C Variants)</h3>
            <p class="text-xs text-[#57534e]">Compare purchase intent conversion rate across ₹99 vs ₹149 vs ₹199.</p>
            <div class="overflow-x-auto">
              <table class="w-full text-left text-xs">
                <thead>
                  <tr class="border-b border-[#d8dcd4] bg-[#f4f3ec]">
                    <th class="p-3 font-heading font-black text-[#18241b]">Variant</th>
                    <th class="p-3 font-heading font-black text-[#18241b]">Visitors</th>
                    <th class="p-3 font-heading font-black text-[#18241b]">Pay Clicks</th>
                    <th class="p-3 font-heading font-black text-[#18241b]">Conversion %</th>
                  </tr>
                </thead>
                <tbody id="variants-table-body" class="divide-y divide-[#d8dcd4]">
                  <!-- Populated by JS -->
                </tbody>
              </table>
            </div>
          </div>

          <!-- Top Flavours Leaderboard -->
          <div class="bg-white rounded-3xl p-6 sm:p-8 border border-[#d8dcd4] shadow-sm space-y-4">
            <h3 class="font-heading font-black text-lg text-[#18241b]">Flavour Popularity Ranking</h3>
            <p class="text-xs text-[#57534e]">Chutneys most frequently added to cart and selected in 3-packs.</p>
            <div class="space-y-2.5 max-h-72 overflow-y-auto" id="flavours-ranking-container">
              <!-- Populated by JS -->
            </div>
          </div>
        </div>

        <!-- Qualitative Customer Feedback Answers -->
        <div class="bg-white rounded-3xl p-6 sm:p-8 border border-[#d8dcd4] shadow-sm space-y-4">
          <h3 class="font-heading font-black text-lg text-[#18241b]">Customer Survey Feedback ("What almost stopped you?")</h3>
          <p class="text-xs text-[#57534e]">Unfiltered responses submitted on the reveal screen.</p>
          <div class="overflow-x-auto max-h-80 overflow-y-auto">
            <table class="w-full text-left text-xs">
              <thead>
                <tr class="border-b border-[#d8dcd4] bg-[#f4f3ec]">
                  <th class="p-3 font-heading font-black text-[#18241b]">Feedback Response</th>
                  <th class="p-3 font-heading font-black text-[#18241b]">Usage Frequency</th>
                  <th class="p-3 font-heading font-black text-[#18241b]">Variant</th>
                  <th class="p-3 font-heading font-black text-[#18241b]">Time</th>
                </tr>
              </thead>
              <tbody id="feedback-table-body" class="divide-y divide-[#d8dcd4]">
                <!-- Populated by JS -->
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </main>

    <script>
      let adminAuthToken = sessionStorage.getItem('ct_admin_token');
      if (adminAuthToken === 'admin_auth_valid') {
        showDashboard();
      }

      function handleAdminLogin(e) {
        e.preventDefault();
        const pwd = document.getElementById('admin-pwd').value;
        fetch('/api/admin', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ password: pwd })
        }).then(r => r.json()).then(data => {
          if (data.authenticated) {
            sessionStorage.setItem('ct_admin_token', 'admin_auth_valid');
            showDashboard();
          } else {
            document.getElementById('admin-pwd-err').classList.remove('hidden');
          }
        }).catch(err => {
          document.getElementById('admin-pwd-err').classList.remove('hidden');
        });
      }

      function showDashboard() {
        document.getElementById('admin-auth-gate').classList.add('hidden');
        document.getElementById('admin-dashboard-content').classList.remove('hidden');
        loadAdminMetrics();
      }

      function loadAdminMetrics() {
        fetch('/api/admin?token=admin_auth_valid')
          .then(r => r.json())
          .then(data => renderMetrics(data))
          .catch(err => console.log('Metrics error:', err));
      }

      function renderMetrics(d) {
        const ov = d.overview || {};
        
        // Overview Cards
        const cardsCont = document.getElementById('stats-overview-cards');
        cardsCont.innerHTML = [
          { label: 'Total Visitors', val: ov.totalVisitors || 0, color: 'text-[#18241b]' },
          { label: 'Add to Cart', val: ov.totalAddToCart || 0, color: 'text-[#1d6b3a]' },
          { label: 'Checkout Started', val: ov.totalCheckout || 0, color: 'text-[#18241b]' },
          { label: 'Pay Clicked', val: ov.totalPayClicked || 0, color: 'text-[#c8361f]' },
          { label: 'Conversion %', val: (ov.overallConversion || '0.0%'), color: 'text-[#1d6b3a]' },
          { label: 'VIP Sign-ups', val: ov.totalSignups || 0, color: 'text-[#f2b81d]' },
        ].map(c => '<div class="bg-white rounded-2xl p-4 border border-[#d8dcd4] shadow-sm">' +
          '<span class="text-[10px] text-[#57534e] uppercase font-bold tracking-wider block">' + c.label + '</span>' +
          '<span class="font-heading font-black text-2xl ' + c.color + ' mt-1 block">' + c.val + '</span>' +
        '</div>').join('');

        // Funnel Visualization
        const funnelCont = document.getElementById('funnel-steps-container');
        funnelCont.innerHTML = (d.funnel || []).map((step, idx) => {
          return '<div class="space-y-1.5">' +
            '<div class="flex items-center justify-between text-xs font-bold text-[#18241b]">' +
              '<span>' + (idx + 1) + '. ' + step.stage + '</span>' +
              '<span>' + step.count + ' (' + step.dropoff + ' drop)</span>' +
            '</div>' +
            '<div class="w-full bg-[#f4f3ec] h-3 rounded-full overflow-hidden border border-[#d8dcd4]">' +
              '<div class="bg-[#1d6b3a] h-full transition-all duration-500" style="width: ' + step.conversion + '"></div>' +
            '</div>' +
          '</div>';
        }).join('');

        // Variants Table
        const varBody = document.getElementById('variants-table-body');
        varBody.innerHTML = (d.variantsSummary || []).map(v => {
          return '<tr>' +
            '<td class="p-3 font-heading font-black text-[#18241b]">Variant ' + v.variant + '</td>' +
            '<td class="p-3">' + v.visitors + '</td>' +
            '<td class="p-3 font-bold text-[#1d6b3a]">' + v.payClicks + '</td>' +
            '<td class="p-3 font-black text-[#18241b]">' + v.conversionRate + '</td>' +
          '</tr>';
        }).join('');

        // Flavours Ranking
        const flvCont = document.getElementById('flavours-ranking-container');
        flvCont.innerHTML = (d.topFlavours || []).map((flv, idx) => {
          return '<div class="flex items-center justify-between p-2.5 rounded-xl bg-[#f4f3ec] text-xs">' +
            '<span class="font-bold text-[#18241b]">' + (idx + 1) + '. ' + flv.flavour + '</span>' +
            '<span class="bg-[#18241b] text-white text-[10px] font-bold px-2 py-0.5 rounded-full">' + flv.count + ' selections</span>' +
          '</div>';
        }).join('') || '<p class="text-xs text-[#57534e]">No flavour selections logged yet.</p>';

        // Feedback Table
        const fbBody = document.getElementById('feedback-table-body');
        fbBody.innerHTML = (d.surveyResponses || []).map(fb => {
          return '<tr>' +
            '<td class="p-3 font-bold text-[#18241b]">' + (fb.feedback || fb.stoppedText || '-') + '</td>' +
            '<td class="p-3 text-[#57534e]">' + (fb.frequency || '-') + '</td>' +
            '<td class="p-3 font-bold">' + (fb.variant || '-') + '</td>' +
            '<td class="p-3 text-[#57534e]">' + new Date(fb.timestamp).toLocaleTimeString() + '</td>' +
          '</tr>';
        }).join('') || '<tr><td colspan="4" class="p-4 text-center text-xs text-[#57534e]">No survey submissions yet.</td></tr>';
      }
    </script>
    `
  );
}

// HTTP Server
const server = http.createServer((req, res) => {
  const host = req.headers.host || ("localhost:" + PORT);
  const parsed = new URL(req.url, "http://" + host);
  const pathname = parsed.pathname;

  // Favicon & Images
  if (pathname === "/favicon.ico" || pathname === "/favicon.svg") {
    const favPath = path.join(PUBLIC_DIR, "favicon.svg");
    if (fs.existsSync(favPath)) {
      res.writeHead(200, { "Content-Type": "image/svg+xml" });
      return fs.createReadStream(favPath).pipe(res);
    }
    res.writeHead(204);
    return res.end();
  }

  if (pathname.startsWith("/images/")) {
    const filePath = path.join(PUBLIC_DIR, pathname);
    if (fs.existsSync(filePath)) {
      res.writeHead(200, { "Content-Type": "image/svg+xml" });
      return fs.createReadStream(filePath).pipe(res);
    }
    res.writeHead(404, { "Content-Type": "text/plain" });
    return res.end("Not Found");
  }

  // API Route: POST /api/events (and /api/track)
  if ((pathname === "/api/events" || pathname === "/api/track") && req.method === "POST") {
    let body = "";
    req.on("data", (chunk) => (body += chunk));
    req.on("end", () => {
      try {
        const parsedBody = JSON.parse(body);
        const events = readJsonFile(EVENTS_FILE);
        events.push({
          ...parsedBody,
          timestamp: parsedBody.timestamp || new Date().toISOString(),
          serverReceivedAt: new Date().toISOString(),
        });
        writeJsonFile(EVENTS_FILE, events);
        res.writeHead(201, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ success: true, count: events.length }));
      } catch (err) {
        res.writeHead(500, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: err.message }));
      }
    });
    return;
  }

  // API Route: POST /api/signups (and /api/signup)
  if ((pathname === "/api/signups" || pathname === "/api/signup") && req.method === "POST") {
    let body = "";
    req.on("data", (c) => (body += c));
    req.on("end", () => {
      try {
        const data = JSON.parse(body);
        if (!data.email) {
          res.writeHead(400, { "Content-Type": "application/json" });
          return res.end(JSON.stringify({ error: "Contact is required" }));
        }
        const signups = readJsonFile(SIGNUPS_FILE);
        signups.push({
          email: data.email.trim().toLowerCase(),
          timestamp: data.timestamp || new Date().toISOString(),
          variant: data.variant || "a",
          utm_campaign: data.utm_campaign || "direct",
          visitorId: data.visitorId || "anon",
        });
        writeJsonFile(SIGNUPS_FILE, signups);
        res.writeHead(201, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ success: true, count: signups.length }));
      } catch (err) {
        res.writeHead(500, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: err.message }));
      }
    });
    return;
  }

  // API Route: POST /api/requests (and /api/request-chutney)
  if ((pathname === "/api/requests" || pathname === "/api/request-chutney") && req.method === "POST") {
    let body = "";
    req.on("data", (c) => (body += c));
    req.on("end", () => {
      try {
        const data = JSON.parse(body);
        if (!data.name) {
          res.writeHead(400, { "Content-Type": "application/json" });
          return res.end(JSON.stringify({ error: "Chutney name is required" }));
        }
        const requests = readJsonFile(REQUESTS_FILE);
        requests.push({
          name: data.name.trim(),
          region: (data.region || "").trim(),
          timestamp: data.timestamp || new Date().toISOString(),
          visitorId: data.visitorId || "anon",
        });
        writeJsonFile(REQUESTS_FILE, requests);
        res.writeHead(201, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ success: true, count: requests.length }));
      } catch (err) {
        res.writeHead(500, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: err.message }));
      }
    });
    return;
  }

  // API Route: POST /api/admin (Login)
  if (pathname === "/api/admin" && req.method === "POST") {
    let body = "";
    req.on("data", (chunk) => (body += chunk));
    req.on("end", () => {
      try {
        const { password } = JSON.parse(body);
        const correctPassword = process.env.ADMIN_PASSWORD || "chutney2026";
        if (password === correctPassword) {
          res.writeHead(200, { "Content-Type": "application/json" });
          res.end(JSON.stringify({ authenticated: true, token: "admin_auth_valid" }));
        } else {
          res.writeHead(401, { "Content-Type": "application/json" });
          res.end(JSON.stringify({ authenticated: false, error: "Incorrect password" }));
        }
      } catch (err) {
        res.writeHead(500, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: err.message }));
      }
    });
    return;
  }

  // API Route: GET /api/admin or GET /api/admin/metrics
  if ((pathname === "/api/admin" || pathname === "/api/admin/metrics") && req.method === "GET") {
    const token = parsed.searchParams.get("token");
    const pwd = parsed.searchParams.get("password");
    const correctPassword = process.env.ADMIN_PASSWORD || "chutney2026";
    if (token !== "admin_auth_valid" && pwd !== correctPassword) {
      res.writeHead(401, { "Content-Type": "application/json" });
      return res.end(JSON.stringify({ error: "Unauthorized" }));
    }

    const events = readJsonFile(EVENTS_FILE);
    const signups = readJsonFile(SIGNUPS_FILE);
    const requests = readJsonFile(REQUESTS_FILE);

    const metrics = calculateDashboardMetrics(events, signups, requests);
    res.writeHead(200, { "Content-Type": "application/json" });
    return res.end(JSON.stringify(metrics));
  }

  // API Route: GET /api/export (CSV)
  if (pathname === "/api/export") {
    const token = parsed.searchParams.get("token");
    const pwd = parsed.searchParams.get("password");
    const correctPassword = process.env.ADMIN_PASSWORD || "chutney2026";
    const isAuth = token === "admin_auth_valid" || pwd === correctPassword;
    if (!isAuth) {
      res.writeHead(401, { "Content-Type": "text/plain" });
      return res.end("Unauthorized");
    }

    const exportType = parsed.searchParams.get("type");
    if (exportType === "signups") {
      const signups = readJsonFile(SIGNUPS_FILE);
      const csv = generateSignupsCsv(signups);
      res.writeHead(200, {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": 'attachment; filename="chutney_tubes_signups.csv"',
      });
      return res.end(csv);
    } else {
      const events = readJsonFile(EVENTS_FILE);
      const csv = generateEventsCsv(events);
      res.writeHead(200, {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": 'attachment; filename="chutney_tubes_events.csv"',
      });
      return res.end(csv);
    }
  }

  // Static Policy Pages
  if (pathname === "/shipping") {
    res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
    return res.end(
      renderHtmlShell(
        "Shipping Policy",
        `
      <header class="bg-[#134a28] text-white py-4 px-4 sm:px-8">
        <div class="max-w-4xl mx-auto flex items-center justify-between">
          <a href="/" class="font-heading font-extrabold text-xl text-[#f2b81d]">${storeConfig.brand.name}</a>
          <a href="/" class="text-xs font-bold text-[#f4f3ec] hover:text-[#f2b81d]">← Back to Shop</a>
        </div>
      </header>
      <main class="max-w-3xl mx-auto w-full p-6 sm:p-10 my-8 bg-white rounded-3xl border border-[#d8dcd4] space-y-4">
        <h1 class="font-heading font-black text-2xl text-[#18241b]">Shipping Policy</h1>
        <p class="text-sm">Every order is packed and dispatched within <strong>1–2 working days</strong>. Usually arrives in <strong>3–7 working days</strong> depending on pincode.</p>
        <p class="text-sm">Delivery charges (if applicable) are shown clearly before checkout. Tracking updates sent by SMS or email.</p>
      </main>
      <footer class="py-6 text-center text-xs text-[#57534e] border-t border-[#d8dcd4]"><p>${storeConfig.brand.copyright}</p></footer>
    `
      )
    );
  }

  if (pathname === "/refunds") {
    res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
    return res.end(
      renderHtmlShell(
        "Refunds & Cancellations",
        `
      <header class="bg-[#134a28] text-white py-4 px-4 sm:px-8">
        <div class="max-w-4xl mx-auto flex items-center justify-between">
          <a href="/" class="font-heading font-extrabold text-xl text-[#f2b81d]">${storeConfig.brand.name}</a>
          <a href="/" class="text-xs font-bold text-[#f4f3ec] hover:text-[#f2b81d]">← Back to Shop</a>
        </div>
      </header>
      <main class="max-w-3xl mx-auto w-full p-6 sm:p-10 my-8 bg-white rounded-3xl border border-[#d8dcd4] space-y-4">
        <h1 class="font-heading font-black text-2xl text-[#18241b]">Refunds &amp; Cancellations</h1>
        <p class="text-sm">Cancel any time before shipping for a full refund. Damaged, leaking or wrong tubes replaced or refunded if reported within 48 hours with a photo.</p>
        <p class="text-sm">Opened food cannot be returned for other reasons. Approved refunds processed in 5–7 working days.</p>
      </main>
      <footer class="py-6 text-center text-xs text-[#57534e] border-t border-[#d8dcd4]"><p>${storeConfig.brand.copyright}</p></footer>
    `
      )
    );
  }

  if (pathname === "/privacy") {
    res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
    return res.end(
      renderHtmlShell(
        "Privacy Policy",
        `
      <header class="bg-[#134a28] text-white py-4 px-4 sm:px-8">
        <div class="max-w-4xl mx-auto flex items-center justify-between">
          <a href="/" class="font-heading font-extrabold text-xl text-[#f2b81d]">${storeConfig.brand.name}</a>
          <a href="/" class="text-xs font-bold text-[#f4f3ec] hover:text-[#f2b81d]">← Back to Shop</a>
        </div>
      </header>
      <main class="max-w-3xl mx-auto w-full p-6 sm:p-10 my-8 bg-white rounded-3xl border border-[#d8dcd4] space-y-4">
        <h1 class="font-heading font-black text-2xl text-[#18241b]">Privacy Policy (India DPDP Act 2023 Compliant)</h1>
        <p class="text-sm">We collect only name, 10-digit mobile, email, pincode and address to process and deliver test orders. Launch notification emails or WhatsApp updates are sent strictly with consent.</p>
        <p class="text-sm font-bold">We never sell personal data. No card numbers, CVVs, or UPI PINs are ever requested or stored on our servers.</p>
        <p class="text-sm">Request complete erasure of your data at any time by emailing <a href="mailto:${storeConfig.brand.contactEmail}" class="underline font-bold text-[#1d6b3a]">${storeConfig.brand.contactEmail}</a>.</p>
      </main>
      <footer class="py-6 text-center text-xs text-[#57534e] border-t border-[#d8dcd4]"><p>${storeConfig.brand.copyright}</p></footer>
    `
      )
    );
  }

  if (pathname === "/terms") {
    res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
    return res.end(
      renderHtmlShell(
        "Terms of Service",
        `
      <header class="bg-[#134a28] text-white py-4 px-4 sm:px-8">
        <div class="max-w-4xl mx-auto flex items-center justify-between">
          <a href="/" class="font-heading font-extrabold text-xl text-[#f2b81d]">${storeConfig.brand.name}</a>
          <a href="/" class="text-xs font-bold text-[#f4f3ec] hover:text-[#f2b81d]">← Back to Shop</a>
        </div>
      </header>
      <main class="max-w-3xl mx-auto w-full p-6 sm:p-10 my-8 bg-white rounded-3xl border border-[#d8dcd4] space-y-4">
        <h1 class="font-heading font-black text-2xl text-[#18241b]">Terms of Service</h1>
        <p class="text-sm">All prices shown in INR inclusive of applicable taxes. Product visual renders are illustrations; final commercial packaging dimensions may have minor variations.</p>
        <p class="text-sm">Spice indicators are a guidance system. Please review ingredients for any food allergies before consumption.</p>
      </main>
      <footer class="py-6 text-center text-xs text-[#57534e] border-t border-[#d8dcd4]"><p>${storeConfig.brand.copyright}</p></footer>
    `
      )
    );
  }

  // Admin Dashboard (/admin)
  if (pathname === "/admin") {
    res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
    return res.end(renderAdminDashboardHtml());
  }

  // Main Landing Page (/ or /checkout or /reveal)
  if (pathname === "/" || pathname === "/index.html" || pathname === "/checkout" || pathname === "/reveal") {
    res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
    return res.end(renderMainStoreHtml());
  }

  res.writeHead(404, { "Content-Type": "text/plain" });
  res.end("Not Found");
});

if (require.main === module) {
  server.listen(PORT, () => {
    console.log("====================================================");
    console.log("  Chutney Tubes Server Running!");
    console.log("  Landing Page:     http://localhost:" + PORT);
    console.log("  Admin Dashboard:  http://localhost:" + PORT + "/admin");
    console.log("  Admin Password:   chutney2026");
    console.log("====================================================");
  });
}

module.exports = { server, renderFlavourSvg, renderHeroFannedSvg, renderHtmlShell };
