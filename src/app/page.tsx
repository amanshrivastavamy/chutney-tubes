"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import storeConfig, {
  FlavourItem,
  getPostalZone,
  isValidPincode,
  formatInr,
} from "../config/store";
import { ProductRender } from "../components/ProductRender";
import {
  track,
  resolveVariant,
  recordLaunchSignup,
  recordChutneyRequest,
} from "../lib/tracking";

interface CartLineItem {
  id: string;
  kind: "single" | "combo" | "pick3";
  title: string;
  flavours: string[];
  quantity: number;
  unitPrice: number;
}

// Taste profile metadata for each flavour
const TASTE_PROFILES: Record<
  string,
  {
    tangy: number;
    heat: number;
    sweet: number;
    punch: number;
    notes: string;
    keyIngredients: string;
    calories: string;
  }
> = {
  green: {
    tangy: 8,
    heat: 6,
    sweet: 2,
    punch: 9,
    notes: "Zesty, fresh mint-coriander with chaat-stall lemon kick",
    keyIngredients: "Fresh Mint (36%), Coriander (24%), Green Chilli, Lemon, Rock Salt, Cumin",
    calories: "~11 kcal per 15g squeeze",
  },
  imli: {
    tangy: 7,
    heat: 2,
    sweet: 8,
    punch: 8,
    notes: "Sweet jaggery with aged tamarind and roasted cumin warmth",
    keyIngredients: "Tamarind Pulp (32%), Organic Jaggery, Dates, Roasted Jeera, Saunf, Ginger",
    calories: "~16 kcal per 15g squeeze",
  },
  saunth: {
    tangy: 7,
    heat: 6,
    sweet: 5,
    punch: 8,
    notes: "Classic golgappe chutney with spicy dry ginger warmth",
    keyIngredients: "Tamarind, Sonth (Dry Ginger), Black Pepper, Kala Namak, Jaggery",
    calories: "~14 kcal per 15g squeeze",
  },
  coconut: {
    tangy: 2,
    heat: 4,
    sweet: 2,
    punch: 8,
    notes: "Roasted dal and fresh coconut with crispy curry leaf tadka",
    keyIngredients: "Grated Coconut (42%), Roasted Chana Dal, Curry Leaves, Mustard Tadka, Green Chilli",
    calories: "~18 kcal per 15g squeeze",
  },
  peanut: {
    tangy: 4,
    heat: 6,
    sweet: 1,
    punch: 9,
    notes: "Nutty, rich roasted peanuts with red chilli and tamarind hint",
    keyIngredients: "Slow-roasted Peanuts (54%), Byadgi Chilli, Garlic, Tamarind, Rock Salt",
    calories: "~24 kcal per 15g squeeze",
  },
  tomato: {
    tangy: 8,
    heat: 5,
    sweet: 4,
    punch: 7,
    notes: "Slow-simmered juicy tomatoes with caramelized shallots",
    keyIngredients: "Country Tomatoes (48%), Small Onions, Red Chilli, Curry Leaves, Mustard Seeds",
    calories: "~12 kcal per 15g squeeze",
  },
  garlic: {
    tangy: 4,
    heat: 9,
    sweet: 1,
    punch: 10,
    notes: "Fiery, intense golden roasted garlic and crushed red chillies",
    keyIngredients: "Desi Garlic (40%), Crushed Red Mirch, Cold-pressed Mustard Oil, Cumin, Salt",
    calories: "~15 kcal per 15g squeeze",
  },
  thecha: {
    tangy: 3,
    heat: 10,
    sweet: 0,
    punch: 10,
    notes: "Coarse pounded Kolhapuri green chillies with garlic and peanuts",
    keyIngredients: "Spicy Green Chillies (45%), Roasted Peanuts, Raw Garlic, Cumin, Sea Salt",
    calories: "~19 kcal per 15g squeeze",
  },
  schezwan: {
    tangy: 6,
    heat: 8,
    sweet: 3,
    punch: 9,
    notes: "Bold Indo-Chinese street style with toasted Sichuan peppers",
    keyIngredients: "Kashmiri & Guntur Chillies, Garlic, Ginger, Sichuan Pepper, Celery, Soya",
    calories: "~14 kcal per 15g squeeze",
  },
  momo: {
    tangy: 7,
    heat: 9,
    sweet: 1,
    punch: 9,
    notes: "Steamed ripe tomatoes with stinging mountain chillies & garlic",
    keyIngredients: "Fire-roasted Tomatoes, Dalle Khursani Chillies, Garlic, Himalayan Rock Salt",
    calories: "~10 kcal per 15g squeeze",
  },
  mango: {
    tangy: 7,
    heat: 2,
    sweet: 9,
    punch: 7,
    notes: "Sweet raw mango preserves with kalonji and whole fennel",
    keyIngredients: "Raw Green Mango (44%), Jaggery, Nigella Seeds (Kalonji), Saunf, Red Chilli",
    calories: "~20 kcal per 15g squeeze",
  },
  kasundi: {
    tangy: 9,
    heat: 7,
    sweet: 1,
    punch: 10,
    notes: "Bengal's pungent, sinus-clearing mustard with raw mango punch",
    keyIngredients: "Stone-ground Mustard Seeds (38%), Raw Mango, Turmeric, Mustard Oil, Green Chilli",
    calories: "~16 kcal per 15g squeeze",
  },
};

