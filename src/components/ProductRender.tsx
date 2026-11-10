import React from "react";
import { FlavourItem, storeConfig } from "../config/store";
import { getIngredientIconSvg } from "./IngredientIcons";

interface ProductRenderProps {
  flavour: FlavourItem;
  className?: string;
  showKatori?: boolean;
  angle?: number;
  width?: number | string;
  height?: number | string;
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
  const { showKatori = true, angle = -12, width = "100%", height = "100%" } = options;
  const isLightTube = flavour.id === "coconut";
  const textColor = isLightTube ? "#18241b" : "#ffffff";
  const subTextColor = isLightTube ? "#451a03" : "#fef3c7";
  const outlineColor = isLightTube ? "none" : "#18241b";

  // Cap colour logic
  let capColor = "#f2b81d"; // haldi yellow
  let capGradientId = `capHaldi_${flavour.id}`;
  if (isLightTube) {
    capColor = "#134a28"; // deep leaf green
    capGradientId = `capGreen_${flavour.id}`;
  } else if (flavour.spice === 3) {
    capColor = "#7f1d1d"; // fiery deep red
    capGradientId = `capRed_${flavour.id}`;
  }

  const icon1 = getIngredientIconSvg(flavour.icons[0] || "leaf");
  const icon2 = getIngredientIconSvg(flavour.icons[1] || flavour.icons[0] || "chilli");

