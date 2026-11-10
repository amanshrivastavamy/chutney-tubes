import React from "react";
import { FlavourItem, storeConfig } from "../config/store";
import { getIngredientIconSvg } from "./IngredientIcons";

interface ProductRenderProps {
  flavour: FlavourItem;
  className?: string;
  showKatori?: boolean;
  angle?: number;
  width?: number;
  height?: number;
}

export function renderTubeSvgString(
  flavour: FlavourItem,
  options: {
    showKatori?: boolean;
    angle?: number;
    width?: number;
    height?: number;
  } = {}
): string {
  const { showKatori = true, angle = -14, width = 360, height = 360 } = options;
  const isLightTube = flavour.id === "coconut";
  const textColor = isLightTube ? "#18241b" : "#ffffff";
  const subTextColor = isLightTube ? "#451a03" : "#fef3c7";
  const outlineColor = isLightTube ? "none" : "#18241b";

  // Cap colour logic: yellow on dark tubes, dark green on light tubes, deep shade otherwise
  let capColor = "#f2b81d"; // haldi yellow
  if (isLightTube) {
    capColor = "#134a28"; // deep leaf green
  } else if (flavour.spice === 3) {
    capColor = "#7f1d1d"; // deep red
  } else if (flavour.color === "#2f8f46") {
    capColor = "#f2b81d";
  }

  const icon1 = getIngredientIconSvg(flavour.icons[0] || "leaf");
  const icon2 = getIngredientIconSvg(flavour.icons[1] || flavour.icons[0] || "chilli");

  return `
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 360" width="${width}" height="${height}" fill="none">
    <defs>
      <!-- Cylindrical Soft Shading for Matte Food Tube -->
      <linearGradient id="tubeShading_${flavour.id}" x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%" stop-color="#000000" stop-opacity="0.32" />
        <stop offset="18%" stop-color="${flavour.color}" stop-opacity="1" />
        <stop offset="45%" stop-color="#ffffff" stop-opacity="0.22" />
        <stop offset="70%" stop-color="${flavour.color}" stop-opacity="1" />
        <stop offset="100%" stop-color="#000000" stop-opacity="0.35" />
      </linearGradient>

      <!-- Soft Shadow -->
      <filter id="tubeShadow_${flavour.id}" x="-30%" y="-30%" width="160%" height="160%">
        <feDropShadow dx="2" dy="16" stdDeviation="12" flood-color="#18241b" flood-opacity="0.22" />
      </filter>

      <!-- Steel Katori Shading -->
      <linearGradient id="steelGrad_${flavour.id}" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#f8fafc" />
        <stop offset="35%" stop-color="#e2e8f0" />
        <stop offset="70%" stop-color="#cbd5e1" />
        <stop offset="100%" stop-color="#94a3b8" />
      </linearGradient>
    </defs>

    <!-- Floor Drop Shadow for Entire Assembly -->
    <ellipse cx="180" cy="330" rx="110" ry="16" fill="#18241b" opacity="0.12" />

    <!-- Rotated Food Squeeze Tube Assembly -->
    <g transform="translate(180, 165) rotate(${angle}) translate(-50, -145)" filter="url(#tubeShadow_${flavour.id})">
      
      <!-- 1. TUBE BODY (Squeezable toothpaste-style food tube) -->
      <!-- Smooth tapering towards rounded shoulders -->
      <path d="M 12 36 L 88 36 C 88 160 86 210 82 224 C 78 238 68 244 50 244 C 32 244 22 238 18 224 C 14 210 12 160 12 36 Z" fill="${flavour.color}" />
      <!-- Cylindrical Soft Shading Overlay -->
      <path d="M 12 36 L 88 36 C 88 160 86 210 82 224 C 78 238 68 244 50 244 C 32 244 22 238 18 224 C 14 210 12 160 12 36 Z" fill="url(#tubeShading_${flavour.id})" />

      <!-- 2. ZIGZAG CRIMPED END AT TOP -->
      <!-- Darker shade band -->
      <rect x="10" y="16" width="80" height="20" fill="#000000" opacity="0.28" rx="2" />
      <!-- Zigzag ridges -->
      <path d="M 12 16 L 16 36 M 22 16 L 26 36 M 32 16 L 36 36 M 42 16 L 46 36 M 52 16 L 56 36 M 62 16 L 66 36 M 72 16 L 76 36 M 82 16 L 86 36" stroke="#ffffff" stroke-width="1.2" opacity="0.4" />
      <rect x="10" y="14" width="80" height="4" fill="#000000" opacity="0.4" />

      <!-- TORAN-STYLE BAND OF TRIANGLES AND DOTS -->
      <g transform="translate(12, 38)">
        <!-- Triangles -->
        <polygon points="4,0 8,8 0,8" fill="#f2b81d" />
        <polygon points="14,0 18,8 10,8" fill="#f2b81d" />
        <polygon points="24,0 28,8 20,8" fill="#f2b81d" />
        <polygon points="34,0 38,8 30,8" fill="#f2b81d" />
        <polygon points="44,0 48,8 40,8" fill="#f2b81d" />
        <polygon points="54,0 58,8 50,8" fill="#f2b81d" />
        <polygon points="64,0 68,8 60,8" fill="#f2b81d" />
        <polygon points="74,0 78,8 70,8" fill="#f2b81d" />
        <!-- Micro dots -->
        <circle cx="4" cy="11" r="1" fill="#ffffff" />
        <circle cx="14" cy="11" r="1" fill="#ffffff" />
        <circle cx="24" cy="11" r="1" fill="#ffffff" />
        <circle cx="34" cy="11" r="1" fill="#ffffff" />
        <circle cx="44" cy="11" r="1" fill="#ffffff" />
        <circle cx="54" cy="11" r="1" fill="#ffffff" />
        <circle cx="64" cy="11" r="1" fill="#ffffff" />
        <circle cx="74" cy="11" r="1" fill="#ffffff" />
      </g>

      <!-- 3. BRAND STICKER: Round Haldi-Yellow, slightly rotated with dashed white inner ring -->
      <g transform="translate(50, 80) rotate(-6)">
        <circle cx="0" cy="0" r="23" fill="#f2b81d" stroke="#ffffff" stroke-width="1.5" />
        <circle cx="0" cy="0" r="19.5" fill="none" stroke="#ffffff" stroke-width="1.2" stroke-dasharray="2.5 2" />
        <text x="0" y="-3" font-family="'Bricolage Grotesque', sans-serif" font-size="8" font-weight="900" fill="#18241b" text-anchor="middle" letter-spacing="0.5">CHUTNEY</text>
        <text x="0" y="8" font-family="'Bricolage Grotesque', sans-serif" font-size="9" font-weight="900" fill="#c8361f" text-anchor="middle" letter-spacing="1">TUBES</text>
      </g>

      <!-- 4. FLAVOUR NAME & DEVANAGARI HINDI TITLE -->
      <g transform="translate(50, 126)">
        <text x="0" y="0" font-family="'Bricolage Grotesque', sans-serif" font-size="8.5" font-weight="800" fill="${textColor}" text-anchor="middle" stroke="${outlineColor}" stroke-width="${isLightTube ? '0' : '0.6'}" letter-spacing="0.2">
          ${flavour.name.toUpperCase()}
        </text>
        <text x="0" y="11" font-family="'Hind', sans-serif" font-size="8" font-weight="600" fill="${subTextColor}" text-anchor="middle">
          ${flavour.hindi} चटनी
        </text>
        <line x1="-24" y1="15" x2="24" y2="15" stroke="#ffffff" stroke-width="0.8" opacity="0.6" />
      </g>

      <!-- 5. TWO INGREDIENT ILLUSTRATIONS WITH THIN WHITE OUTLINE -->
      <g transform="translate(24, 150) scale(0.75)">
        ${icon1}
      </g>
      <g transform="translate(52, 150) scale(0.75)">
        ${icon2}
      </g>

      <!-- 6. BOTTOM METRICS: Green Veg Mark & Net Weight -->
      <!-- Veg Mark (Square with Green Circle) -->
      <g transform="translate(20, 196)">
        <rect x="0" y="0" width="10" height="10" fill="#ffffff" stroke="#1d6b3a" stroke-width="1" rx="1.5" />
        <circle cx="5" cy="5" r="3" fill="#1d6b3a" />
      </g>
      <!-- Net Weight: 100 g -->
      <g transform="translate(78, 203)">
        <text x="0" y="0" font-family="'Hind', sans-serif" font-size="7.5" font-weight="600" fill="${textColor}" text-anchor="end">
          ${storeConfig.brand.netWeight}
        </text>
      </g>

      <!-- 7. SMOOTH ROUNDED KETCHUP-STYLE FLIP-CAP (NO WHITE RIBBED CAP!) -->
      <g transform="translate(34, 243)">
        <!-- Cap Neck Collar -->
        <rect x="4" y="0" width="24" height="6" fill="#000000" opacity="0.25" rx="1" />
        <!-- Smooth Rounded Domed Cap Body -->
        <path d="M 2 4 Q 16 -1 30 4 L 28 22 C 28 26 24 28 16 28 C 8 28 4 26 4 22 Z" fill="${capColor}" stroke="#ffffff" stroke-width="0.8" />
        <!-- Cap highlight slit -->
        <path d="M 8 7 Q 16 4 24 7" stroke="#ffffff" stroke-width="1.2" stroke-linecap="round" fill="none" opacity="0.45" />
        <!-- Flip spout latch -->
        <rect x="11" y="22" width="10" height="4" rx="2" fill="#000000" opacity="0.3" />
      </g>
    </g>

    <!-- 8. STEEL KATORI (BOWl) BESIDE THE TUBE -->
    ${
      showKatori
        ? `
    <g transform="translate(255, 275)" filter="url(#tubeShadow_${flavour.id})">
      <!-- Steel Katori Exterior -->
      <ellipse cx="0" cy="18" rx="42" ry="16" fill="url(#steelGrad_${flavour.id})" stroke="#94a3b8" stroke-width="1" />
      <path d="M -42 18 C -42 34 42 34 42 18 Z" fill="url(#steelGrad_${flavour.id})" stroke="#64748b" stroke-width="1" />
      
      <!-- Chutney Fill Surface -->
      <ellipse cx="0" cy="16" rx="36" ry="12" fill="${flavour.color}" />
      <!-- Fresh Chutney Swirl Highlight -->
      <path d="M -16 16 Q 0 8 16 14 Q 8 20 -4 18" stroke="#ffffff" stroke-width="2.5" stroke-linecap="round" fill="none" opacity="0.45" />
      <!-- Spice Tadka Dot Accents in Katori -->
      <circle cx="-6" cy="13" r="1.5" fill="#18241b" opacity="0.6" />
      <circle cx="8" cy="17" r="1.2" fill="#18241b" opacity="0.6" />
      <circle cx="14" cy="12" r="1.2" fill="#f2b81d" opacity="0.8" />
    </g>`
        : ""
    }
  </svg>`;
}

export function ProductRender({
  flavour,
  className = "",
  showKatori = true,
  angle = -14,
  width = 360,
  height = 360,
}: ProductRenderProps) {
  // If real photo exists in /products/{id}.jpg, Next.js can show it via standard img tag.
  // Otherwise, render the rich SVG food tube component.
  const svgString = renderTubeSvgString(flavour, { showKatori, angle, width, height });

  return (
    <div className={`relative flex items-center justify-center ${className}`}>
      {/* Fallback image detection slot */}
      <img
        src={`/products/${flavour.id}.jpg`}
        alt={`${flavour.name} (${flavour.hindi})`}
        className="hidden w-full h-full object-contain"
        onError={(e) => {
          // If image does not exist, keep SVG visible
          (e.target as HTMLElement).style.display = "none";
        }}
        onLoad={(e) => {
          // If real photo exists, reveal it and hide SVG
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