export default function StoreHomePage() {
  const [variant, setVariant] = useState<"a" | "b" | "c">("a");
  const [cart, setCart] = useState<CartLineItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);

  // Spice filter
  const [spiceFilter, setSpiceFilter] = useState<number | null>(null);

  // Modals
  const [selectedFlavour, setSelectedFlavour] = useState<FlavourItem | null>(null);
  const [isPick3Open, setIsPick3Open] = useState(false);
  const [pick3Selected, setPick3Selected] = useState<string[]>([]);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Interactive Squeeze Simulator State
  const [simFlavour, setSimFlavour] = useState<string>("green");
  const [simSqueezeCount, setSimSqueezeCount] = useState<number>(0);
  const [isSqueezing, setIsSqueezing] = useState<boolean>(false);

  // Sticky mobile bar visibility
  const [showStickyBar, setShowStickyBar] = useState(false);

  // Packaging anatomy active tab
  const [activeAnatomyIndex, setActiveAnatomyIndex] = useState(0);

  // Chutney request box
  const [requestName, setRequestName] = useState("");
  const [requestRegion, setRequestRegion] = useState("");
  const [requestSent, setRequestSent] = useState(false);

  // Checkout flow state
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [checkoutStep, setCheckoutStep] = useState<1 | 2 | 3>(1);
  const [deliveryDetails, setDeliveryDetails] = useState({
    name: "",
    phone: "",
    email: "",
    pincode: "",
    address: "",
  });
  const [pincodeValid, setPincodeValid] = useState<boolean | null>(null);
  const [postalZone, setPostalZone] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<"upi" | "card" | "cod" | "">("");

  // Reveal Screen state
  const [tubeFeeling, setTubeFeeling] = useState("");
  const [stoppedText, setStoppedText] = useState("");
  const [frequency, setFrequency] = useState("");
  const [optInDiscount, setOptInDiscount] = useState(false);
  const [optInEmail, setOptInEmail] = useState("");
  const [revealDone, setRevealDone] = useState(false);

  // Show Toast Helper
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 2500);
  };

  // Mount logic
  useEffect(() => {
    const v = resolveVariant();
    setVariant(v);

    try {
      const savedCart = localStorage.getItem("ct_cart_items");
      if (savedCart) setCart(JSON.parse(savedCart));
    } catch (e) {}

    track("page_view", { url: window.location.pathname });

    // Scroll listener for 50% event & sticky bar
    let scrollLogged = false;
    const handleScroll = () => {
      const scrollY = window.scrollY;
      setShowStickyBar(scrollY > 400);

      if (scrollLogged) return;
      const total = document.documentElement.scrollHeight - window.innerHeight;
      if (total > 0 && scrollY / total >= 0.5) {
        scrollLogged = true;
        track("scroll_50");
      }
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Sync cart to localStorage
  useEffect(() => {
    try {
      localStorage.setItem("ct_cart_items", JSON.stringify(cart));
    } catch (e) {}
  }, [cart]);

  const pricing = storeConfig.pricing.variants[variant] || storeConfig.pricing.variants.a;
  const cartTotal = cart.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);
  const cartItemCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  // Free shipping threshold
  const freeShippingThreshold = 250;
  const freeShippingDiff = Math.max(0, freeShippingThreshold - cartTotal);

  // Cart operations
  const addToCart = (
    kind: "single" | "combo" | "pick3",
    flavours: string[],
    title: string,
    unitPrice: number
  ) => {
    const existingIndex = cart.findIndex(
      (item) => item.kind === kind && item.flavours.sort().join(",") === [...flavours].sort().join(",")
    );

    if (existingIndex > -1) {
      const updated = [...cart];
      updated[existingIndex].quantity += 1;
      setCart(updated);
    } else {
      const newItem: CartLineItem = {
        id: "item_" + Date.now().toString(36) + "_" + Math.random().toString(36).substring(2, 6),
        kind,
        title,
        flavours,
        quantity: 1,
        unitPrice,
      };
      setCart([...cart, newItem]);
    }

    track("add_to_cart", { kind, flavours, qty: 1, unitPrice, variant });
    showToast(`Added ${title} to cart`);
  };

  const updateCartQty = (id: string, delta: number) => {
    setCart((prev) =>
      prev
        .map((item) => {
          if (item.id === id) {
            const newQty = item.quantity + delta;
            return newQty > 0 ? { ...item, quantity: newQty } : null;
          }
          return item;
        })
        .filter(Boolean) as CartLineItem[]
    );
  };

  const handleSpiceFilter = (spice: number | null) => {
    setSpiceFilter(spice);
    track("spice_filter_used", { spice: spice === null ? "all" : spice });
  };

  const openProductDetail = (flavour: FlavourItem) => {
    setSelectedFlavour(flavour);
    track("product_viewed", { flavour: flavour.id });
  };

  const openPick3Modal = () => {
    setIsPick3Open(true);
    setPick3Selected([]);
    track("sampler_opened", { pack: "pick3" });
  };

  const togglePick3Flavour = (id: string) => {
    if (pick3Selected.includes(id)) {
      setPick3Selected(pick3Selected.filter((f) => f !== id));
    } else {
      if (pick3Selected.length < 3) {
        setPick3Selected([...pick3Selected, id]);
      }
    }
  };

  const confirmPick3Pack = () => {
    if (pick3Selected.length !== 3) return;
    const names = pick3Selected
      .map((id) => storeConfig.flavours.find((f) => f.id === id)?.local || id)
      .join(", ");
    addToCart("pick3", pick3Selected, `Pick Any 3 (${names})`, pricing.pick3);
    setIsPick3Open(false);
  };

  const displayedFlavours = spiceFilter
    ? storeConfig.flavours.filter((f) => f.spice === spiceFilter)
    : storeConfig.flavours;

  // Handle Squeeze Simulator Click
  const handleTriggerSqueeze = () => {
    if (isSqueezing) return;
    setIsSqueezing(true);
    setSimSqueezeCount((prev) => prev + 1);
    setTimeout(() => {
      setIsSqueezing(false);
    }, 600);
  };

  // Handle Pincode Change
  const handlePincodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/\D/g, "").slice(0, 6);
    setDeliveryDetails((prev) => ({ ...prev, pincode: val }));

    if (val.length === 6) {
      const valid = isValidPincode(val);
      setPincodeValid(valid);
      if (valid) {
        const zone = getPostalZone(val);
        setPostalZone(zone);
      } else {
        setPostalZone("");
      }
    } else {
      setPincodeValid(null);
      setPostalZone("");
    }
  };

  const handleStartCheckout = () => {
    setIsCartOpen(false);
    setIsCheckoutOpen(true);
    setCheckoutStep(1);
    track("checkout_started", { cart, total: cartTotal, variant });
  };

  const handleDetailsSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!pincodeValid || deliveryDetails.phone.length !== 10) return;

    const pinPrefix = deliveryDetails.pincode.slice(0, 3);
    track("details_submitted", { pinPrefix, zone: postalZone });
    setOptInEmail(deliveryDetails.email);
    setCheckoutStep(2);
  };

  const handleSelectPaymentMethod = (m: "upi" | "card" | "cod") => {
    setPaymentMethod(m);
    track("payment_method_selected", { method: m });
  };

  const handlePayClick = (e: React.FormEvent) => {
    e.preventDefault();
    if (!paymentMethod) return;

    const pinPrefix = deliveryDetails.pincode.slice(0, 3);
    track("pay_clicked", {
      total: cartTotal,
      items: cart,
      method: paymentMethod,
      pinPrefix,
      zone: postalZone,
      variant,
    });
    setCheckoutStep(3);
  };

  const handleRevealSurveySubmit = (e: React.FormEvent) => {
    e.preventDefault();

    track("survey_submitted", {
      tubeFeeling,
      stoppedText: stoppedText.trim(),
      frequency,
      optedIn: optInDiscount,
    });

    if (optInDiscount && optInEmail) {
      recordLaunchSignup(optInEmail);
    }

    setRevealDone(true);
    setDeliveryDetails({
      name: "",
      phone: "",
      email: "",
      pincode: "",
      address: "",
    });
    setCart([]);
    try {
      localStorage.removeItem("ct_cart_items");
    } catch (e) {}
  };

  const handleChutneyRequestSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!requestName.trim()) return;

    recordChutneyRequest(requestName.trim(), requestRegion.trim());
    setRequestSent(true);
    showToast("Thank you! Your regional chutney request was logged.");
    setTimeout(() => {
      setRequestName("");
      setRequestRegion("");
      setRequestSent(false);
    }, 3000);
  };

  // Current simulated flavour item
  const currentSimFlavour =
    storeConfig.flavours.find((f) => f.id === simFlavour) || storeConfig.flavours[0];

  return (
    <div className="flex flex-col min-h-screen bg-[#f4f3ec] text-[#18241b]">
      {/* 1. Announcement Bar */}
      <div className="bg-[#18241b] text-[#f4f3ec] text-xs sm:text-sm font-medium py-2 px-4 text-center tracking-wide flex items-center justify-center space-x-2">
        <span className="w-2 h-2 rounded-full bg-[#f2b81d] animate-pulse" />
        <span>{storeConfig.copy.announcement}</span>
        <span className="hidden sm:inline text-white/50">•</span>
        <span className="hidden sm:inline text-xs text-[#f2b81d]">Desk-Safe &amp; Squeezable</span>
      </div>

      {/* 2. Sticky Header */}
      <header className="sticky top-0 z-40 bg-[#134a28] text-white px-4 sm:px-8 py-3.5 border-b border-[#18241b] shadow-md flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Link href="/" className="flex items-center space-x-2.5 group">
            <div className="w-8 h-8 rounded-lg bg-[#f2b81d] flex items-center justify-center p-1 shadow-sm transition transform group-hover:rotate-6">
              <svg viewBox="0 0 32 32" className="w-6 h-6" fill="none">
                <rect x="6" y="2" width="20" height="4" fill="#ca8a04" rx="1" />
                <path d="M 6 6 L 26 6 C 26 22 25 26 23 28 C 21 30 19 31 16 31 C 13 31 11 30 9 28 C 7 26 6 22 6 6 Z" fill="#18241b" />
                <circle cx="16" cy="18" r="4" fill="#c8361f" />
              </svg>
            </div>
            <span className="font-heading font-extrabold text-xl sm:text-2xl tracking-tight text-[#f2b81d] group-hover:text-white transition">
              {storeConfig.brand.name}
            </span>
          </Link>
        </div>

        <nav className="hidden md:flex items-center space-x-7 text-sm font-semibold text-[#f4f3ec]">
          <a href="#simulator" className="hover:text-[#f2b81d] transition">Try The Squeeze</a>
          <a href="#chutneys" className="hover:text-[#f2b81d] transition">All 12 Chutneys</a>
          <a href="#anatomy" className="hover:text-[#f2b81d] transition">Packaging</a>
          <a href="#packs" className="hover:text-[#f2b81d] transition">Packs</a>
          <a href="#faq" className="hover:text-[#f2b81d] transition">FAQ</a>
        </nav>

        <button
          type="button"
          onClick={() => setIsCartOpen(true)}
          className="bg-[#f2b81d] hover:bg-[#e2a80d] text-[#18241b] font-heading font-black text-xs sm:text-sm px-4 py-2 rounded-full shadow-md flex items-center space-x-2 transition transform active:scale-95"
          aria-label="Open Cart"
        >
          <span>Lunch Bag</span>
          <span className="w-5 h-5 rounded-full bg-[#18241b] text-white flex items-center justify-center text-xs font-bold">
            {cartItemCount}
          </span>
        </button>
      </header>

      {/* 3. HERO SECTION (Leaf Green with 3D Studio Trio Render) */}
      <section className="bg-gradient-to-b from-[#1d6b3a] to-[#134a28] text-white pt-10 pb-16 px-4 sm:px-8 border-b border-[#134a28] overflow-hidden">
        <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          {/* Left Text */}
          <div className="lg:col-span-7 space-y-5 text-left">
            <div className="inline-flex items-center space-x-2 bg-white/10 backdrop-blur-md px-3.5 py-1.5 rounded-full border border-white/20">
              <span className="w-2 h-2 rounded-full bg-[#f2b81d]" />
              <span className="text-[11px] font-heading font-bold text-[#f2b81d] uppercase tracking-wider">
                India's First Everyday Chutney in a Squeeze Tube
              </span>
            </div>

            <h1 className="font-heading font-extrabold text-4xl sm:text-5xl lg:text-6xl text-white leading-[1.12] tracking-tight">
              {storeConfig.copy.hero.headlinePart1}{" "}
              <span className="text-[#f2b81d]">{storeConfig.copy.hero.headlineHighlight}</span>
            </h1>

            <p className="text-base sm:text-xl text-[#f4f3ec] leading-relaxed max-w-xl font-normal">
              {storeConfig.copy.hero.sub}
            </p>

            <div className="pt-2 flex flex-wrap items-center gap-3">
              <a
                href="#chutneys"
                className="bg-[#f2b81d] hover:bg-[#e2a80d] text-[#18241b] font-heading font-black text-sm sm:text-base px-7 py-3.5 rounded-xl shadow-xl transition transform active:scale-95 flex items-center space-x-2"
              >
                <span>{storeConfig.copy.hero.exploreCta}</span>
                <span>→</span>
              </a>
              <a
                href="#simulator"
                className="border-2 border-white/80 hover:border-white text-white font-heading font-black text-sm sm:text-base px-6 py-3 rounded-xl transition hover:bg-white/10 flex items-center space-x-2"
              >
                <span>Try Squeeze Simulator</span>
                <span>✨</span>
              </a>
            </div>

            {/* Quick Proof Badges */}
            <div className="pt-4 flex flex-wrap items-center gap-4 text-xs text-[#d8dcd4]">
              <span className="flex items-center space-x-1.5">
                <span className="text-[#f2b81d]">✓</span>
                <span>Zero Spoons Needed</span>
              </span>
              <span className="flex items-center space-x-1.5">
                <span className="text-[#f2b81d]">✓</span>
                <span>100% Bag Leak-Proof</span>
              </span>
              <span className="flex items-center space-x-1.5">
                <span className="text-[#f2b81d]">✓</span>
                <span>100% Vegetarian</span>
              </span>
            </div>
          </div>

          {/* Right Visual: 3D Photorealistic Studio Tubes Assembly */}
          <div className="lg:col-span-5 flex justify-center lg:justify-end">
            <div className="w-full max-w-md sm:max-w-lg relative group">
              <img
                src="/images/hero-fanned-tubes.svg"
                alt="Chutney Tubes fanned trio with hot crispy samosa and steel katori"
                className="w-full h-auto object-contain drop-shadow-2xl transition-transform duration-500 group-hover:scale-102"
              />
              <div className="absolute -bottom-2 right-4 bg-white/90 backdrop-blur-md text-[#18241b] text-[11px] font-heading font-black px-3 py-1 rounded-full shadow-lg border border-[#d8dcd4] hidden sm:flex items-center space-x-1.5">
                <span className="text-[#1d6b3a]">●</span>
                <span>100g Pocket Ergonomics</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 4. TRUST STRIP */}
      <section className="bg-white border-b border-[#d8dcd4] py-6 px-4 sm:px-8">
        <div className="max-w-6xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
          {storeConfig.copy.trustStrip.map((item, idx) => (
            <div key={idx} className="flex flex-col items-center justify-center p-2 space-y-1">
              <div className="w-8 h-8 rounded-full bg-[#f4f3ec] text-[#1d6b3a] flex items-center justify-center font-black text-sm">
                ✓
              </div>
              <span className="font-heading font-extrabold text-xs sm:text-sm text-[#18241b]">
                {item.title}
              </span>
              <span className="text-[11px] text-[#57534e] hidden sm:block">
                {item.desc}
              </span>
            </div>
          ))}
        </div>
      </section>

      {/* 5. INTERACTIVE "TRY THE SQUEEZE" SIMULATOR */}
      <section id="simulator" className="py-14 px-4 sm:px-8 bg-[#f4f3ec] border-b border-[#d8dcd4]">
        <div className="max-w-5xl mx-auto bg-white rounded-3xl p-6 sm:p-10 border border-[#d8dcd4] shadow-sm">
          <div className="text-center max-w-xl mx-auto mb-8 space-y-2">
            <div className="inline-flex items-center space-x-1.5 bg-[#f2b81d]/20 text-[#18241b] text-[11px] font-heading font-extrabold px-3 py-1 rounded-full uppercase tracking-wider">
              <span>Interactive Demonstration</span>
            </div>
            <h2 className="font-heading font-black text-2xl sm:text-4xl text-[#18241b]">
              See How It Squeezes
            </h2>
            <p className="text-xs sm:text-sm text-[#57534e]">
              No jar to unscrew. No dirty spoon to wash. Just flip the cap, squeeze your exact swirl onto a samosa or paratha, and snap it shut.
            </p>

            {/* Simulator Flavour Switcher */}
            <div className="flex flex-wrap items-center justify-center gap-2 pt-3">
              {[
                { id: "green", name: "Hari Chutney", color: "#2f8f46" },
                { id: "imli", name: "Imli Chutney", color: "#7a4a25" },
                { id: "thecha", name: "Kolhapuri Thecha", color: "#3b5c2a" },
                { id: "garlic", name: "Teekhi Lehsuni", color: "#c23a1a" },
              ].map((flv) => (
                <button
                  key={flv.id}
                  type="button"
                  onClick={() => setSimFlavour(flv.id)}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-heading font-bold transition flex items-center space-x-1.5 ${
                    simFlavour === flv.id
                      ? "bg-[#18241b] text-white shadow-sm"
                      : "bg-[#f4f3ec] text-[#18241b] hover:bg-[#d8dcd4]"
                  }`}
                >
                  <span
                    className="w-2.5 h-2.5 rounded-full"
                    style={{ backgroundColor: flv.color }}
                  />
                  <span>{flv.name}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Interactive Squeeze Stage */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-center bg-[#f4f3ec] rounded-2xl p-6 border border-[#d8dcd4]">
            {/* Left: Animated Squeeze Tube & Target Samosa */}
            <div className="md:col-span-7 flex flex-col items-center justify-center relative min-h-[280px]">
              {/* Squeeze Tube Graphic */}
              <div
                onClick={handleTriggerSqueeze}
                className={`cursor-pointer transition-transform duration-300 select-none ${
                  isSqueezing ? "scale-95 -translate-y-1" : "hover:scale-105"
                }`}
              >
                <div className="w-56 h-56">
                  <ProductRender flavour={currentSimFlavour} showKatori={false} angle={-25} />
                </div>
              </div>

              {/* Squeezed Dollop Animation onto Plate */}
              <div className="mt-[-20px] text-center">
                <div className="relative inline-block">
                  {/* Plate / Samosa base */}
                  <div className="w-36 h-12 bg-[#e2e8f0] rounded-full border border-[#cbd5e1] shadow-inner flex items-center justify-center relative">
                    <span className="text-xs font-bold text-[#64748b]">Tiffin Plate</span>
                    
                    {/* Simulated Swirl Dollop */}
                    {simSqueezeCount > 0 && (
                      <div
                        className="absolute inset-x-0 top-1/2 -translate-y-1/2 mx-auto w-10 h-7 rounded-full shadow-md animate-pulse"
                        style={{
                          backgroundColor: currentSimFlavour.color,
                          boxShadow: `0 4px 10px ${currentSimFlavour.color}80`,
                        }}
                      />
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Right: Squeeze Action Panel */}
            <div className="md:col-span-5 space-y-4 text-left">
              <div className="space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#1d6b3a]">
                  Step 2 in Action
                </span>
                <h3 className="font-heading font-black text-xl text-[#18241b]">
                  {currentSimFlavour.name}
                </h3>
                <p className="text-xs text-[#57534e]">
                  {currentSimFlavour.desc}
                </p>
              </div>

              {/* Squeeze Counter & Benefits */}
              <div className="bg-white rounded-xl p-4 border border-[#d8dcd4] space-y-2 text-xs">
                <div className="flex justify-between items-center font-bold">
                  <span>Portion Squeezed:</span>
                  <span className="text-[#1d6b3a]">
                    {simSqueezeCount === 0 ? "Ready to squeeze" : `${simSqueezeCount} squeeze done (~${simSqueezeCount * 12} kcal)`}
                  </span>
                </div>
                <div className="w-full bg-[#f4f3ec] h-2 rounded-full overflow-hidden">
                  <div
                    className="bg-[#1d6b3a] h-full transition-all duration-300"
                    style={{ width: `${Math.min(100, simSqueezeCount * 25)}%` }}
                  />
                </div>
                <p className="text-[11px] text-[#57534e]">
                  One 100g tube contains approximately <strong>8–12 desk lunch servings</strong>.
                </p>
              </div>

              {/* Action Buttons */}
              <div className="space-y-2 pt-1">
                <button
                  type="button"
                  onClick={handleTriggerSqueeze}
                  className="w-full bg-[#f2b81d] hover:bg-[#e2a80d] text-[#18241b] font-heading font-black text-sm py-3 rounded-xl shadow-md transition transform active:scale-95 flex items-center justify-center space-x-2"
                >
                  <span>{isSqueezing ? "Squeezing Chutney..." : "Tap to Squeeze Chutney"}</span>
                  <span>✨</span>
                </button>

                <button
                  type="button"
                  onClick={() =>
                    addToCart("single", [currentSimFlavour.id], currentSimFlavour.name, pricing.single)
                  }
                  className="w-full bg-[#18241b] hover:bg-[#134a28] text-white font-heading font-bold text-xs py-2.5 rounded-xl shadow transition"
                >
                  Add {currentSimFlavour.local} to Cart · {formatInr(pricing.single)}
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 6. CATALOGUE (All 12 Everyday Indian Chutneys) */}
      <section id="chutneys" className="py-16 px-4 sm:px-8 max-w-6xl mx-auto w-full">
        <div className="text-center max-w-2xl mx-auto mb-10 space-y-2">
          <div className="inline-flex items-center space-x-1.5 bg-[#1d6b3a]/10 text-[#1d6b3a] text-[11px] font-heading font-extrabold px-3 py-1 rounded-full uppercase tracking-wider">
            <span>Everyday Indian Food Lineup</span>
          </div>
          <h2 className="font-heading font-black text-3xl sm:text-4xl text-[#18241b]">
            {storeConfig.copy.catalogue.h2}
          </h2>
          <p className="text-sm sm:text-base text-[#57534e]">
            {storeConfig.copy.catalogue.lede}
          </p>

          {/* Spice Filter Chips */}
          <div className="flex flex-wrap items-center justify-center gap-2 pt-4">
            <button
              type="button"
              onClick={() => handleSpiceFilter(null)}
              className={`px-4 py-1.5 rounded-full text-xs font-bold transition ${
                spiceFilter === null
                  ? "bg-[#18241b] text-white shadow-sm"
                  : "bg-white text-[#18241b] border border-[#d8dcd4] hover:border-[#18241b]"
              }`}
            >
              All (12)
            </button>
            <button
              type="button"
              onClick={() => handleSpiceFilter(1)}
              className={`px-4 py-1.5 rounded-full text-xs font-bold transition ${
                spiceFilter === 1
                  ? "bg-[#1d6b3a] text-white shadow-sm"
                  : "bg-white text-[#18241b] border border-[#d8dcd4] hover:border-[#1d6b3a]"
              }`}
            >
              Mild
            </button>
            <button
              type="button"
              onClick={() => handleSpiceFilter(2)}
              className={`px-4 py-1.5 rounded-full text-xs font-bold transition ${
                spiceFilter === 2
                  ? "bg-[#f2b81d] text-[#18241b] shadow-sm"
                  : "bg-white text-[#18241b] border border-[#d8dcd4] hover:border-[#f2b81d]"
              }`}
            >
              Medium
            </button>
            <button
              type="button"
              onClick={() => handleSpiceFilter(3)}
              className={`px-4 py-1.5 rounded-full text-xs font-bold transition ${
                spiceFilter === 3
                  ? "bg-[#c8361f] text-white shadow-sm"
                  : "bg-white text-[#18241b] border border-[#d8dcd4] hover:border-[#c8361f]"
              }`}
            >
              Hot 🔥
            </button>
          </div>
        </div>

        {/* Product Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {displayedFlavours.map((flavour) => {
            const profile = TASTE_PROFILES[flavour.id];
            return (
              <div
                key={flavour.id}
                className="bg-white rounded-3xl p-5 border border-[#d8dcd4] shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col justify-between group hover:-translate-y-1"
              >
                <div>
                  {/* Product Tile Container */}
                  <div
                    onClick={() => openProductDetail(flavour)}
                    className="w-full h-56 rounded-2xl p-2 cursor-pointer relative overflow-hidden flex items-center justify-center transition"
                    style={{ backgroundColor: `${flavour.color}15` }}
                  >
                    <ProductRender flavour={flavour} showKatori={true} angle={-12} />
                    <span className="absolute bottom-2.5 right-2.5 bg-white/90 backdrop-blur-sm text-[10px] font-bold text-[#18241b] px-2 py-0.5 rounded shadow-sm opacity-0 group-hover:opacity-100 transition">
                      View Profile 🔍
                    </span>
                  </div>

                  {/* Local Name & Veg Mark */}
                  <div className="flex items-center justify-between mt-3 mb-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[#57534e]">
                      {flavour.local}
                    </span>
                    <div className="w-3.5 h-3.5 border border-[#1d6b3a] rounded-sm p-0.5 flex items-center justify-center">
                      <div className="w-1.5 h-1.5 rounded-full bg-[#1d6b3a]" />
                    </div>
                  </div>

                  {/* Flavour Name */}
                  <h3
                    onClick={() => openProductDetail(flavour)}
                    className="font-heading font-black text-base sm:text-lg text-[#18241b] cursor-pointer hover:text-[#1d6b3a] transition leading-snug"
                  >
                    {flavour.name}
                  </h3>

                  {/* Spice & Grams badge */}
                  <div className="flex items-center space-x-2 my-1.5 text-xs text-[#57534e]">
                    <span>100 g tube</span>
                    <span>•</span>
                    <div className="flex items-center space-x-1">
                      {[1, 2, 3].map((dot) => (
                        <span
                          key={dot}
                          className={`w-1.5 h-1.5 rounded-full ${
                            dot <= flavour.spice ? "bg-[#c8361f]" : "bg-[#d8dcd4]"
                          }`}
                        />
                      ))}
                      <span className="text-[11px] font-semibold text-[#18241b] ml-1">
                        {flavour.spice === 1 ? "Mild" : flavour.spice === 2 ? "Medium" : "Hot"}
                      </span>
                    </div>
                  </div>

                  <p className="text-xs text-[#57534e] line-clamp-2 my-1 leading-relaxed">
                    {flavour.desc}
                  </p>

                  {/* Quick Pairs With Chips */}
                  <div className="pt-2 flex flex-wrap gap-1">
                    {flavour.goesWith.split(",").slice(0, 2).map((food, fidx) => (
                      <span
                        key={fidx}
                        className="text-[10px] bg-[#f4f3ec] text-[#18241b] font-medium px-2 py-0.5 rounded-md"
                      >
                        {food.trim()}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Price & Add Button */}
                <div className="pt-3 border-t border-[#f4f3ec] flex items-center justify-between mt-3">
                  <div>
                    <span className="font-heading font-extrabold text-lg text-[#18241b]">
                      {formatInr(pricing.single)}
                    </span>
                    <span className="block text-[10px] text-[#57534e]">MRP incl. of taxes</span>
                  </div>

                  <button
                    type="button"
                    onClick={() => addToCart("single", [flavour.id], flavour.name, pricing.single)}
                    className="bg-[#1d6b3a] hover:bg-[#134a28] text-white font-heading font-bold text-xs px-4 py-2.5 rounded-xl shadow-sm transition transform active:scale-95 flex items-center space-x-1"
                  >
                    <span>+ Add</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* "Want a chutney we don't have?" Box */}
        <div className="mt-14 bg-white rounded-3xl p-6 sm:p-8 border border-[#d8dcd4] shadow-sm max-w-2xl mx-auto text-center space-y-4">
          <h3 className="font-heading font-black text-xl text-[#18241b]">
            {storeConfig.copy.catalogue.requestBoxHeading}
          </h3>
          <p className="text-xs sm:text-sm text-[#57534e]">
            {storeConfig.copy.catalogue.requestBoxLede}
          </p>

          <form onSubmit={handleChutneyRequestSubmit} className="flex flex-col sm:flex-row gap-3 justify-center">
            <input
              type="text"
              required
              placeholder="e.g. Gongura, Raw Papaya, Dry Garlic..."
              value={requestName}
              onChange={(e) => setRequestName(e.target.value)}
              className="text-xs sm:text-sm px-4 py-2.5 rounded-xl border border-[#d8dcd4] bg-[#f4f3ec] focus:bg-white focus:border-[#1d6b3a] transition flex-1"
            />
            <input
              type="text"
              placeholder="State / Region (e.g. Andhra, Gujarat)"
              value={requestRegion}
              onChange={(e) => setRequestRegion(e.target.value)}
              className="text-xs sm:text-sm px-4 py-2.5 rounded-xl border border-[#d8dcd4] bg-[#f4f3ec] focus:bg-white focus:border-[#1d6b3a] transition sm:w-44"
            />
            <button
              type="submit"
              className="bg-[#18241b] hover:bg-[#134a28] text-white font-heading font-bold text-xs px-6 py-2.5 rounded-xl shadow transition"
            >
              {requestSent ? "Sent!" : "Send"}
            </button>
          </form>
        </div>
      </section>

      {/* 7. PACKAGING ANATOMY: Engineered for Desks & Tiffins */}
      <section id="anatomy" className="py-16 bg-white border-y border-[#d8dcd4] px-4 sm:px-8">
        <div className="max-w-5xl mx-auto">
          <div className="text-center max-w-xl mx-auto mb-10 space-y-1">
            <span className="text-xs font-heading font-extrabold text-[#1d6b3a] uppercase tracking-wider">
              Food Science &amp; Packaging
            </span>
            <h2 className="font-heading font-black text-2xl sm:text-4xl text-[#18241b]">
              Engineered For Your Tiffin Bag
            </h2>
            <p className="text-xs sm:text-sm text-[#57534e]">
              Why our tube is physically better than messy dabbas, leaky jars, and single-use plastic sachets.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-center">
            {/* Visual Tube Diagram with Interactive Pins */}
            <div className="md:col-span-6 flex justify-center">
              <div className="relative w-72 h-80 bg-[#f4f3ec] rounded-3xl p-4 flex items-center justify-center border border-[#d8dcd4]">
                <ProductRender flavour={storeConfig.flavours[0]} showKatori={false} angle={-5} />
                
                {/* Visual Pin 1: Top Crimp */}
                <div
                  onClick={() => setActiveAnatomyIndex(0)}
                  className="absolute top-10 right-8 cursor-pointer bg-[#18241b] text-[#f2b81d] text-xs font-black w-7 h-7 rounded-full flex items-center justify-center shadow-lg border-2 border-white hover:scale-110 transition"
                >
                  1
                </div>

                {/* Visual Pin 2: Barrier Body */}
                <div
                  onClick={() => setActiveAnatomyIndex(1)}
                  className="absolute top-36 left-8 cursor-pointer bg-[#18241b] text-[#f2b81d] text-xs font-black w-7 h-7 rounded-full flex items-center justify-center shadow-lg border-2 border-white hover:scale-110 transition"
                >
                  2
                </div>

                {/* Visual Pin 3: Flip Cap */}
                <div
                  onClick={() => setActiveAnatomyIndex(2)}
                  className="absolute bottom-10 right-10 cursor-pointer bg-[#18241b] text-[#f2b81d] text-xs font-black w-7 h-7 rounded-full flex items-center justify-center shadow-lg border-2 border-white hover:scale-110 transition"
                >
                  3
                </div>
              </div>
            </div>

            {/* Right: Technical Anatomy Callouts */}
            <div className="md:col-span-6 space-y-3">
              {[
                {
                  id: 0,
                  badge: "Aroma Seal",
                  title: "Hermetic Induction Top Crimp",
                  desc: "Stamped and sealed under food-grade vacuum to lock in fresh pudina and garlic aromas until your first squeeze. Embossed batch coding.",
                },
                {
                  id: 1,
                  badge: "5-Layer Barrier",
                  title: "Multi-Layer EVOH Food Laminate",
                  desc: "Blocks oxygen and ambient office light from degrading fresh herbs. Squeezes down completely flat so zero chutney is wasted.",
                },
                {
                  id: 2,
                  badge: "Zero Leaks",
                  title: "Silicone Anti-Drip Flip Valve",
                  desc: "Cuts the chutney stream clean with zero crusting around the nozzle. Snap-shut cap ensures 100% leak safety inside Borosil / Milton tiffin bags.",
                },
              ].map((item) => (
                <div
                  key={item.id}
                  onClick={() => setActiveAnatomyIndex(item.id)}
                  className={`p-4 rounded-2xl border transition cursor-pointer ${
                    activeAnatomyIndex === item.id
                      ? "bg-[#1d6b3a]/10 border-[#1d6b3a]"
                      : "bg-[#f4f3ec] border-[#d8dcd4] hover:border-[#18241b]"
                  }`}
                >
                  <div className="flex items-center space-x-2 mb-1">
                    <span className="w-5 h-5 rounded-full bg-[#18241b] text-white text-[11px] font-bold flex items-center justify-center">
                      {item.id + 1}
                    </span>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[#1d6b3a]">
                      {item.badge}
                    </span>
                  </div>
                  <h4 className="font-heading font-bold text-sm text-[#18241b]">{item.title}</h4>
                  <p className="text-xs text-[#57534e] mt-1 leading-relaxed">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* 8. "Why a tube?" Comparison (Dark #18241b) */}
      <section className="py-16 bg-[#18241b] text-white px-4 sm:px-8">
        <div className="max-w-4xl mx-auto">
          <div className="text-center max-w-xl mx-auto mb-10 space-y-1">
            <h2 className="font-heading font-black text-2xl sm:text-3xl text-[#f2b81d]">
              {storeConfig.copy.comparison.heading}
            </h2>
            <p className="text-xs sm:text-sm text-[#d8dcd4]">
              {storeConfig.copy.comparison.sub}
            </p>
          </div>

          <div className="overflow-hidden bg-[#134a28] rounded-2xl border border-white/10 shadow-xl">
            <table className="w-full text-left text-xs sm:text-sm border-collapse">
              <thead>
                <tr className="border-b border-white/10 text-white/70 uppercase text-[10px] font-heading font-bold">
                  <th className="py-3 px-4">Daily Factor</th>
                  <th className="py-3 px-4 text-[#f2b81d]">Chutney Tube ✨</th>
                  <th className="py-3 px-4">Glass Jar</th>
                  <th className="py-3 px-4">Plastic Dabba</th>
                  <th className="py-3 px-4">Single Sachet</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10">
                {storeConfig.copy.comparison.rows.map((row, idx) => (
                  <tr key={idx} className="hover:bg-white/5 transition">
                    <td className="py-3 px-4 font-semibold text-white">{row.factor}</td>
                    <td className="py-3 px-4 font-bold text-[#f2b81d]">✓ {row.tube}</td>
                    <td className="py-3 px-4 text-white/70">{row.jar}</td>
                    <td className="py-3 px-4 text-white/70">Oily Leaks</td>
                    <td className="py-3 px-4 text-white/70">{row.sachet}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* 9. WHERE PEOPLE USE IT (4 Real Indian Scenarios) */}
      <section className="py-14 px-4 sm:px-8 max-w-6xl mx-auto w-full">
        <div className="text-center max-w-xl mx-auto mb-10 space-y-1">
          <span className="text-xs font-heading font-extrabold text-[#1d6b3a] uppercase tracking-wider">
            Real Everyday Routines
          </span>
          <h2 className="font-heading font-black text-2xl sm:text-3xl text-[#18241b]">
            Where People Use It
          </h2>
          <p className="text-xs sm:text-sm text-[#57534e]">
            Made for office workers, hostel students, and travellers across India.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {storeConfig.copy.wherePeopleUseIt.map((tile, idx) => (
            <div key={idx} className="bg-white rounded-2xl p-5 border border-[#d8dcd4] shadow-sm space-y-2">
              <h3 className="font-heading font-bold text-base text-[#18241b] flex items-center space-x-1.5">
                <span className="text-[#1d6b3a]">●</span>
                <span>{tile.title}</span>
              </h3>
              <p className="text-xs text-[#57534e] leading-relaxed">{tile.text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* 10. PACKS & CUSTOM BOX BUILDER */}
      <section id="packs" className="py-16 bg-white border-t border-[#d8dcd4] px-4 sm:px-8">
        <div className="max-w-5xl mx-auto">
          <div className="text-center max-w-xl mx-auto mb-10 space-y-1">
            <span className="text-xs font-heading font-extrabold text-[#1d6b3a] uppercase tracking-wider">
              Launch Bundles
            </span>
            <h2 className="font-heading font-black text-2xl sm:text-4xl text-[#18241b]">
              Choose Your Pack
            </h2>
            <p className="text-xs sm:text-sm text-[#57534e]">
              Ships in a custom recyclable tiffin box with zero-leak guarantee.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Card 1: Single Tube */}
            <div className="bg-[#f4f3ec] rounded-3xl p-6 border border-[#d8dcd4] flex flex-col justify-between space-y-4">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#57534e]">Desk Single</span>
                <h3 className="font-heading font-black text-xl text-[#18241b] mt-1">Single Tube</h3>
                <p className="text-xs text-[#57534e] mt-1">Choose any 1 favourite chutney. 100g tube.</p>
                <div className="mt-4">
                  <span className="font-heading font-black text-2xl text-[#18241b]">
                    {formatInr(pricing.single)}
                  </span>
                  <span className="block text-[10px] text-[#57534e]">MRP incl. of all taxes</span>
                </div>
              </div>

              <a
                href="#chutneys"
                className="w-full text-center bg-white hover:bg-[#d8dcd4] text-[#18241b] font-heading font-bold text-xs py-3 rounded-xl border border-[#d8dcd4] transition"
              >
                Choose from catalogue
              </a>
            </div>

            {/* Card 2: Chaat Combo */}
            <div className="bg-[#f4f3ec] rounded-3xl p-6 border border-[#d8dcd4] flex flex-col justify-between space-y-4">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#c8361f]">The Iconic Pair</span>
                <h3 className="font-heading font-black text-xl text-[#18241b] mt-1">Chaat Combo</h3>
                <p className="text-xs text-[#57534e] mt-1">Chatpati Hari + Khatti Meethi Imli.</p>
                <div className="mt-4">
                  <span className="font-heading font-black text-2xl text-[#18241b]">
                    {formatInr(pricing.combo)}
                  </span>
                  <span className="block text-[10px] text-[#57534e]">MRP incl. of all taxes</span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => addToCart("combo", ["green", "imli"], "Chaat Combo (Hari + Imli)", pricing.combo)}
                className="w-full bg-[#1d6b3a] hover:bg-[#134a28] text-white font-heading font-bold text-xs py-3 rounded-xl shadow transition"
              >
                Add Chaat Combo
              </button>
            </div>

            {/* Card 3: Pick Any 3 (Custom Unboxing Box) */}
            <div className="bg-[#134a28] text-white rounded-3xl p-6 border-2 border-[#f2b81d] shadow-xl flex flex-col justify-between space-y-4 relative overflow-hidden">
              <div className="absolute top-4 right-4 bg-[#f2b81d] text-[#18241b] text-[10px] uppercase font-heading font-black px-2.5 py-0.5 rounded-full">
                Most Popular
              </div>

              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#f2b81d]">Custom Tiffin Box</span>
                <h3 className="font-heading font-black text-xl text-white mt-1">Pick Any 3 Sampler</h3>
                <p className="text-xs text-[#f4f3ec] mt-1">Pick your 3 favourite flavours in a custom die-cut box.</p>
                <div className="mt-4">
                  <span className="font-heading font-black text-2xl text-[#f2b81d]">
                    {formatInr(pricing.pick3)}
                  </span>
                  <span className="block text-[10px] text-white/70">MRP incl. of all taxes</span>
                </div>
              </div>

              <button
                type="button"
                onClick={openPick3Modal}
                className="w-full bg-[#f2b81d] hover:bg-[#e2a80d] text-[#18241b] font-heading font-black text-xs py-3 rounded-xl shadow-md transition transform active:scale-95 flex items-center justify-center space-x-2"
              >
                <span>Build Custom 3-Pack</span>
                <span>📦</span>
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* 11. FAQ ACCORDION */}
      <section id="faq" className="py-14 px-4 sm:px-8 max-w-3xl mx-auto w-full">
        <div className="text-center mb-8">
          <h2 className="font-heading font-black text-2xl sm:text-3xl text-[#18241b]">
            Frequently Asked Questions
          </h2>
        </div>

        <div className="space-y-3">
          {storeConfig.copy.faq.map((item, idx) => (
            <details key={idx} className="group bg-white rounded-2xl border border-[#d8dcd4] p-4 transition">
              <summary className="font-heading font-bold text-sm sm:text-base text-[#18241b] cursor-pointer flex justify-between items-center list-none">
                <span>{item.q}</span>
                <span className="text-[#1d6b3a] font-black text-lg group-open:rotate-45 transition-transform">
                  +
                </span>
              </summary>
              <p className="mt-3 text-xs sm:text-sm text-[#57534e] leading-relaxed border-t border-[#f4f3ec] pt-3">
                {item.a}
              </p>
            </details>
          ))}
        </div>
      </section>

      {/* 12. FOOTER */}
      <footer className="mt-auto bg-[#134a28] text-[#f4f3ec] py-12 px-4 sm:px-8 border-t border-[#18241b]">
        <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-12 gap-8">
          <div className="md:col-span-6 space-y-3">
            <span className="font-heading font-black text-2xl text-[#f2b81d]">
              {storeConfig.brand.name}
            </span>
            <p className="text-sm font-medium text-white">{storeConfig.brand.tagline}</p>
            <p className="text-xs text-[#d8dcd4] leading-relaxed max-w-sm">
              {storeConfig.brand.subheadline}
            </p>
            {storeConfig.brand.whatsAppNumber && (
              <a
                href={`https://wa.me/${storeConfig.brand.whatsAppNumber}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center space-x-2 bg-[#25D366] text-white text-xs font-bold px-4 py-2 rounded-xl mt-2 shadow-md hover:scale-105 transition"
              >
                <span>WhatsApp Us</span>
              </a>
            )}
          </div>

          <div className="md:col-span-3 space-y-2">
            <h4 className="font-heading font-bold text-xs uppercase tracking-wider text-[#f2b81d]">Shop</h4>
            <ul className="space-y-1.5 text-xs text-[#f4f3ec]">
              <li><a href="#chutneys" className="hover:underline">All 12 Chutneys</a></li>
              <li><a href="#simulator" className="hover:underline">Squeeze Simulator</a></li>
              <li><a href="#packs" className="hover:underline">Packs &amp; Bundles</a></li>
              <li><a href="#faq" className="hover:underline">FAQ</a></li>
            </ul>
          </div>

          <div className="md:col-span-3 space-y-2">
            <h4 className="font-heading font-bold text-xs uppercase tracking-wider text-[#f2b81d]">Policies</h4>
            <ul className="space-y-1.5 text-xs text-[#f4f3ec]">
              <li><Link href="/shipping" className="hover:underline">Shipping Policy</Link></li>
              <li><Link href="/refunds" className="hover:underline">Refunds &amp; Cancellations</Link></li>
              <li><Link href="/privacy" className="hover:underline">Privacy Policy (DPDP Act)</Link></li>
              <li><Link href="/terms" className="hover:underline">Terms of Service</Link></li>
            </ul>
          </div>
        </div>

        <div className="max-w-6xl mx-auto mt-8 pt-6 border-t border-white/10 text-center text-xs text-white/60">
          <p>{storeConfig.brand.copyright}. Pre-launch consumer demand validation. No commercial payments taken.</p>
        </div>
      </footer>

      {/* 13. FLOATING STICKY ORDER PILL ON MOBILE */}
      {showStickyBar && (
        <div className="md:hidden fixed bottom-4 inset-x-4 z-40 bg-[#18241b] text-white p-3 rounded-2xl shadow-2xl flex items-center justify-between border border-white/10 animate-slideUp">
          <div>
            <span className="text-[10px] text-[#f2b81d] font-bold block">Chutney Tubes 100g</span>
            <span className="font-heading font-black text-sm">{formatInr(pricing.single)}</span>
          </div>

          <div className="flex items-center space-x-2">
            <a
              href="#chutneys"
              className="bg-[#f2b81d] text-[#18241b] font-heading font-black text-xs px-4 py-2 rounded-xl shadow transition"
            >
              Order Now
            </a>
            <button
              onClick={() => setIsCartOpen(true)}
              className="bg-white/20 text-white font-bold text-xs px-3 py-2 rounded-xl"
            >
              🛒 {cartItemCount}
            </button>
          </div>
        </div>
      )}

      {/* TOAST NOTIFICATION */}
      {toastMessage && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-[#18241b] text-white text-xs font-bold px-4 py-2.5 rounded-full shadow-2xl flex items-center space-x-2 animate-bounce">
          <span>✓</span>
          <span>{toastMessage}</span>
        </div>
      )}

      {/* CART DRAWER */}
      {isCartOpen && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div
            onClick={() => setIsCartOpen(false)}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
          />
          <div className="relative w-full max-w-md bg-white h-full shadow-2xl flex flex-col justify-between p-6 z-10 animate-slideLeft">
            <div>
              <div className="flex items-center justify-between border-b border-[#d8dcd4] pb-4">
                <div className="flex items-center space-x-2">
                  <h3 className="font-heading font-black text-xl text-[#18241b]">Your Lunch Bag</h3>
                  <span className="text-xs bg-[#f4f3ec] text-[#18241b] font-bold px-2 py-0.5 rounded-full">
                    {cartItemCount} items
                  </span>
                </div>
                <button
                  onClick={() => setIsCartOpen(false)}
                  className="w-8 h-8 rounded-full bg-[#f4f3ec] text-[#18241b] font-black text-sm"
                >
                  ✕
                </button>
              </div>

              {/* Free Shipping Meter */}
              <div className="my-3 p-3 bg-[#f4f3ec] rounded-xl text-xs space-y-1.5 border border-[#d8dcd4]">
                <div className="flex justify-between items-center font-bold">
                  <span>
                    {freeShippingDiff > 0
                      ? `Add ${formatInr(freeShippingDiff)} for FREE Metro Express Dispatch`
                      : "🎉 Free Metro Express Dispatch Unlocked!"}
                  </span>
                  <span>{Math.round(Math.min(100, (cartTotal / freeShippingThreshold) * 100))}%</span>
                </div>
                <div className="w-full bg-[#d8dcd4] h-1.5 rounded-full overflow-hidden">
                  <div
                    className="bg-[#1d6b3a] h-full transition-all duration-300"
                    style={{ width: `${Math.min(100, (cartTotal / freeShippingThreshold) * 100)}%` }}
                  />
                </div>
              </div>

              {cart.length === 0 ? (
                <div className="py-16 text-center space-y-3">
                  <div className="w-16 h-16 rounded-full bg-[#f4f3ec] text-3xl flex items-center justify-center mx-auto">
                    🛒
                  </div>
                  <p className="font-heading font-bold text-sm text-[#18241b]">Your lunch bag is empty.</p>
                  <p className="text-xs text-[#57534e]">Add your favourite chutney tubes to begin.</p>
                </div>
              ) : (
                <div className="divide-y divide-[#f4f3ec] max-h-[55vh] overflow-y-auto py-2">
                  {cart.map((item) => (
                    <div key={item.id} className="py-3 flex items-center justify-between">
                      <div className="space-y-0.5 max-w-[200px]">
                        <h4 className="font-heading font-bold text-sm text-[#18241b]">{item.title}</h4>
                        <span className="text-xs text-[#57534e]">{formatInr(item.unitPrice)} each</span>
                      </div>

                      <div className="flex items-center space-x-2 border border-[#d8dcd4] rounded-lg bg-[#f4f3ec] px-1">
                        <button
                          onClick={() => updateCartQty(item.id, -1)}
                          className="px-2 py-1 text-xs font-black text-[#18241b]"
                        >
                          -
                        </button>
                        <span className="text-xs font-bold text-[#18241b]">{item.quantity}</span>
                        <button
                          onClick={() => updateCartQty(item.id, 1)}
                          className="px-2 py-1 text-xs font-black text-[#18241b]"
                        >
                          +
                        </button>
                      </div>

                      <span className="font-heading font-extrabold text-sm text-[#18241b]">
                        {formatInr(item.unitPrice * item.quantity)}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {cart.length > 0 && (
              <div className="border-t border-[#d8dcd4] pt-4 space-y-3">
                <div className="flex justify-between items-center text-sm font-bold">
                  <span>Total (MRP incl. of all taxes):</span>
                  <span className="font-heading font-black text-xl text-[#18241b]">
                    {formatInr(cartTotal)}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={handleStartCheckout}
                  className="w-full bg-[#1d6b3a] hover:bg-[#134a28] text-white font-heading font-black text-sm py-3.5 rounded-xl shadow-lg transition"
                >
                  Proceed to Checkout · {formatInr(cartTotal)}
                </button>
                <p className="text-[10px] text-center text-[#57534e]">
                  🛡️ 100% Zero-Leak Guarantee in Your Tiffin Bag
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* RICH PRODUCT DETAIL MODAL (WITH TASTE RADAR & NUTRITION) */}
      {selectedFlavour && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            onClick={() => setSelectedFlavour(null)}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm"
          />
          <div className="relative bg-white rounded-3xl p-6 sm:p-8 max-w-lg w-full z-10 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setSelectedFlavour(null)}
              className="absolute top-4 right-4 w-8 h-8 rounded-full bg-[#f4f3ec] text-[#18241b] font-black text-sm"
            >
              ✕
            </button>

            {/* 3D Tube Stage */}
            <div
              className="w-full h-56 flex items-center justify-center rounded-2xl p-2 relative overflow-hidden"
              style={{ backgroundColor: `${selectedFlavour.color}15` }}
            >
              <ProductRender flavour={selectedFlavour} showKatori={true} angle={-10} />
            </div>

            <div className="space-y-1">
              <div className="flex justify-between items-center">
                <span className="text-xs font-bold text-[#c8361f] uppercase tracking-wider">
                  {selectedFlavour.local}
                </span>
                <span className="font-heading font-black text-xl text-[#18241b]">
                  {formatInr(pricing.single)}
                </span>
              </div>
              <h3 className="font-heading font-black text-2xl text-[#18241b]">
                {selectedFlavour.name} ({selectedFlavour.hindi})
              </h3>
              <p className="text-xs text-[#57534e] leading-relaxed">{selectedFlavour.desc}</p>
            </div>

            {/* Taste Radar Intensity Bars */}
            {TASTE_PROFILES[selectedFlavour.id] && (
              <div className="bg-[#f4f3ec] p-4 rounded-2xl border border-[#d8dcd4] space-y-2">
                <span className="text-[10px] font-heading font-extrabold uppercase tracking-wider text-[#1d6b3a]">
                  Taste Profile Intensity
                </span>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <div className="flex justify-between mb-0.5">
                      <span className="text-[#57534e]">Tanginess</span>
                      <span className="font-bold">{TASTE_PROFILES[selectedFlavour.id].tangy}/10</span>
                    </div>
                    <div className="w-full bg-[#d8dcd4] h-1.5 rounded-full overflow-hidden">
                      <div
                        className="bg-[#f2b81d] h-full"
                        style={{ width: `${TASTE_PROFILES[selectedFlavour.id].tangy * 10}%` }}
                      />
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between mb-0.5">
                      <span className="text-[#57534e]">Spice Heat</span>
                      <span className="font-bold">{TASTE_PROFILES[selectedFlavour.id].heat}/10</span>
                    </div>
                    <div className="w-full bg-[#d8dcd4] h-1.5 rounded-full overflow-hidden">
                      <div
                        className="bg-[#c8361f] h-full"
                        style={{ width: `${TASTE_PROFILES[selectedFlavour.id].heat * 10}%` }}
                      />
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between mb-0.5">
                      <span className="text-[#57534e]">Sweetness</span>
                      <span className="font-bold">{TASTE_PROFILES[selectedFlavour.id].sweet}/10</span>
                    </div>
                    <div className="w-full bg-[#d8dcd4] h-1.5 rounded-full overflow-hidden">
                      <div
                        className="bg-[#1d6b3a] h-full"
                        style={{ width: `${TASTE_PROFILES[selectedFlavour.id].sweet * 10}%` }}
                      />
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between mb-0.5">
                      <span className="text-[#57534e]">Tadka / Punch</span>
                      <span className="font-bold">{TASTE_PROFILES[selectedFlavour.id].punch}/10</span>
                    </div>
                    <div className="w-full bg-[#d8dcd4] h-1.5 rounded-full overflow-hidden">
                      <div
                        className="bg-[#18241b] h-full"
                        style={{ width: `${TASTE_PROFILES[selectedFlavour.id].punch * 10}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Ingredients & Details */}
            <div className="bg-[#f4f3ec] p-4 rounded-2xl text-xs space-y-1.5 border border-[#d8dcd4]">
              {TASTE_PROFILES[selectedFlavour.id] && (
                <>
                  <div className="pb-1 border-b border-[#d8dcd4]">
                    <span className="text-[#57534e] block text-[10px] uppercase font-bold">What's Inside:</span>
                    <span className="font-medium text-[#18241b]">
                      {TASTE_PROFILES[selectedFlavour.id].keyIngredients}
                    </span>
                  </div>
                  <div className="flex justify-between py-0.5">
                    <span className="text-[#57534e]">Calories:</span>
                    <span className="font-bold">{TASTE_PROFILES[selectedFlavour.id].calories}</span>
                  </div>
                </>
              )}
              <div className="flex justify-between py-0.5">
                <span className="text-[#57534e]">Recommended Pairings:</span>
                <span className="font-bold">{selectedFlavour.goesWith}</span>
              </div>
              <div className="flex justify-between py-0.5">
                <span className="text-[#57534e]">Packaging:</span>
                <span className="font-bold">100g Multi-layer Tube with Flip-Valve</span>
              </div>
              <div className="flex justify-between py-0.5">
                <span className="text-[#57534e]">Dietary:</span>
                <span className="font-bold text-[#1d6b3a]">100% Vegetarian (Green Mark)</span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                addToCart("single", [selectedFlavour.id], selectedFlavour.name, pricing.single);
                setSelectedFlavour(null);
              }}
              className="w-full bg-[#1d6b3a] hover:bg-[#134a28] text-white font-heading font-black text-sm py-3.5 rounded-xl shadow-lg transition"
            >
              Add to Lunch Bag · {formatInr(pricing.single)}
            </button>
          </div>
        </div>
      )}

      {/* PICK ANY 3 MODAL */}
      {isPick3Open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            onClick={() => setIsPick3Open(false)}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm"
          />
          <div className="relative bg-white rounded-3xl p-6 sm:p-8 max-w-lg w-full z-10 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b border-[#d8dcd4] pb-3">
              <div>
                <h3 className="font-heading font-black text-xl text-[#18241b]">Build Your 3-Pack Tiffin Box</h3>
                <p className="text-xs text-[#57534e]">Selected {pick3Selected.length} of 3</p>
              </div>
              <button
                onClick={() => setIsPick3Open(false)}
                className="w-8 h-8 rounded-full bg-[#f4f3ec] text-[#18241b] font-black text-sm"
              >
                ✕
              </button>
            </div>

            {/* 3 Box Slots Graphic */}
            <div className="grid grid-cols-3 gap-2 bg-[#f4f3ec] p-3 rounded-2xl border border-[#d8dcd4]">
              {[0, 1, 2].map((slotIdx) => {
                const flvId = pick3Selected[slotIdx];
                const flv = flvId ? storeConfig.flavours.find((f) => f.id === flvId) : null;
                return (
                  <div
                    key={slotIdx}
                    className="h-20 rounded-xl border border-dashed border-[#1d6b3a] bg-white flex flex-col items-center justify-center p-1 text-center"
                  >
                    {flv ? (
                      <>
                        <span className="w-3 h-3 rounded-full" style={{ backgroundColor: flv.color }} />
                        <span className="text-[11px] font-heading font-bold text-[#18241b] line-clamp-1 mt-1">
                          {flv.local}
                        </span>
                        <span className="text-[9px] text-[#1d6b3a] font-bold">Slot {slotIdx + 1} ✓</span>
                      </>
                    ) : (
                      <>
                        <span className="text-xs text-[#57534e] font-bold">Slot {slotIdx + 1}</span>
                        <span className="text-[10px] text-[#57534e]">Pick below</span>
                      </>
                    )}
                  </div>
                );
              })}
            </div>

            <div className="grid grid-cols-2 gap-3 max-h-60 overflow-y-auto pr-1">
              {storeConfig.flavours.map((f) => {
                const isSelected = pick3Selected.includes(f.id);
                return (
                  <div
                    key={f.id}
                    onClick={() => togglePick3Flavour(f.id)}
                    className={`p-3 rounded-2xl border-2 cursor-pointer transition text-left ${
                      isSelected
                        ? "border-[#1d6b3a] bg-[#1d6b3a]/10"
                        : "border-[#d8dcd4] bg-[#f4f3ec] hover:border-[#18241b]"
                    }`}
                  >
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-[10px] font-bold text-[#c8361f]">{f.local}</span>
                      {isSelected && <span className="text-xs font-black text-[#1d6b3a]">✓</span>}
                    </div>
                    <h4 className="font-heading font-bold text-xs text-[#18241b] leading-tight">{f.name}</h4>
                  </div>
                );
              })}
            </div>

            <button
              type="button"
              disabled={pick3Selected.length !== 3}
              onClick={confirmPick3Pack}
              className="w-full bg-[#f2b81d] hover:bg-[#e2a80d] text-[#18241b] font-heading font-black text-sm py-3.5 rounded-xl shadow-lg transition disabled:opacity-40"
            >
              Confirm 3-Pack Box · {formatInr(pricing.pick3)}
            </button>
          </div>
        </div>
      )}

      {/* CHECKOUT & REVEAL MODAL */}
      {isCheckoutOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm" />
          <div className="relative bg-white rounded-3xl p-6 sm:p-8 max-w-xl w-full z-10 shadow-2xl max-h-[92vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b border-[#d8dcd4] pb-3 mb-4">
              <span className="font-heading font-black text-lg text-[#134a28]">
                {checkoutStep === 3 ? "Order Completed" : "Order Checkout"}
              </span>
              {checkoutStep !== 3 && (
                <button
                  onClick={() => setIsCheckoutOpen(false)}
                  className="w-7 h-7 rounded-full bg-[#f4f3ec] text-[#18241b] font-black text-xs"
                >
                  ✕
                </button>
              )}
            </div>

            {/* STEP 1: DELIVERY FORM */}
            {checkoutStep === 1 && (
              <form onSubmit={handleDetailsSubmit} className="space-y-4">
                <div className="bg-[#f4f3ec] p-3 rounded-2xl flex justify-between items-center text-xs font-bold border border-[#d8dcd4]">
                  <span>Order Total ({cartItemCount} tubes):</span>
                  <span className="font-heading font-black text-base text-[#18241b]">
                    {formatInr(cartTotal)}
                  </span>
                </div>

                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-bold text-[#18241b] mb-1">Full Name</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Rahul Sharma"
                      value={deliveryDetails.name}
                      onChange={(e) => setDeliveryDetails({ ...deliveryDetails, name: e.target.value })}
                      className="w-full text-xs sm:text-sm px-4 py-2.5 rounded-xl border border-[#d8dcd4] bg-[#f4f3ec] focus:bg-white focus:border-[#1d6b3a] transition"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-[#18241b] mb-1">10-Digit Mobile</label>
                      <input
                        type="tel"
                        required
                        pattern="[0-9]{10}"
                        placeholder="9876543210"
                        value={deliveryDetails.phone}
                        onChange={(e) =>
                          setDeliveryDetails({
                            ...deliveryDetails,
                            phone: e.target.value.replace(/\D/g, "").slice(0, 10),
                          })
                        }
                        className="w-full text-xs sm:text-sm px-4 py-2.5 rounded-xl border border-[#d8dcd4] bg-[#f4f3ec] focus:bg-white focus:border-[#1d6b3a] transition"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-[#18241b] mb-1">Email Address</label>
                      <input
                        type="email"
                        required
                        placeholder="rahul@example.com"
                        value={deliveryDetails.email}
                        onChange={(e) => setDeliveryDetails({ ...deliveryDetails, email: e.target.value })}
                        className="w-full text-xs sm:text-sm px-4 py-2.5 rounded-xl border border-[#d8dcd4] bg-[#f4f3ec] focus:bg-white focus:border-[#1d6b3a] transition"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[#18241b] mb-1">6-Digit Pincode</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. 560001 or 110001"
                      value={deliveryDetails.pincode}
                      onChange={handlePincodeChange}
                      className="w-full text-xs sm:text-sm px-4 py-2.5 rounded-xl border border-[#d8dcd4] bg-[#f4f3ec] focus:bg-white focus:border-[#1d6b3a] transition"
                    />

                    {/* Live Pincode Delivery Confirmation */}
                    {pincodeValid === true && (
                      <p className="text-xs text-[#1d6b3a] font-bold mt-1.5 flex items-center space-x-1">
                        <span>✓</span>
                        <span>Delivering to {postalZone} — Express 24-48h dispatch available</span>
                      </p>
                    )}
                    {pincodeValid === false && deliveryDetails.pincode.length === 6 && (
                      <p className="text-xs text-[#c8361f] font-bold mt-1.5 flex items-center space-x-1">
                        <span>✕</span>
                        <span>Invalid PIN code format. Please enter a valid 6-digit Indian pincode.</span>
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[#18241b] mb-1">
                      Desk / Home Delivery Address
                    </label>
                    <textarea
                      required
                      rows={2}
                      placeholder="Floor, Office building or Apartment number, Street name"
                      value={deliveryDetails.address}
                      onChange={(e) => setDeliveryDetails({ ...deliveryDetails, address: e.target.value })}
                      className="w-full text-xs sm:text-sm px-4 py-2.5 rounded-xl border border-[#d8dcd4] bg-[#f4f3ec] focus:bg-white focus:border-[#1d6b3a] transition"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={!pincodeValid || deliveryDetails.phone.length !== 10}
                  className="w-full bg-[#1d6b3a] hover:bg-[#134a28] text-white font-heading font-black text-sm py-3.5 rounded-xl shadow-lg transition disabled:opacity-40"
                >
                  Continue to Payment Selection →
                </button>
              </form>
            )}

            {/* STEP 2: PAYMENT METHOD STEP (MOCK ONLY) */}
            {checkoutStep === 2 && (
              <form onSubmit={handlePayClick} className="space-y-4">
                <div className="bg-[#f4f3ec] p-3 rounded-2xl flex justify-between items-center text-xs border border-[#d8dcd4]">
                  <div>
                    <span className="font-bold text-[#18241b] block">Delivering to {postalZone}</span>
                    <span className="text-[#57534e]">Free Express Delivery Included</span>
                  </div>
                  <span className="font-heading font-black text-base text-[#18241b]">
                    {formatInr(cartTotal)}
                  </span>
                </div>

                <div className="space-y-2">
                  <label className="block text-xs font-bold text-[#18241b]">Select Payment Method</label>
                  
                  {/* UPI Option */}
                  <div
                    onClick={() => handleSelectPaymentMethod("upi")}
                    className={`p-3.5 rounded-2xl border-2 cursor-pointer transition flex items-center justify-between ${
                      paymentMethod === "upi"
                        ? "border-[#1d6b3a] bg-[#1d6b3a]/10"
                        : "border-[#d8dcd4] bg-[#f4f3ec] hover:border-[#18241b]"
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center font-bold text-xs shadow-sm">
                        ⚡
                      </div>
                      <div>
                        <span className="font-heading font-bold text-xs sm:text-sm text-[#18241b] block">
                          Instant UPI
                        </span>
                        <span className="text-[10px] text-[#57534e]">
                          Google Pay, PhonePe, Paytm, BHIM or any UPI app
                        </span>
                      </div>
                    </div>
                    {paymentMethod === "upi" && <span className="text-[#1d6b3a] font-black">✓</span>}
                  </div>

                  {/* Card Option */}
                  <div
                    onClick={() => handleSelectPaymentMethod("card")}
                    className={`p-3.5 rounded-2xl border-2 cursor-pointer transition flex items-center justify-between ${
                      paymentMethod === "card"
                        ? "border-[#1d6b3a] bg-[#1d6b3a]/10"
                        : "border-[#d8dcd4] bg-[#f4f3ec] hover:border-[#18241b]"
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center font-bold text-xs shadow-sm">
                        💳
                      </div>
                      <div>
                        <span className="font-heading font-bold text-xs sm:text-sm text-[#18241b] block">
                          Debit / Credit Card
                        </span>
                        <span className="text-[10px] text-[#57534e]">Visa, Mastercard, RuPay</span>
                      </div>
                    </div>
                    {paymentMethod === "card" && <span className="text-[#1d6b3a] font-black">✓</span>}
                  </div>

                  {/* Cash on Delivery */}
                  <div
                    onClick={() => handleSelectPaymentMethod("cod")}
                    className={`p-3.5 rounded-2xl border-2 cursor-pointer transition flex items-center justify-between ${
                      paymentMethod === "cod"
                        ? "border-[#1d6b3a] bg-[#1d6b3a]/10"
                        : "border-[#d8dcd4] bg-[#f4f3ec] hover:border-[#18241b]"
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center font-bold text-xs shadow-sm">
                        💵
                      </div>
                      <div>
                        <span className="font-heading font-bold text-xs sm:text-sm text-[#18241b] block">
                          Cash on Delivery
                        </span>
                        <span className="text-[10px] text-[#57534e]">Pay when your tiffin box arrives</span>
                      </div>
                    </div>
                    {paymentMethod === "cod" && <span className="text-[#1d6b3a] font-black">✓</span>}
                  </div>
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={!paymentMethod}
                    className="w-full bg-[#f2b81d] hover:bg-[#e2a80d] text-[#18241b] font-heading font-black text-sm py-3.5 rounded-xl shadow-lg transition transform active:scale-95 disabled:opacity-40"
                  >
                    Pay {formatInr(cartTotal)} →
                  </button>
                </div>
              </form>
            )}

            {/* STEP 3: HONEST REVEAL SCREEN */}
            {checkoutStep === 3 && (
              <div className="space-y-5">
                <div className="text-center space-y-2">
                  <div className="w-14 h-14 rounded-full bg-[#f2b81d]/20 text-[#18241b] text-2xl flex items-center justify-center mx-auto">
                    🎉
                  </div>
                  <h3 className="font-heading font-black text-xl sm:text-2xl text-[#18241b]">
                    You Haven't Been Charged.
                  </h3>
                  <p className="font-heading font-bold text-sm text-[#1d6b3a]">
                    We're not live yet — but your demand helps us launch!
                  </p>
                  <p className="text-xs text-[#57534e] leading-relaxed max-w-md mx-auto">
                    You're one of the first people across India to back the idea of chutney in a tube. No money was taken, and no payment details were collected.
                  </p>
                </div>

                {!revealDone ? (
                  <form onSubmit={handleRevealSurveySubmit} className="space-y-4 pt-2 border-t border-[#d8dcd4]">
                    <div>
                      <label className="block text-xs font-bold text-[#18241b] mb-1">
                        How do you feel about chutney in a squeezable tube?
                      </label>
                      <select
                        value={tubeFeeling}
                        onChange={(e) => setTubeFeeling(e.target.value)}
                        className="w-full text-xs px-3 py-2.5 rounded-xl border border-[#d8dcd4] bg-[#f4f3ec]"
                      >
                        <option value="">Select an option...</option>
                        <option value="Love it, easier than a jar">Love it, much easier than a jar</option>
                        <option value="Fine with it">Fine with it</option>
                        <option value="Not sure yet">Not sure yet</option>
                        <option value="I'd rather have a jar or sachet">I'd rather have a jar or sachet</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-[#18241b] mb-1">
                        What almost stopped you from buying?
                      </label>
                      <textarea
                        rows={2}
                        placeholder="Price, doubts about taste, shelf life, or size..."
                        value={stoppedText}
                        onChange={(e) => setStoppedText(e.target.value)}
                        className="w-full text-xs px-3 py-2 rounded-xl border border-[#d8dcd4] bg-[#f4f3ec]"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-[#18241b] mb-1">
                        How often would you use it?
                      </label>
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        {["Daily", "A few times a week", "Weekly", "Rarely"].map((opt) => (
                          <button
                            key={opt}
                            type="button"
                            onClick={() => setFrequency(opt)}
                            className={`p-2 rounded-xl border text-left font-bold transition ${
                              frequency === opt
                                ? "bg-[#1d6b3a] text-white border-[#1d6b3a]"
                                : "bg-[#f4f3ec] text-[#18241b] border-[#d8dcd4]"
                            }`}
                          >
                            {opt}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Launch Discount Opt-in (Unchecked by default) */}
                    <div className="p-3 bg-[#f2b81d]/15 rounded-xl border border-[#f2b81d] space-y-2">
                      <label className="flex items-start space-x-2 cursor-pointer text-xs font-bold text-[#18241b]">
                        <input
                          type="checkbox"
                          checked={optInDiscount}
                          onChange={(e) => setOptInDiscount(e.target.checked)}
                          className="mt-0.5 rounded text-[#1d6b3a]"
                        />
                        <span>Send me a 20% discount code when you officially launch!</span>
                      </label>

                      {optInDiscount && (
                        <input
                          type="email"
                          required
                          placeholder="Confirm email for launch discount"
                          value={optInEmail}
                          onChange={(e) => setOptInEmail(e.target.value)}
                          className="w-full text-xs px-3 py-2 rounded-lg border border-[#d8dcd4] bg-white"
                        />
                      )}
                    </div>

                    <button
                      type="submit"
                      className="w-full bg-[#18241b] hover:bg-[#134a28] text-white font-heading font-black text-xs py-3.5 rounded-xl shadow transition"
                    >
                      Submit Feedback &amp; Finish
                    </button>
                  </form>
                ) : (
                  <div className="py-6 text-center space-y-3">
                    <span className="text-3xl">❤️</span>
                    <h4 className="font-heading font-black text-lg text-[#18241b]">
                      Thank You For Helping Us Build This!
                    </h4>
                    <p className="text-xs text-[#57534e] max-w-sm mx-auto">
                      Your response has been logged directly into our validation metrics. We'll notify you as soon as the first production run is bottled!
                    </p>
                    <button
                      type="button"
                      onClick={() => setIsCheckoutOpen(false)}
                      className="bg-[#1d6b3a] text-white font-heading font-bold text-xs px-6 py-2.5 rounded-xl"
                    >
                      Close
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