  return `
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400" width="${width}" height="${height}" fill="none">
    <defs>
      <!-- Photorealistic Cylindrical 3D Tube Shading -->
      <linearGradient id="tubeShading_${flavour.id}" x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%" stop-color="#000000" stop-opacity="0.45" />
        <stop offset="12%" stop-color="#000000" stop-opacity="0.22" />
        <stop offset="28%" stop-color="${flavour.color}" />
        <stop offset="42%" stop-color="#ffffff" stop-opacity="0.35" />
        <stop offset="48%" stop-color="#ffffff" stop-opacity="0.55" />
        <stop offset="55%" stop-color="#ffffff" stop-opacity="0.2" />
        <stop offset="78%" stop-color="${flavour.color}" />
        <stop offset="92%" stop-color="#000000" stop-opacity="0.28" />
        <stop offset="100%" stop-color="#000000" stop-opacity="0.48" />
      </linearGradient>

      <!-- Soft Studio Drop Shadow with Contact Occlusion -->
      <filter id="tubeStudioShadow_${flavour.id}" x="-30%" y="-30%" width="160%" height="160%">
        <feDropShadow dx="2" dy="20" stdDeviation="16" flood-color="#18241b" flood-opacity="0.26" />
        <feDropShadow dx="1" dy="6" stdDeviation="5" flood-color="#18241b" flood-opacity="0.18" />
      </filter>

      <!-- Brushed Stainless Steel Katori Shading -->
      <linearGradient id="steelKatori_${flavour.id}" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#f8fafc" />
        <stop offset="25%" stop-color="#e2e8f0" />
        <stop offset="50%" stop-color="#ffffff" />
        <stop offset="75%" stop-color="#cbd5e1" />
        <stop offset="100%" stop-color="#64748b" />
      </linearGradient>

      <!-- Cap Gradients -->
      <linearGradient id="capHaldi_${flavour.id}" x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%" stop-color="#b45309" />
        <stop offset="30%" stop-color="#f59e0b" />
        <stop offset="48%" stop-color="#ffffff" stop-opacity="0.6" />
        <stop offset="65%" stop-color="#f59e0b" />
        <stop offset="100%" stop-color="#92400e" />
      </linearGradient>

      <linearGradient id="capGreen_${flavour.id}" x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%" stop-color="#052e16" />
        <stop offset="30%" stop-color="#15803d" />
        <stop offset="48%" stop-color="#ffffff" stop-opacity="0.6" />
        <stop offset="65%" stop-color="#15803d" />
        <stop offset="100%" stop-color="#052e16" />
      </linearGradient>

      <linearGradient id="capRed_${flavour.id}" x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%" stop-color="#450a0a" />
        <stop offset="30%" stop-color="#b91c1c" />
        <stop offset="48%" stop-color="#ffffff" stop-opacity="0.6" />
        <stop offset="65%" stop-color="#b91c1c" />
        <stop offset="100%" stop-color="#450a0a" />
      </linearGradient>

      <!-- Luscious Chutney Sauce Sheen -->
      <linearGradient id="sauceSheen_${flavour.id}" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#ffffff" stop-opacity="0.4" />
        <stop offset="50%" stop-color="${flavour.color}" stop-opacity="0" />
        <stop offset="100%" stop-color="#000000" stop-opacity="0.35" />
      </linearGradient>
    </defs>

    <!-- Studio Floor Shadow -->
    <ellipse cx="200" cy="365" rx="140" ry="18" fill="#18241b" opacity="0.16" />
    <ellipse cx="190" cy="362" rx="100" ry="12" fill="#18241b" opacity="0.12" />

    <!-- Main Rotated Food Tube Assembly -->
    <g transform="translate(190, 185) rotate(${angle}) translate(-55, -165)" filter="url(#tubeStudioShadow_${flavour.id})">
      
      <!-- 1. TUBE BODY: High-barrier multi-layer laminate food tube -->
      <path d="M 12 38 L 98 38 C 98 175 96 235 90 252 C 85 268 74 276 55 276 C 36 276 25 268 20 252 C 14 235 12 175 12 38 Z" fill="${flavour.color}" />
      <path d="M 12 38 L 98 38 C 98 175 96 235 90 252 C 85 268 74 276 55 276 C 36 276 25 268 20 252 C 14 235 12 175 12 38 Z" fill="url(#tubeShading_${flavour.id})" />

      <!-- Specular softbox highlight stripe down the cylinder -->
      <path d="M 48 38 L 54 38 C 54 175 53 235 52 265 L 48 265 C 47 235 48 175 48 38 Z" fill="#ffffff" opacity="0.25" />

      <!-- 2. ZIGZAG CRIMPED END AT TOP WITH STAMPED BATCH CODE -->
      <rect x="10" y="16" width="90" height="24" fill="#000000" opacity="0.32" rx="2" />
      <!-- Crimp vertical teeth -->
      <path d="M 13 16 L 17 40 M 23 16 L 27 40 M 33 16 L 37 40 M 43 16 L 47 40 M 53 16 L 57 40 M 63 16 L 67 40 M 73 16 L 77 40 M 83 16 L 87 40 M 93 16 L 97 40" stroke="#ffffff" stroke-width="1.2" opacity="0.4" />
      <rect x="10" y="14" width="90" height="4" fill="#000000" opacity="0.45" />
      <!-- Stamped Batch Number into Crimp -->
      <text x="55" y="30" font-family="'Hind', sans-serif" font-size="5" font-weight="700" fill="#fde047" text-anchor="middle" letter-spacing="1.2" opacity="0.85">B.NO CT-26 • 100g</text>

      <!-- TORAN-STYLE INDIAN FOLK BORDER -->
      <g transform="translate(14, 42)">
        <polygon points="4,0 8,8 0,8" fill="#f2b81d" />
        <polygon points="14,0 18,8 10,8" fill="#f2b81d" />
        <polygon points="24,0 28,8 20,8" fill="#f2b81d" />
        <polygon points="34,0 38,8 30,8" fill="#f2b81d" />
        <polygon points="44,0 48,8 40,8" fill="#f2b81d" />
        <polygon points="54,0 58,8 50,8" fill="#f2b81d" />
        <polygon points="64,0 68,8 60,8" fill="#f2b81d" />
        <polygon points="74,0 78,8 70,8" fill="#f2b81d" />
        <circle cx="4" cy="11" r="1.1" fill="#ffffff" />
        <circle cx="14" cy="11" r="1.1" fill="#ffffff" />
        <circle cx="24" cy="11" r="1.1" fill="#ffffff" />
        <circle cx="34" cy="11" r="1.1" fill="#ffffff" />
        <circle cx="44" cy="11" r="1.1" fill="#ffffff" />
        <circle cx="54" cy="11" r="1.1" fill="#ffffff" />
        <circle cx="64" cy="11" r="1.1" fill="#ffffff" />
        <circle cx="74" cy="11" r="1.1" fill="#ffffff" />
      </g>

      <!-- 3. BRAND STICKER: Round Haldi-Yellow, slightly rotated with dashed white inner ring -->
      <g transform="translate(55, 94) rotate(-5)">
        <circle cx="0" cy="0" r="26" fill="#f2b81d" stroke="#ffffff" stroke-width="1.8" />
        <circle cx="0" cy="0" r="22" fill="none" stroke="#ffffff" stroke-width="1.3" stroke-dasharray="3 2" />
        <text x="0" y="-4" font-family="'Bricolage Grotesque', sans-serif" font-size="8.5" font-weight="900" fill="#18241b" text-anchor="middle" letter-spacing="0.5">CHUTNEY</text>
        <text x="0" y="8" font-family="'Bricolage Grotesque', sans-serif" font-size="9.5" font-weight="900" fill="#c8361f" text-anchor="middle" letter-spacing="1">TUBES</text>
      </g>

      <!-- 4. FLAVOUR NAME & DEVANAGARI HINDI TITLE -->
      <g transform="translate(55, 146)">
        <text x="0" y="0" font-family="'Bricolage Grotesque', sans-serif" font-size="10" font-weight="900" fill="${textColor}" text-anchor="middle" stroke="${outlineColor}" stroke-width="${isLightTube ? '0' : '0.6'}" letter-spacing="0.3">
          ${flavour.name.toUpperCase()}
        </text>
        <text x="0" y="13" font-family="'Hind', sans-serif" font-size="9.5" font-weight="600" fill="${subTextColor}" text-anchor="middle">
          ${flavour.hindi} चटनी
        </text>
        <line x1="-28" y1="18" x2="28" y2="18" stroke="#ffffff" stroke-width="0.9" opacity="0.65" />
      </g>

      <!-- 5. TWO INGREDIENT ILLUSTRATIONS WITH THIN WHITE OUTLINE -->
      <g transform="translate(26, 172) scale(0.85)">
        ${icon1}
      </g>
      <g transform="translate(58, 172) scale(0.85)">
        ${icon2}
      </g>

      <!-- 6. BOTTOM METRICS: Green Veg Mark & Net Weight -->
      <g transform="translate(22, 222)">
        <rect x="0" y="0" width="12" height="12" fill="#ffffff" stroke="#1d6b3a" stroke-width="1.4" rx="2" />
        <circle cx="6" cy="6" r="3.5" fill="#1d6b3a" />
      </g>
      <g transform="translate(86, 232)">
        <text x="0" y="0" font-family="'Hind', sans-serif" font-size="8.5" font-weight="700" fill="${textColor}" text-anchor="end">
          ${storeConfig.brand.netWeight}
        </text>
      </g>

      <!-- 7. SMOOTH ROUNDED KETCHUP-STYLE FLIP-CAP WITH ANTI-DRIP SPOUT -->
      <g transform="translate(37, 275)">
        <!-- Cap Neck Collar -->
        <rect x="4" y="0" width="28" height="7" fill="#000000" opacity="0.28" rx="1.5" />
        <!-- Domed Cap Body with 3D gradient -->
        <path d="M 2 5 Q 18 -1 34 5 L 32 25 C 32 30 28 33 18 33 C 8 33 4 30 4 25 Z" fill="url(#${capGradientId})" stroke="#ffffff" stroke-width="0.8" />
        <!-- Specular Highlight Curve -->
        <path d="M 8 9 Q 18 5 28 9" stroke="#ffffff" stroke-width="1.6" stroke-linecap="round" fill="none" opacity="0.6" />
        <!-- Ergonomic Thumb Flip Tab -->
        <rect x="13" y="25" width="10" height="4" rx="2" fill="#000000" opacity="0.25" />
      </g>
    </g>

    <!-- 8. BRUSHED STAINLESS STEEL KATORI BESIDE THE TUBE -->
    ${
      showKatori
        ? `
    <g transform="translate(285, 305)" filter="url(#tubeStudioShadow_${flavour.id})">
      <!-- Steel Katori Drop Shadow -->
      <ellipse cx="0" cy="38" rx="55" ry="14" fill="#18241b" opacity="0.28" />

