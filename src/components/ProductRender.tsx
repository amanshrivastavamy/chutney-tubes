"use client";

import React from "react";
import { FlavourItem, storeConfig } from "../config/store";


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


export function renderTubeSvgString(
  flavour: FlavourItem,
  options: {
    showKatori?: boolean;
    angle?: number;
    width?: number | string;
    height?: number | string;
  } = {}
): string {
  return renderFlavourSvg(flavour, options);
}

interface ProductRenderProps {
  flavour: FlavourItem;
  className?: string;
  showKatori?: boolean;
  angle?: number;
  width?: number | string;
  height?: number | string;
}

export function ProductRender({
  flavour,
  className = "",
  showKatori = true,
  angle = -10,
  width = "100%",
  height = "100%",
}: ProductRenderProps) {
  const svgString = renderTubeSvgString(flavour, { showKatori, angle, width, height });

  return (
    <div className={`relative flex items-center justify-center ${className}`}>
      {/* Real photography fallback detection */}
      <img
        src={`/products/${flavour.id}.jpg`}
        alt={`${flavour.name} (${flavour.hindi})`}
        className="hidden w-full h-full object-contain"
        onError={(e) => {
          (e.target as HTMLElement).style.display = "none";
        }}
        onLoad={(e) => {
          (e.target as HTMLElement).classList.remove("hidden");
          const parent = (e.target as HTMLElement).parentElement;
          const svgEl = parent?.querySelector("svg");
          if (svgEl) svgEl.style.display = "none";
        }}
      />
      <div
        className="w-full h-full flex items-center justify-center"
        dangerouslySetInnerHTML={{ __html: svgString }}
      />
    </div>
  );
}

export default ProductRender;
