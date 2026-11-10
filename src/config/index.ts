import productConfig from "./product.config.js";

export interface Flavour {
  id: string;
  name: string;
  shortDesc: string;
  fullDesc: string;
  image: string;
  inStock: boolean;
  accentColor: string;
  tag: string;
  pairing: string;
}

export interface PackOption {
  id: string;
  name: string;
  subtitle: string;
  isBundle: boolean;
  badge: string;
  benefit: string;
}

export interface PriceVariant {
  id: "A" | "B" | "C";
  label: string;
  singlePrice: number;
  threePackPrice: number;
  currencySymbol: string;
}

export interface BrandConfig {
  name: string;
  tagline: string;
  subheadline: string;
  contactEmail: string;
  supportCity: string;
  surveyDiscountPercent: number;
  adminPassword: string;
}

export const brand = productConfig.brand as BrandConfig;
export const theme = productConfig.theme;
export const pricing = productConfig.pricing;
export const flavours = productConfig.flavours as Flavour[];
export const packs = productConfig.packs as PackOption[];
export const launchPincodes = productConfig.launchPincodes as string[];
export const tubeComparisons = productConfig.tubeComparisons;
export const steps = productConfig.steps;
export const faq = productConfig.faq;

export function isPincodeDeliverable(pincode: string): boolean {
  if (!pincode || typeof pincode !== "string") return false;
  const clean = pincode.trim().replace(/\s+/g, "");
  return launchPincodes.includes(clean);
}

export function getPriceVariant(variantId?: string | null): PriceVariant {
  const v = (variantId || "").toUpperCase();
  if (v === "A" || v === "B" || v === "C") {
    return pricing.variants[v as "A" | "B" | "C"];
  }
  return pricing.variants.A;
}

export default productConfig;
