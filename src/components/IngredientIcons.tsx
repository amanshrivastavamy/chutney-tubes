// Flat, friendly Indian kitchen ingredient illustrations with crisp outlines

export function getIngredientIconSvg(iconName: string): string {
  switch (iconName.toLowerCase()) {
    case "leaf":
      return `
        <g stroke="#ffffff" stroke-width="1.5" stroke-linejoin="round">
          <!-- Mint / Coriander Leaf -->
          <path d="M16 4 C24 8 28 18 24 26 C18 28 8 24 4 16 C8 8 12 4 16 4 Z" fill="#22C55E" />
          <path d="M16 4 Q16 16 10 24" fill="none" stroke="#FFFFFF" stroke-width="1.5" />
          <path d="M15 11 Q20 12 22 16" fill="none" stroke="#FFFFFF" stroke-width="1" />
          <path d="M13 17 Q8 19 6 22" fill="none" stroke="#FFFFFF" stroke-width="1" />
        </g>`;

    case "chilli":
      return `
        <g stroke="#ffffff" stroke-width="1.5" stroke-linejoin="round">
          <!-- Red Chilli -->
          <path d="M22 6 Q24 2 27 2" fill="none" stroke="#15803D" stroke-width="2" stroke-linecap="round" />
          <path d="M20 7 C22 14 18 24 8 28 C6 28 4 27 5 25 C8 20 12 10 18 6 Z" fill="#DC2626" />
          <path d="M19 6 C20 8 22 8 23 7" fill="#15803D" stroke="#FFFFFF" stroke-width="1" />
        </g>`;

    case "greenchilli":
      return `
        <g stroke="#ffffff" stroke-width="1.5" stroke-linejoin="round">
          <!-- Green Chilli -->
          <path d="M22 6 Q24 2 27 2" fill="none" stroke="#166534" stroke-width="2" stroke-linecap="round" />
          <path d="M20 7 C22 14 18 24 8 28 C6 28 4 27 5 25 C8 20 12 10 18 6 Z" fill="#16A34A" />
          <path d="M19 6 C20 8 22 8 23 7" fill="#166534" stroke="#FFFFFF" stroke-width="1" />
        </g>`;

    case "garlic":
      return `
        <g stroke="#ffffff" stroke-width="1.5" stroke-linejoin="round">
          <!-- Garlic Clove -->
          <path d="M16 4 C18 10 26 15 25 22 C24 27 19 28 16 28 C13 28 8 27 7 22 C6 15 14 10 16 4 Z" fill="#FEF3C7" />
          <path d="M16 8 C14 14 13 22 13 28" fill="none" stroke="#D97706" stroke-width="1" />
          <path d="M16 8 C18 14 19 22 19 28" fill="none" stroke="#D97706" stroke-width="1" />
        </g>`;

    case "tamarind":
      return `
        <g stroke="#ffffff" stroke-width="1.5" stroke-linejoin="round">
          <!-- Tamarind Pod -->
          <path d="M6 10 C10 8 16 9 20 14 C24 18 26 24 25 28 C23 29 20 28 17 24 C14 20 9 17 5 15 C4 13 4 11 6 10 Z" fill="#92400E" />
          <circle cx="9" cy="12" r="2.5" fill="#78350F" stroke="#FFFFFF" stroke-width="0.8" />
          <circle cx="15" cy="16" r="2.5" fill="#78350F" stroke="#FFFFFF" stroke-width="0.8" />
          <circle cx="21" cy="22" r="2.5" fill="#78350F" stroke="#FFFFFF" stroke-width="0.8" />
        </g>`;

    case "coconut":
      return `
        <g stroke="#ffffff" stroke-width="1.5" stroke-linejoin="round">
          <!-- Coconut Half -->
          <ellipse cx="16" cy="16" rx="12" ry="12" fill="#78350F" />
          <ellipse cx="16" cy="16" rx="9" ry="9" fill="#F8FAFC" stroke="#E2E8F0" stroke-width="1.5" />
          <circle cx="16" cy="16" r="5" fill="#E2E8F0" opacity="0.6" />
        </g>`;

    case "peanut":
      return `
        <g stroke="#ffffff" stroke-width="1.5" stroke-linejoin="round">
          <!-- Peanut Shell -->
          <path d="M10 8 C14 8 16 11 16 14 C16 17 14 19 12 21 C11 23 11 26 14 28 C16 29 19 28 20 25 C21 21 19 19 18 16 C17 13 19 10 20 7 C18 4 14 5 10 8 Z" fill="#D97706" />
          <line x1="12" y1="12" x2="18" y2="24" stroke="#78350F" stroke-width="1" stroke-dasharray="2 2" />
        </g>`;

    case "tomato":
      return `
        <g stroke="#ffffff" stroke-width="1.5" stroke-linejoin="round">
          <!-- Ripe Tomato -->
          <circle cx="16" cy="18" r="10" fill="#EF4444" />
          <!-- Calyx Leaves -->
          <path d="M16 8 L14 4 M16 8 L18 4 M16 8 L11 8 M16 8 L21 8" stroke="#15803D" stroke-width="2.5" stroke-linecap="round" />
          <circle cx="16" cy="7" r="2" fill="#166534" />
        </g>`;

    case "mango":
      return `
        <g stroke="#ffffff" stroke-width="1.5" stroke-linejoin="round">
          <!-- Raw / Ripe Mango -->
          <path d="M16 4 C22 4 28 10 27 18 C26 26 18 29 14 28 C10 27 6 22 7 15 C8 9 12 4 16 4 Z" fill="#F59E0B" />
          <path d="M16 4 C15 7 12 9 8 10" fill="none" stroke="#CA8A04" stroke-width="1.2" />
          <circle cx="17" cy="4" r="1.5" fill="#15803D" stroke="#FFFFFF" stroke-width="1" />
        </g>`;

    case "mustard":
      return `
        <g stroke="#ffffff" stroke-width="1.2">
          <!-- Mustard Seeds -->
          <circle cx="8" cy="16" r="3" fill="#A16207" />
          <circle cx="16" cy="10" r="3.2" fill="#713F12" />
          <circle cx="23" cy="14" r="3" fill="#A16207" />
          <circle cx="12" cy="22" r="2.8" fill="#451A03" />
          <circle cx="19" cy="22" r="3.2" fill="#713F12" />
        </g>`;

    default:
      return `
        <g stroke="#ffffff" stroke-width="1.5">
          <circle cx="16" cy="16" r="8" fill="#F2B81D" />
          <text x="16" y="20" font-size="12" text-anchor="middle" fill="#18241B" font-weight="bold">★</text>
        </g>`;
  }
}