      <!-- Lathed Brushed Steel Exterior -->
      <ellipse cx="0" cy="20" rx="50" ry="18" fill="url(#steelKatori_${flavour.id})" stroke="#94a3b8" stroke-width="1.2" />
      <path d="M -50 20 C -50 40 50 40 50 20 Z" fill="url(#steelKatori_${flavour.id})" stroke="#64748b" stroke-width="1.2" />
      
      <!-- Specular Rim Sheen -->
      <ellipse cx="0" cy="20" rx="47" ry="16" fill="none" stroke="#ffffff" stroke-width="1.2" opacity="0.8" />

      <!-- Luscious Chutney Fill Surface -->
      <ellipse cx="0" cy="18" rx="43" ry="14" fill="${flavour.color}" />
      <ellipse cx="0" cy="18" rx="43" ry="14" fill="url(#sauceSheen_${flavour.id})" />

      <!-- Fresh Chutney Swirl Highlight -->
      <path d="M -18 18 Q 0 9 18 16 Q 9 23 -4 21" stroke="#ffffff" stroke-width="2.8" stroke-linecap="round" fill="none" opacity="0.58" />
      
      <!-- Tadka Seeds (Mustard, Cumin) -->
      <circle cx="-8" cy="14" r="1.6" fill="#18241b" opacity="0.75" />
      <circle cx="10" cy="19" r="1.4" fill="#18241b" opacity="0.75" />
      <circle cx="16" cy="13" r="1.4" fill="#f2b81d" opacity="0.9" />
      <circle cx="-2" cy="22" r="1.2" fill="#fde047" opacity="0.9" />
      
      <!-- Floating Coriander Leaf Garnish -->
      <path d="M 2 12 Q 6 8 10 11 Q 7 15 2 12 Z" fill="#4ade80" />
    </g>`
        : ""
    }
  </svg>`;
}

export function ProductRender({
  flavour,
  className = "",
  showKatori = true,
  angle = -12,
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
        className="w-full h-full flex items-center justify-center transition-transform duration-300 hover:scale-105"
        dangerouslySetInnerHTML={{ __html: svgString }}
      />
    </div>
  );
}

export default ProductRender;
