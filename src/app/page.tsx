"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  storeConfig,
  FlavourItem,
  ComingSoonItem,
  PackItem,
  getPostalZone,
  isValidPincode,
  formatInr,
} from "../config/store";
import { ProductRender } from "../components/ProductRender";
import {
  track,
  recordLaunchSignup,
} from "../lib/tracking";

interface CartLineItem {
  id: string;
  kind: "single" | "pack";
  title: string;
  flavours: string[];
  quantity: number;
  unitPrice: number;
}

// Taste profile metadata for the 8 active flavours
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
  "masala-ketchup": {
    tangy: 7,
    heat: 3,
    sweet: 7,
    punch: 8,
    notes: "Ripe tomatoes blended with warm Indian spices. Sweet, tangy, punchy desi twist.",
    keyIngredients: "Tomato Paste, Sugar, Vinegar, Onion, Garlic, Cumin, Black Pepper, Desi Spices",
    calories: "~16 kcal per 15g squeeze",
  },
  "tandoori-mayo": {
    tangy: 5,
    heat: 6,
    sweet: 3,
    punch: 8,
    notes: "Creamy eggless mayo infused with smoky tandoori spices and roasted cumin.",
    keyIngredients: "Vegetable Oil, Water, Tandoori Masala, Lemon Juice, Mustard, Cumin, Smoked Paprika",
    calories: "~42 kcal per 15g squeeze",
  },
  "mint-mayo": {
    tangy: 6,
    heat: 4,
    sweet: 2,
    punch: 7,
    notes: "Cool mint and fresh coriander blended with smooth eggless mayo. Herbaceous and refreshing.",
    keyIngredients: "Vegetable Oil, Water, Fresh Mint, Fresh Coriander, Lemon, Green Chilli, Spices",
    calories: "~40 kcal per 15g squeeze",
  },
  "garlic-mayo": {
    tangy: 3,
    heat: 3,
    sweet: 2,
    punch: 8,
    notes: "Rich, velvety eggless mayo whipped with slow-roasted mellow garlic.",
    keyIngredients: "Vegetable Oil, Water, Roasted Garlic Paste, Lemon Juice, Mustard, Sea Salt",
    calories: "~41 kcal per 15g squeeze",
  },
  "schezwan-sauce": {
    tangy: 6,
    heat: 9,
    sweet: 2,
    punch: 10,
    notes: "Fiery red chillies, garlic and toasted spices with an unmistakable desi-Chinese bite.",
    keyIngredients: "Red Chillies, Garlic, Ginger, Soya Sauce, Vinegar, Sichuan Pepper, Spices",
    calories: "~18 kcal per 15g squeeze",
  },
  "chilli-garlic": {
    tangy: 5,
    heat: 9,
    sweet: 1,
    punch: 10,
    notes: "Pounded red chillies and pungent garlic simmered into a spicy, zesty dipping sauce.",
    keyIngredients: "Crushed Red Chilli, Fresh Garlic, Vinegar, Sea Salt, Sugar, Spices",
    calories: "~15 kcal per 15g squeeze",
  },
  "hari-chutney": {
    tangy: 8,
    heat: 6,
    sweet: 2,
    punch: 9,
    notes: "Fresh mint and coriander pounded with green chilli, cumin and lemon. Pure street chaat nostalgia.",
    keyIngredients: "Fresh Mint (36%), Coriander (24%), Green Chilli, Lemon, Rock Salt, Cumin",
    calories: "~11 kcal per 15g squeeze",
  },
  "imli-chutney": {
    tangy: 7,
    heat: 2,
    sweet: 8,
    punch: 8,
    notes: "Slow-simmered tamarind and jaggery balanced with roasted cumin and dry ginger. Sweet and tangy.",
    keyIngredients: "Tamarind Pulp (32%), Organic Jaggery, Dates, Roasted Jeera, Saunf, Dry Ginger",
    calories: "~16 kcal per 15g squeeze",
  },
};

export default function StoreHomePage() {
  const [cart, setCart] = useState<CartLineItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [spiceFilter, setSpiceFilter] = useState<number | null>(null);

  // Modals & toast
  const [selectedFlavour, setSelectedFlavour] = useState<FlavourItem | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [showStickyBar, setShowStickyBar] = useState(false);

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
  const [nextFlavourWanted, setNextFlavourWanted] = useState("");
  const [stoppedText, setStoppedText] = useState("");
  const [frequency, setFrequency] = useState("");
  const [optInDiscount, setOptInDiscount] = useState(false);
  const [optInEmail, setOptInEmail] = useState("");
  const [revealDone, setRevealDone] = useState(false);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 2500);
  };

  useEffect(() => {
    try {
      const savedCart = localStorage.getItem("ct_cart_items");
      if (savedCart) setCart(JSON.parse(savedCart));
    } catch (e) {}

    track("page_view", { url: window.location.pathname });

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

  useEffect(() => {
    try {
      localStorage.setItem("ct_cart_items", JSON.stringify(cart));
    } catch (e) {}
  }, [cart]);

  const cartTotal = cart.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);
  const cartItemCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  const addToCart = (
    kind: "single" | "pack",
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

    track("add_to_cart", { kind, flavours, qty: 1, unitPrice });
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

  const handleNotifyMe = (item: ComingSoonItem) => {
    track("notify_click", { product_id: item.id, name: item.name });
    showToast(`We'll notify you when ${item.name} launches!`);
  };

  const displayedFlavours = spiceFilter
    ? storeConfig.flavours.filter((f) => f.spice === spiceFilter)
    : storeConfig.flavours;

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
    track("checkout_started", { cart, total: cartTotal });
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
    });
    setCheckoutStep(3);
  };

  const handleRevealSurveySubmit = (e: React.FormEvent) => {
    e.preventDefault();

    track("survey_submitted", {
      tubeFeeling,
      nextFlavourWanted,
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

  const hasWhatsApp = Boolean(storeConfig.brand.whatsAppNumber && storeConfig.brand.whatsAppNumber.trim().length > 0);
  const hasEmail = Boolean(storeConfig.brand.contactEmail && storeConfig.brand.contactEmail.trim().length > 0);

  return (
    <div className="flex flex-col min-h-screen bg-paper text-ink">
      {/* 1. Announcement Bar */}
      <div className="bg-ink text-paper text-xs sm:text-sm font-medium py-2 px-4 text-center tracking-wide flex items-center justify-center space-x-2">
        <span className="w-2 h-2 rounded-full bg-haldi animate-pulse" />
        <span>{storeConfig.copy.announcement}</span>
      </div>

      {/* 2. Sticky Header */}
      <header className="sticky top-0 z-40 bg-deepLeaf text-paper px-4 sm:px-8 py-3.5 border-b border-ink shadow-md flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Link href="/" className="flex items-center space-x-2.5 group">
            <div className="w-8 h-8 rounded-lg bg-haldi flex items-center justify-center p-1 shadow-sm transition transform group-hover:rotate-6">
              <svg aria-hidden="true" viewBox="0 0 32 32" className="w-6 h-6" fill="none">
                <rect x="6" y="2" width="20" height="4" fill="#ca8a04" rx="1" />
                <path d="M 6 6 L 26 6 C 26 22 25 26 23 28 C 21 30 19 31 16 31 C 13 31 11 30 9 28 C 7 26 6 22 6 6 Z" fill="#18241b" />
                <circle cx="16" cy="18" r="4" fill="#c8361f" />
              </svg>
            </div>
            <span className="font-heading font-extrabold text-xl sm:text-2xl tracking-tight text-haldi group-hover:text-paper transition">
              {storeConfig.brand.name}
            </span>
          </Link>
        </div>

        <nav className="hidden md:flex items-center space-x-7 text-sm font-semibold text-paper">
          <a href="#chutneys" className="hover:text-haldi transition">All 8 Tubes</a>
          <a href="#packs" className="hover:text-haldi transition">Value Packs</a>
          <a href="#comparison" className="hover:text-haldi transition">Why a Squeeze Tube?</a>
          <a href="#faq" className="hover:text-haldi transition">FAQ</a>
          {hasWhatsApp && (
            <a
              href={`https://wa.me/${storeConfig.brand.whatsAppNumber}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs bg-leaf hover:bg-leaf/90 text-paper px-3 py-1.5 rounded-full transition"
            >
              WhatsApp
            </a>
          )}
        </nav>

        <button
          type="button"
          onClick={() => setIsCartOpen(true)}
          className="bg-haldi hover:bg-[#e2a80d] text-ink font-heading font-black text-xs sm:text-sm px-4 py-2 rounded-full shadow-md flex items-center space-x-2 transition transform active:scale-95"
          aria-label="Open Cart"
        >
          <span>Cart</span>
          <span className="w-5 h-5 rounded-full bg-ink text-paper flex items-center justify-center text-xs font-bold">
            {cartItemCount}
          </span>
        </button>
      </header>

      {/* 3. HERO SECTION */}
      <section className="relative bg-gradient-to-b from-[#103b20] via-[#134a28] to-[#1d6b3a] text-paper pt-10 sm:pt-14 pb-16 sm:pb-24 px-4 sm:px-8 border-b border-[#103b20] overflow-hidden">
        <div className="absolute -right-28 top-1/4 w-[520px] h-[520px] rounded-full bg-haldi/15 blur-3xl pointer-events-none" />
        <div className="absolute -left-28 bottom-0 w-[420px] h-[420px] rounded-full bg-leaf/20 blur-3xl pointer-events-none" />

        <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-10 items-center relative z-10">
          {/* Left Column: Messaging & CTAs */}
          <div className="lg:col-span-7 space-y-6 text-left">
            {/* Headline */}
            <h1 className="font-heading font-black text-4xl sm:text-5xl lg:text-6xl text-paper leading-[1.05] tracking-tight">
              {storeConfig.copy.hero.headlinePart1}
              <span className="text-haldi block sm:inline">
                {storeConfig.copy.hero.headlineHighlight}
              </span>
            </h1>

            {/* Subline */}
            <p className="text-base sm:text-lg lg:text-xl text-paper/95 leading-relaxed max-w-xl font-normal">
              {storeConfig.copy.hero.sub}
            </p>

            {/* "Made for every bite" strip */}
            <div className="bg-black/25 backdrop-blur-sm border-l-4 border-haldi pl-4 py-2.5 pr-4 rounded-r-xl">
              <span className="text-[11px] font-heading font-extrabold uppercase tracking-wider text-haldi block mb-1">
                Made for every bite:
              </span>
              <p className="text-xs sm:text-sm text-paper font-medium leading-relaxed">
                {storeConfig.copy.hero.everyBiteStrip}
              </p>
            </div>

            {/* Quick Flavour Tags (Using only the 8 new names) */}
            <div className="space-y-2 pt-1">
              <span className="text-[11px] font-heading font-extrabold uppercase tracking-widest text-paper/70 block">
                The 8 Everyday Tubes:
              </span>
              <div className="flex flex-wrap items-center gap-2">
                {storeConfig.flavours.map((flv) => (
                  <a
                    key={flv.id}
                    href="#chutneys"
                    className="inline-flex items-center space-x-1.5 bg-white/10 hover:bg-white/20 backdrop-blur px-3 py-1 rounded-full text-xs text-paper border border-white/15 transition transform hover:scale-105"
                  >
                    <span className="w-2 h-2 rounded-full" style={{ backgroundColor: flv.color }} />
                    <span>{flv.name}</span>
                  </a>
                ))}
              </div>
            </div>

            {/* CTA Cluster */}
            <div className="pt-2 flex flex-wrap items-center gap-3.5">
              <a
                href="#chutneys"
                className="bg-haldi hover:bg-[#e2a80d] text-ink font-heading font-black text-sm sm:text-base px-8 py-4 rounded-xl shadow-xl transition transform active:scale-95 inline-flex items-center space-x-2 group"
              >
                <span>{storeConfig.copy.hero.exploreCta} · ₹99</span>
                <span className="transform group-hover:translate-x-1 transition">→</span>
              </a>
              <a
                href="#packs"
                className="bg-white/10 hover:bg-white/20 border-2 border-paper/80 hover:border-paper text-paper font-heading font-black text-sm sm:text-base px-6 py-3.5 rounded-xl transition inline-flex items-center space-x-2"
              >
                <span>{storeConfig.copy.hero.packsCta}</span>
                <span className="bg-haldi text-ink text-[10px] font-extrabold px-2 py-0.5 rounded-full uppercase tracking-wider">
                  Bundles
                </span>
              </a>
            </div>

            {/* Trust Micro-Badges */}
            <div className="pt-2 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs text-paper/90">
              <div className="flex items-center space-x-1.5">
                <span className="w-4 h-4 rounded-full bg-ink border border-haldi text-haldi flex items-center justify-center text-[10px] font-bold">✓</span>
                <span className="font-medium">100% Vegetarian &amp; Eggless</span>
              </div>
              <div className="flex items-center space-x-1.5">
                <span className="w-4 h-4 rounded-full bg-ink border border-haldi text-haldi flex items-center justify-center text-[10px] font-bold">✓</span>
                <span className="font-medium">No Spoon, No Spill</span>
              </div>
              <div className="flex items-center space-x-1.5">
                <span className="w-4 h-4 rounded-full bg-ink border border-haldi text-haldi flex items-center justify-center text-[10px] font-bold">✓</span>
                <span className="font-medium">100 g Squeeze Tube</span>
              </div>
              <div className="flex items-center space-x-1.5">
                <span className="w-4 h-4 rounded-full bg-ink border border-haldi text-haldi flex items-center justify-center text-[10px] font-bold">✓</span>
                <span className="font-medium">Delivery Across India</span>
              </div>
            </div>
          </div>

          {/* Right Visual: 3D Tube Showcase */}
          <div className="lg:col-span-5 flex justify-center lg:justify-end">
            <div className="relative w-full max-w-md sm:max-w-lg aspect-square">
              <div className="absolute -top-2 right-2 bg-white text-ink px-3.5 py-1.5 rounded-xl shadow-2xl border border-steel flex items-center space-x-2 text-xs font-heading font-black rotate-2 z-20">
                <span className="w-2 h-2 rounded-full bg-red-600" />
                <span>No Spoon, No Spill, No Sticky Jar</span>
              </div>

              <div className="absolute bottom-4 -left-2 bg-haldi text-ink px-3.5 py-1.5 rounded-xl shadow-2xl border border-white flex items-center space-x-2 text-xs font-heading font-black -rotate-3 z-20">
                <span>✨ 100 g squeeze tube with flip-top cap</span>
              </div>

              <div className="w-full h-full flex items-center justify-center">
                <ProductRender flavour={storeConfig.flavours[6]} showKatori={true} angle={-8} />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 4. TRUST STRIP */}
      <section className="bg-card border-b border-steel py-6 px-4 sm:px-8">
        <div className="max-w-6xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
          {storeConfig.copy.trustStrip.map((item, idx) => (
            <div key={idx} className="flex flex-col items-center justify-center p-2 space-y-1">
              <div className="w-8 h-8 rounded-full bg-paper text-leaf flex items-center justify-center font-black text-sm">
                ✓
              </div>
              <span className="font-heading font-extrabold text-xs sm:text-sm text-ink">
                {item.title}
              </span>
              <span className="text-[11px] text-muted hidden sm:block">
                {item.desc}
              </span>
            </div>
          ))}
        </div>
      </section>

      {/* 5. CATALOGUE (8 Active Squeeze Tubes) */}
      <section id="chutneys" className="py-16 px-4 sm:px-8 max-w-6xl mx-auto w-full">
        <div className="text-center max-w-2xl mx-auto mb-10 space-y-2">
          <div className="inline-flex items-center space-x-1.5 bg-leaf/10 text-leaf text-[11px] font-heading font-extrabold px-3 py-1 rounded-full font-semibold">
            <span>Everyday Indian Lineup</span>
          </div>
          <h2 className="font-heading font-black text-3xl sm:text-4xl text-ink">
            {storeConfig.copy.catalogue.h2}
          </h2>
          <p className="text-sm sm:text-base text-muted">
            {storeConfig.copy.catalogue.lede}
          </p>

          {/* Spice Filter Chips */}
          <div className="flex flex-wrap items-center justify-center gap-2 pt-4">
            <button
              type="button"
              onClick={() => handleSpiceFilter(null)}
              className={`px-4 py-1.5 rounded-full text-xs font-bold transition ${
                spiceFilter === null
                  ? "bg-ink text-paper shadow-sm"
                  : "bg-card text-ink border border-steel hover:border-ink"
              }`}
            >
              All (8)
            </button>
            <button
              type="button"
              onClick={() => handleSpiceFilter(1)}
              className={`px-4 py-1.5 rounded-full text-xs font-bold transition ${
                spiceFilter === 1
                  ? "bg-leaf text-paper shadow-sm"
                  : "bg-card text-ink border border-steel hover:border-leaf"
              }`}
            >
              Mild
            </button>
            <button
              type="button"
              onClick={() => handleSpiceFilter(2)}
              className={`px-4 py-1.5 rounded-full text-xs font-bold transition ${
                spiceFilter === 2
                  ? "bg-haldi text-ink shadow-sm"
                  : "bg-card text-ink border border-steel hover:border-haldi"
              }`}
            >
              Medium
            </button>
            <button
              type="button"
              onClick={() => handleSpiceFilter(3)}
              className={`px-4 py-1.5 rounded-full text-xs font-bold transition ${
                spiceFilter === 3
                  ? "bg-mirch text-paper shadow-sm"
                  : "bg-card text-ink border border-steel hover:border-mirch"
              }`}
            >
              Hot
            </button>
          </div>
        </div>

        {/* 8 Product Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {displayedFlavours.map((flavour) => {
            return (
              <div
                key={flavour.id}
                className="bg-card rounded-3xl p-5 border border-steel shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col justify-between group hover:-translate-y-1"
              >
                <div>
                  <div
                    onClick={() => openProductDetail(flavour)}
                    className="w-full h-56 rounded-2xl p-2 cursor-pointer relative overflow-hidden flex items-center justify-center transition"
                    style={{ backgroundColor: `${flavour.color}15` }}
                  >
                    <ProductRender flavour={flavour} showKatori={true} angle={-12} />
                    <span className="absolute bottom-2.5 right-2.5 bg-card/90 backdrop-blur-sm text-[10px] font-bold text-ink px-2 py-0.5 rounded shadow-sm opacity-0 group-hover:opacity-100 transition">
                      View Profile
                    </span>
                  </div>

                  <div className="flex items-center justify-between mt-3 mb-1">
                    <span className="text-[10px] font-bold font-semibold text-muted">
                      {flavour.local}
                    </span>
                    <div className="w-3.5 h-3.5 border border-leaf rounded-sm p-0.5 flex items-center justify-center">
                      <div className="w-1.5 h-1.5 rounded-full bg-leaf" />
                    </div>
                  </div>

                  <h3
                    onClick={() => openProductDetail(flavour)}
                    className="font-heading font-black text-base sm:text-lg text-ink cursor-pointer hover:text-leaf transition leading-snug"
                  >
                    {flavour.name}
                  </h3>

                  <div className="flex items-center space-x-2 my-1.5 text-xs text-muted">
                    <span>100 g tube</span>
                    <span>•</span>
                    <div className="flex items-center space-x-1">
                      {[1, 2, 3].map((dot) => (
                        <span
                          key={dot}
                          className={`w-1.5 h-1.5 rounded-full ${
                            dot <= flavour.spice ? "bg-mirch" : "bg-steel"
                          }`}
                        />
                      ))}
                      <span className="text-[11px] font-semibold text-ink ml-1">
                        {flavour.spice === 1 ? "Mild" : flavour.spice === 2 ? "Medium" : "Hot"}
                      </span>
                    </div>
                  </div>

                  <p className="text-xs text-muted line-clamp-2 my-1 leading-relaxed">
                    {flavour.desc}
                  </p>

                  <div className="pt-2 flex flex-wrap gap-1">
                    {flavour.goesWith.split(",").slice(0, 2).map((food, fidx) => (
                      <span
                        key={fidx}
                        className="text-[10px] bg-paper text-ink font-medium px-2 py-0.5 rounded-md"
                      >
                        {food.trim()}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="pt-3 border-t border-steel flex items-center justify-between mt-3">
                  <div>
                    <span className="font-heading font-extrabold text-lg text-ink">
                      {formatInr(flavour.unitPrice)}
                    </span>
                    <span className="block text-[10px] text-muted">MRP incl. of taxes</span>
                  </div>

                  <button
                    type="button"
                    onClick={() => addToCart("single", [flavour.id], flavour.name, flavour.unitPrice)}
                    className="bg-leaf hover:bg-deepLeaf text-paper font-heading font-bold text-xs px-4 py-2.5 rounded-xl shadow-sm transition transform active:scale-95 flex items-center space-x-1"
                  >
                    <span>+ Add</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Coming Soon Row */}
        <div className="mt-16 pt-10 border-t border-steel">
          <div className="text-center max-w-xl mx-auto mb-8 space-y-1">
            <span className="text-xs font-heading font-extrabold text-mirch font-semibold uppercase tracking-wider">
              {storeConfig.copy.catalogue.comingSoonHeading}
            </span>
            <h3 className="font-heading font-black text-2xl text-ink">
              Next Flavours In The Kitchen
            </h3>
            <p className="text-xs sm:text-sm text-muted">
              {storeConfig.copy.catalogue.comingSoonLede}
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {storeConfig.comingSoon.map((item) => (
              <div
                key={item.id}
                className="bg-card rounded-3xl p-6 border border-steel shadow-sm flex flex-col justify-between space-y-4 relative overflow-hidden"
              >
                <div className="flex items-center justify-between">
                  <span className="text-[10px] bg-haldi text-ink font-heading font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                    Coming Soon
                  </span>
                  <div className="w-3.5 h-3.5 border border-leaf rounded-sm p-0.5 flex items-center justify-center">
                    <div className="w-1.5 h-1.5 rounded-full bg-leaf" />
                  </div>
                </div>

                <div>
                  <h4 className="font-heading font-black text-lg text-ink">
                    {item.name}
                  </h4>
                  <span className="text-xs text-muted font-bold block mb-2">
                    {item.hindi}
                  </span>
                  <p className="text-xs text-muted leading-relaxed">
                    {item.desc}
                  </p>
                </div>

                <div className="pt-3 border-t border-steel">
                  <button
                    type="button"
                    onClick={() => handleNotifyMe(item)}
                    className="w-full bg-paper hover:bg-steel border border-steel text-ink font-heading font-bold text-xs py-2.5 rounded-xl transition-colors shadow-sm flex items-center justify-center space-x-1.5"
                  >
                    <span>Notify Me</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 6. "WHY A SQUEEZE TUBE?" COMPARISON */}
      <section id="comparison" className="py-16 bg-ink text-paper px-4 sm:px-8">
        <div className="max-w-4xl mx-auto">
          <div className="text-center max-w-xl mx-auto mb-10 space-y-1">
            <h2 className="font-heading font-black text-2xl sm:text-3xl text-haldi">
              {storeConfig.copy.comparison.heading}
            </h2>
            <p className="text-xs sm:text-sm text-steel">
              {storeConfig.copy.comparison.sub}
            </p>
          </div>

          <div className="overflow-hidden bg-deepLeaf rounded-2xl border-2 border-paper/10">
            <table className="w-full text-left text-xs sm:text-sm border-collapse">
              <thead>
                <tr className="border-b border-paper/10 text-paper/70 font-semibold text-[10px] font-heading font-bold uppercase tracking-wider">
                  <th className="py-3.5 px-4">Daily Factor</th>
                  <th className="py-3.5 px-4 text-haldi font-black">Squeeze Tube</th>
                  <th className="py-3.5 px-4">Glass Jar</th>
                  <th className="py-3.5 px-4">Single Sachet</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10">
                {storeConfig.copy.comparison.rows.map((row, idx) => (
                  <tr key={idx} className="hover:bg-card/5 transition">
                    <td className="py-3.5 px-4 font-semibold text-paper">{row.factor}</td>
                    <td className="py-3.5 px-4 font-bold text-haldi">✓ {row.tube}</td>
                    <td className="py-3.5 px-4 text-paper/70">{row.jar}</td>
                    <td className="py-3.5 px-4 text-paper/70">{row.sachet}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* 7. WHERE PEOPLE USE IT */}
      <section className="py-14 px-4 sm:px-8 max-w-6xl mx-auto w-full">
        <div className="text-center max-w-xl mx-auto mb-10 space-y-1">
          <span className="text-xs font-heading font-extrabold text-leaf font-semibold">
            Everyday Moments
          </span>
          <h2 className="font-heading font-black text-2xl sm:text-3xl text-ink">
            Where People Use It
          </h2>
          <p className="text-xs sm:text-sm text-muted">
            Made for real meals, snacks and travel across India.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {storeConfig.copy.wherePeopleUseIt.map((tile, idx) => (
            <div key={idx} className="bg-card rounded-2xl p-5 border border-steel shadow-sm space-y-2">
              <h3 className="font-heading font-bold text-base text-ink flex items-center space-x-1.5">
                <span className="text-leaf">●</span>
                <span>{tile.title}</span>
              </h3>
              <p className="text-xs text-muted leading-relaxed">{tile.text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* 8. PACKS & VALUE BUNDLES */}
      <section id="packs" className="py-16 bg-card border-t border-steel px-4 sm:px-8">
        <div className="max-w-6xl mx-auto">
          <div className="text-center max-w-xl mx-auto mb-10 space-y-1">
            <span className="text-xs font-heading font-extrabold text-leaf font-semibold">
              Curated Value Bundles
            </span>
            <h2 className="font-heading font-black text-2xl sm:text-4xl text-ink">
              Choose Your Pack
            </h2>
            <p className="text-xs sm:text-sm text-muted">
              Every pack includes free delivery across India.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {storeConfig.packs.map((pack: PackItem) => (
              <div
                key={pack.id}
                className={`rounded-3xl p-6 border flex flex-col justify-between space-y-4 relative ${
                  pack.badge === "Best value"
                    ? "bg-deepLeaf text-paper border-2 border-haldi shadow-xl"
                    : "bg-paper text-ink border-steel shadow-sm"
                }`}
              >
                {pack.badge && (
                  <div
                    className={`absolute top-4 right-4 text-[10px] font-semibold font-heading font-black px-2.5 py-0.5 rounded-full ${
                      pack.badge === "Best value"
                        ? "bg-haldi text-ink"
                        : "bg-mirch text-paper"
                    }`}
                  >
                    {pack.badge}
                  </div>
                )}

                <div>
                  <span
                    className={`text-[11px] font-bold block ${
                      pack.badge === "Best value" ? "text-haldi" : "text-muted"
                    }`}
                  >
                    {pack.subtitle}
                  </span>
                  <h3
                    className={`font-heading font-black text-xl mt-1 ${
                      pack.badge === "Best value" ? "text-paper" : "text-ink"
                    }`}
                  >
                    {pack.name}
                  </h3>
                  <p
                    className={`text-xs mt-1 leading-relaxed ${
                      pack.badge === "Best value" ? "text-paper/85" : "text-muted"
                    }`}
                  >
                    {pack.description}
                  </p>

                  <div className="mt-4">
                    <span
                      className={`font-heading font-black text-2xl ${
                        pack.badge === "Best value" ? "text-haldi" : "text-ink"
                      }`}
                    >
                      {formatInr(pack.price)}
                    </span>
                    <span
                      className={`block text-[10px] ${
                        pack.badge === "Best value" ? "text-paper/70" : "text-muted"
                      }`}
                    >
                      Free delivery across India
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => addToCart("pack", pack.flavourIds, pack.name, pack.price)}
                  className={`w-full font-heading font-bold text-xs py-3 rounded-xl shadow transition transform active:scale-95 ${
                    pack.badge === "Best value"
                      ? "bg-haldi hover:bg-[#e2a80d] text-ink font-black"
                      : "bg-leaf hover:bg-deepLeaf text-paper"
                  }`}
                >
                  Add {pack.name}
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 9. FAQ ACCORDION */}
      <section id="faq" className="py-14 px-4 sm:px-8 max-w-3xl mx-auto w-full">
        <div className="text-center mb-8">
          <h2 className="font-heading font-black text-2xl sm:text-3xl text-ink">
            Frequently Asked Questions
          </h2>
        </div>

        <div className="space-y-3">
          {storeConfig.copy.faq.map((item, idx) => (
            <details key={idx} className="group bg-card rounded-2xl border border-steel p-4 transition">
              <summary className="font-heading font-bold text-sm sm:text-base text-ink cursor-pointer flex justify-between items-center list-none">
                <span>{item.q}</span>
                <span className="text-leaf font-black text-lg group-open:rotate-45 transition-transform">
                  +
                </span>
              </summary>
              <p className="mt-3 text-xs sm:text-sm text-muted leading-relaxed border-t border-steel pt-3">
                {item.a}
              </p>
            </details>
          ))}
        </div>
      </section>

      {/* 10. FOOTER */}
      <footer className="mt-auto bg-deepLeaf text-paper py-12 px-4 sm:px-8 border-t border-ink">
        <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-12 gap-8">
          <div className="md:col-span-6 space-y-3">
            <span className="font-heading font-black text-2xl text-haldi">
              {storeConfig.brand.name}
            </span>
            <p className="text-sm font-medium text-paper">{storeConfig.brand.tagline}</p>
            <p className="text-xs text-steel leading-relaxed max-w-sm">
              {storeConfig.brand.subheadline}
            </p>
            {hasWhatsApp && (
              <a
                href={`https://wa.me/${storeConfig.brand.whatsAppNumber}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center space-x-2 bg-leaf text-paper text-xs font-bold px-4 py-2 rounded-xl mt-2 shadow-md transition"
              >
                <span>WhatsApp Us</span>
              </a>
            )}
            {hasEmail && (
              <p className="text-xs text-steel">
                Email: <a href={`mailto:${storeConfig.brand.contactEmail}`} className="underline">{storeConfig.brand.contactEmail}</a>
              </p>
            )}
          </div>

          <div className="md:col-span-3 space-y-2">
            <h4 className="font-heading font-bold text-xs font-semibold text-haldi">Shop</h4>
            <ul className="space-y-1.5 text-xs text-paper">
              <li><a href="#chutneys" className="hover:underline">All 8 Tubes</a></li>
              <li><a href="#packs" className="hover:underline">Value Packs</a></li>
              <li><a href="#comparison" className="hover:underline">Why a Squeeze Tube?</a></li>
              <li><a href="#faq" className="hover:underline">FAQ</a></li>
            </ul>
          </div>

          <div className="md:col-span-3 space-y-2">
            <h4 className="font-heading font-bold text-xs font-semibold text-haldi">Policies</h4>
            <ul className="space-y-1.5 text-xs text-paper">
              <li><Link href="/shipping" className="hover:underline">Shipping Policy</Link></li>
              <li><Link href="/refunds" className="hover:underline">Refunds &amp; Cancellations</Link></li>
              <li><Link href="/privacy" className="hover:underline">Privacy Policy (DPDP Act)</Link></li>
              <li><Link href="/terms" className="hover:underline">Terms of Service</Link></li>
            </ul>
          </div>
        </div>

        <div className="max-w-6xl mx-auto mt-8 pt-6 border-t border-paper/10 text-center text-xs text-paper/60">
          <p>{storeConfig.brand.copyright}</p>
        </div>
      </footer>

      {/* 11. FLOATING ORDER PILL ON MOBILE */}
      {showStickyBar && (
        <div className="md:hidden fixed bottom-4 inset-x-4 z-40 bg-ink text-paper p-3 rounded-2xl shadow-2xl flex items-center justify-between animate-slideUp">
          <div>
            <span className="text-[10px] text-haldi font-bold block">100 g Squeeze Tube</span>
            <span className="font-heading font-black text-sm">₹99</span>
          </div>

          <div className="flex items-center space-x-2">
            <a
              href="#chutneys"
              className="bg-haldi text-ink font-heading font-black text-xs px-4 py-2 rounded-xl shadow transition"
            >
              Order Now
            </a>
            <button
              onClick={() => setIsCartOpen(true)}
              className="bg-card/20 text-paper font-bold text-xs px-3 py-2 rounded-xl"
            >
              Cart ({cartItemCount})
            </button>
          </div>
        </div>
      )}

      {/* TOAST NOTIFICATION */}
      {toastMessage && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-ink text-paper text-xs font-bold px-4 py-2.5 rounded-full shadow-2xl flex items-center space-x-2 transition-transform">
          <span>✓</span>
          <span>{toastMessage}</span>
        </div>
      )}

      {/* CART DRAWER */}
      {isCartOpen && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div
            onClick={() => setIsCartOpen(false)}
            className="fixed inset-0 bg-ink/60 transition-opacity"
          />
          <div className="relative w-full max-w-md bg-card h-full shadow-2xl flex flex-col justify-between p-6 z-10 animate-slideLeft">
            <div>
              <div className="flex items-center justify-between border-b border-steel pb-4">
                <div className="flex items-center space-x-2">
                  <h3 className="font-heading font-black text-xl text-ink">Your Cart</h3>
                  <span className="text-xs bg-paper text-ink font-bold px-2 py-0.5 rounded-full">
                    {cartItemCount} {cartItemCount === 1 ? "item" : "items"}
                  </span>
                </div>
                <button
                  onClick={() => setIsCartOpen(false)}
                  className="w-8 h-8 rounded-full bg-paper text-ink font-black text-sm"
                >
                  ✕
                </button>
              </div>

              {/* Delivery info in cart */}
              <div className="my-3 p-3 bg-paper rounded-xl text-xs space-y-1 border border-steel flex items-center justify-between">
                <span className="font-bold text-leaf">✓ Free delivery across India</span>
                <span className="text-[11px] text-muted">₹0 Shipping</span>
              </div>

              {cart.length === 0 ? (
                <div className="py-16 text-center space-y-3">
                  <p className="font-heading font-bold text-sm text-ink">Your cart is empty.</p>
                  <p className="text-xs text-muted">Add your favourite squeeze tubes to begin.</p>
                </div>
              ) : (
                <div className="divide-y divide-steel max-h-[55vh] overflow-y-auto py-2">
                  {cart.map((item) => (
                    <div key={item.id} className="py-3 flex items-center justify-between">
                      <div className="space-y-0.5 max-w-[200px]">
                        <h4 className="font-heading font-bold text-sm text-ink">{item.title}</h4>
                        <span className="text-xs text-muted">{formatInr(item.unitPrice)} each</span>
                      </div>

                      <div className="flex items-center space-x-2 border border-steel rounded-lg bg-paper px-1">
                        <button
                          onClick={() => updateCartQty(item.id, -1)}
                          className="px-2 py-1 text-xs font-black text-ink"
                        >
                          -
                        </button>
                        <span className="text-xs font-bold text-ink">{item.quantity}</span>
                        <button
                          onClick={() => updateCartQty(item.id, 1)}
                          className="px-2 py-1 text-xs font-black text-ink"
                        >
                          +
                        </button>
                      </div>

                      <span className="font-heading font-extrabold text-sm text-ink">
                        {formatInr(item.unitPrice * item.quantity)}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {cart.length > 0 && (
              <div className="border-t border-steel pt-4 space-y-3">
                <div className="flex justify-between items-center text-sm font-bold">
                  <span>Total (MRP incl. of all taxes):</span>
                  <span className="font-heading font-black text-xl text-ink">
                    {formatInr(cartTotal)}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={handleStartCheckout}
                  className="w-full bg-leaf hover:bg-deepLeaf text-paper font-heading font-black text-sm py-3.5 rounded-xl shadow-lg transition-colors whitespace-nowrap"
                >
                  Proceed to Checkout · {formatInr(cartTotal)}
                </button>
                <p className="text-[10px] text-center text-muted">
                  Free delivery across India · 100 g squeeze tube with flip-top cap
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* PRODUCT DETAIL MODAL */}
      {selectedFlavour && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            onClick={() => setSelectedFlavour(null)}
            className="fixed inset-0 bg-ink/70"
          />
          <div className="relative bg-card rounded-3xl p-6 sm:p-8 max-w-lg w-full z-10 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setSelectedFlavour(null)}
              className="absolute top-4 right-4 w-8 h-8 rounded-full bg-paper text-ink font-black text-sm"
            >
              ✕
            </button>

            <div
              className="w-full h-56 flex items-center justify-center rounded-2xl p-2 relative overflow-hidden"
              style={{ backgroundColor: `${selectedFlavour.color}15` }}
            >
              <ProductRender flavour={selectedFlavour} showKatori={true} angle={-10} />
            </div>

            <div className="space-y-1">
              <div className="flex justify-between items-center">
                <span className="text-xs font-bold text-mirch font-semibold">
                  {selectedFlavour.local}
                </span>
                <span className="font-heading font-black text-xl text-ink">
                  {formatInr(selectedFlavour.unitPrice)}
                </span>
              </div>
              <h3 className="font-heading font-black text-2xl text-ink">
                {selectedFlavour.name} ({selectedFlavour.hindi})
              </h3>
              <p className="text-xs text-muted leading-relaxed">{selectedFlavour.desc}</p>
            </div>

            {TASTE_PROFILES[selectedFlavour.id] && (
              <div className="bg-paper p-4 rounded-2xl border border-steel space-y-2">
                <span className="text-[10px] font-heading font-extrabold font-semibold text-leaf uppercase tracking-wider">
                  Taste Profile Intensity
                </span>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <div className="flex justify-between mb-0.5">
                      <span className="text-muted">Tanginess</span>
                      <span className="font-bold">{TASTE_PROFILES[selectedFlavour.id].tangy}/10</span>
                    </div>
                    <div className="w-full bg-steel h-1.5 rounded-full overflow-hidden">
                      <div
                        className="bg-haldi h-full"
                        style={{ width: `${TASTE_PROFILES[selectedFlavour.id].tangy * 10}%` }}
                      />
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between mb-0.5">
                      <span className="text-muted">Spice Heat</span>
                      <span className="font-bold">{TASTE_PROFILES[selectedFlavour.id].heat}/10</span>
                    </div>
                    <div className="w-full bg-steel h-1.5 rounded-full overflow-hidden">
                      <div
                        className="bg-mirch h-full"
                        style={{ width: `${TASTE_PROFILES[selectedFlavour.id].heat * 10}%` }}
                      />
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between mb-0.5">
                      <span className="text-muted">Sweetness</span>
                      <span className="font-bold">{TASTE_PROFILES[selectedFlavour.id].sweet}/10</span>
                    </div>
                    <div className="w-full bg-steel h-1.5 rounded-full overflow-hidden">
                      <div
                        className="bg-leaf h-full"
                        style={{ width: `${TASTE_PROFILES[selectedFlavour.id].sweet * 10}%` }}
                      />
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between mb-0.5">
                      <span className="text-muted">Desi Punch</span>
                      <span className="font-bold">{TASTE_PROFILES[selectedFlavour.id].punch}/10</span>
                    </div>
                    <div className="w-full bg-steel h-1.5 rounded-full overflow-hidden">
                      <div
                        className="bg-ink h-full"
                        style={{ width: `${TASTE_PROFILES[selectedFlavour.id].punch * 10}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div className="bg-paper p-4 rounded-2xl text-xs space-y-1.5 border border-steel">
              {TASTE_PROFILES[selectedFlavour.id] && (
                <>
                  <div className="pb-1 border-b border-steel">
                    <span className="text-muted block text-[10px] font-semibold font-bold">Key Ingredients:</span>
                    <span className="font-medium text-ink">
                      {TASTE_PROFILES[selectedFlavour.id].keyIngredients}
                    </span>
                  </div>
                  <div className="flex justify-between py-0.5">
                    <span className="text-muted">Calories:</span>
                    <span className="font-bold">{TASTE_PROFILES[selectedFlavour.id].calories}</span>
                  </div>
                </>
              )}
              <div className="flex justify-between py-0.5">
                <span className="text-muted">Recommended Pairings:</span>
                <span className="font-bold">{selectedFlavour.goesWith}</span>
              </div>
              <div className="flex justify-between py-0.5">
                <span className="text-muted">Packaging:</span>
                <span className="font-bold">100 g squeeze tube with flip-top cap</span>
              </div>
              <div className="flex justify-between py-0.5">
                <span className="text-muted">Dietary:</span>
                <span className="font-bold text-leaf">100% Vegetarian &amp; Eggless</span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                addToCart("single", [selectedFlavour.id], selectedFlavour.name, selectedFlavour.unitPrice);
                setSelectedFlavour(null);
              }}
              className="w-full bg-leaf hover:bg-deepLeaf text-paper font-heading font-black text-sm py-3.5 rounded-xl shadow-lg transition"
            >
              Add to Cart · {formatInr(selectedFlavour.unitPrice)}
            </button>
          </div>
        </div>
      )}

      {/* CHECKOUT & REVEAL MODAL */}
      {isCheckoutOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-ink/70" />
          <div className="relative bg-card rounded-3xl p-6 sm:p-8 max-w-xl w-full z-10 shadow-2xl max-h-[92vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b border-steel pb-3 mb-4">
              <span className="font-heading font-black text-lg text-deepLeaf">
                {checkoutStep === 3 ? "Order Completed" : "Order Checkout"}
              </span>
              {checkoutStep !== 3 && (
                <button
                  onClick={() => setIsCheckoutOpen(false)}
                  className="w-7 h-7 rounded-full bg-paper text-ink font-black text-xs"
                >
                  ✕
                </button>
              )}
            </div>

            {/* STEP 1: DELIVERY FORM */}
            {checkoutStep === 1 && (
              <form onSubmit={handleDetailsSubmit} className="space-y-4">
                <div className="bg-paper p-3 rounded-2xl flex justify-between items-center text-xs font-bold border border-steel">
                  <span>
                    Order Total ({cartItemCount} {cartItemCount === 1 ? "tube" : "tubes"}):
                  </span>
                  <span className="font-heading font-black text-base text-ink">
                    {formatInr(cartTotal)}
                  </span>
                </div>

                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-bold text-ink mb-1">Full Name</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Rahul Sharma"
                      value={deliveryDetails.name}
                      onChange={(e) => setDeliveryDetails({ ...deliveryDetails, name: e.target.value })}
                      className="w-full text-xs sm:text-sm px-4 py-2.5 rounded-xl border border-steel bg-paper focus:bg-card focus:border-leaf transition"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-ink mb-1">10-Digit Mobile</label>
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
                        className="w-full text-xs sm:text-sm px-4 py-2.5 rounded-xl border border-steel bg-paper focus:bg-card focus:border-leaf transition"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-ink mb-1">Email Address</label>
                      <input
                        type="email"
                        required
                        placeholder="rahul@example.com"
                        value={deliveryDetails.email}
                        onChange={(e) => setDeliveryDetails({ ...deliveryDetails, email: e.target.value })}
                        className="w-full text-xs sm:text-sm px-4 py-2.5 rounded-xl border border-steel bg-paper focus:bg-card focus:border-leaf transition"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-ink mb-1">6-Digit Pincode</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. 560001 or 110001"
                      value={deliveryDetails.pincode}
                      onChange={handlePincodeChange}
                      className="w-full text-xs sm:text-sm px-4 py-2.5 rounded-xl border border-steel bg-paper focus:bg-card focus:border-leaf transition"
                    />

                    {pincodeValid === true && (
                      <p className="text-xs text-leaf font-bold mt-1.5 flex items-center space-x-1">
                        <span>✓</span>
                        <span>Delivery across India available for {postalZone} · Free delivery</span>
                      </p>
                    )}
                    {pincodeValid === false && deliveryDetails.pincode.length === 6 && (
                      <p className="text-xs text-mirch font-bold mt-1.5 flex items-center space-x-1">
                        <span>✕</span>
                        <span>Invalid PIN code format. Please enter a valid 6-digit Indian pincode.</span>
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-ink mb-1">
                      Delivery Address
                    </label>
                    <textarea
                      required
                      rows={2}
                      placeholder="House / Flat / Block no., Street name, Area"
                      value={deliveryDetails.address}
                      onChange={(e) => setDeliveryDetails({ ...deliveryDetails, address: e.target.value })}
                      className="w-full text-xs sm:text-sm px-4 py-2.5 rounded-xl border border-steel bg-paper focus:bg-card focus:border-leaf transition"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={!pincodeValid || deliveryDetails.phone.length !== 10}
                  className="w-full bg-leaf hover:bg-deepLeaf text-paper font-heading font-black text-sm py-3.5 rounded-xl shadow-lg transition disabled:opacity-40"
                >
                  Continue to Payment
                </button>
              </form>
            )}

            {/* STEP 2: PAYMENT METHOD STEP */}
            {checkoutStep === 2 && (
              <form onSubmit={handlePayClick} className="space-y-4">
                <div className="bg-paper p-3 rounded-2xl flex justify-between items-center text-xs border border-steel">
                  <div>
                    <span className="font-bold text-ink block">Delivery across India</span>
                    <span className="text-muted">Free Delivery Included</span>
                  </div>
                  <span className="font-heading font-black text-base text-ink">
                    {formatInr(cartTotal)}
                  </span>
                </div>

                <div className="space-y-2">
                  <label className="block text-xs font-bold text-ink">Select Payment Method</label>

                  {/* UPI */}
                  <div
                    onClick={() => handleSelectPaymentMethod("upi")}
                    className={`p-3.5 rounded-xl cursor-pointer transition-colors flex items-center justify-between border ${
                      paymentMethod === "upi"
                        ? "border-leaf bg-leaf/10"
                        : "border-steel bg-paper hover:border-ink"
                    }`}
                  >
                    <div>
                      <span className="font-heading font-bold text-xs sm:text-sm text-ink block">
                        Instant UPI
                      </span>
                      <span className="text-[10px] text-muted">
                        Google Pay, PhonePe, Paytm, BHIM or any UPI app
                      </span>
                    </div>
                    {paymentMethod === "upi" && <span className="text-leaf font-black">✓</span>}
                  </div>

                  {/* Card */}
                  <div
                    onClick={() => handleSelectPaymentMethod("card")}
                    className={`p-3.5 rounded-xl cursor-pointer transition-colors flex items-center justify-between border ${
                      paymentMethod === "card"
                        ? "border-leaf bg-leaf/10"
                        : "border-steel bg-paper hover:border-ink"
                    }`}
                  >
                    <div>
                      <span className="font-heading font-bold text-xs sm:text-sm text-ink block">
                        Debit / Credit Card
                      </span>
                      <span className="text-[10px] text-muted">Visa, Mastercard, RuPay</span>
                    </div>
                    {paymentMethod === "card" && <span className="text-leaf font-black">✓</span>}
                  </div>

                  {/* Cash on Delivery */}
                  <div
                    onClick={() => handleSelectPaymentMethod("cod")}
                    className={`p-3.5 rounded-xl cursor-pointer transition-colors flex items-center justify-between border ${
                      paymentMethod === "cod"
                        ? "border-leaf bg-leaf/10"
                        : "border-steel bg-paper hover:border-ink"
                    }`}
                  >
                    <div>
                      <span className="font-heading font-bold text-xs sm:text-sm text-ink block">
                        Cash on Delivery
                      </span>
                      <span className="text-[10px] text-muted">Pay when your package arrives</span>
                    </div>
                    {paymentMethod === "cod" && <span className="text-leaf font-black">✓</span>}
                  </div>
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={!paymentMethod}
                    className="w-full bg-haldi hover:bg-[#e2a80d] text-ink font-heading font-black text-sm py-3.5 rounded-xl shadow-lg transition transform active:scale-95 disabled:opacity-40"
                  >
                    Pay {formatInr(cartTotal)}
                  </button>
                </div>
              </form>
            )}

            {/* STEP 3: HONEST REVEAL SCREEN */}
            {checkoutStep === 3 && (
              <div className="space-y-5">
                <div className="text-center space-y-2">
                  <div className="w-14 h-14 rounded-full bg-haldi/20 text-ink text-2xl flex items-center justify-center mx-auto font-black">
                    ✓
                  </div>
                  <h3 className="font-heading font-black text-xl sm:text-2xl text-ink">
                    You Haven&apos;t Been Charged.
                  </h3>
                  <p className="font-heading font-bold text-sm text-leaf">
                    We&apos;re not live yet, but your interest helps us launch!
                  </p>
                  <p className="text-xs text-muted leading-relaxed max-w-md mx-auto">
                    You&apos;re one of the first people across India to back the idea of chutney in a squeeze tube. No money was taken, and no payment details were collected.
                  </p>
                </div>

                {!revealDone ? (
                  <form onSubmit={handleRevealSurveySubmit} className="space-y-4 pt-2 border-t border-steel">
                    <div>
                      <label className="block text-xs font-bold text-ink mb-1">
                        How do you feel about chutney in a squeeze tube?
                      </label>
                      <select
                        value={tubeFeeling}
                        onChange={(e) => setTubeFeeling(e.target.value)}
                        className="w-full text-xs px-3 py-2.5 rounded-xl border border-steel bg-paper"
                      >
                        <option value="">Select an option...</option>
                        <option value="Love it, easier than a jar">Love it, much easier than a jar</option>
                        <option value="Fine with it">Fine with it</option>
                        <option value="Not sure yet">Not sure yet</option>
                        <option value="I'd rather have a jar or sachet">I&apos;d rather have a jar or sachet</option>
                      </select>
                    </div>

                    {/* NEW SURVEY QUESTION: Which would you want in a tube next? */}
                    <div>
                      <label className="block text-xs font-bold text-ink mb-1">
                        Which would you want in a tube next?
                      </label>
                      <select
                        value={nextFlavourWanted}
                        onChange={(e) => setNextFlavourWanted(e.target.value)}
                        className="w-full text-xs px-3 py-2.5 rounded-xl border border-steel bg-paper"
                      >
                        <option value="">Select a flavour...</option>
                        <option value="Lehsuni">Lehsuni</option>
                        <option value="Momo chutney">Momo chutney</option>
                        <option value="Sweet mango">Sweet mango</option>
                        <option value="Peri-peri mayo">Peri-peri mayo</option>
                        <option value="Kasundi">Kasundi</option>
                        <option value="Something else">Something else</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-ink mb-1">
                        What almost stopped you from buying?
                      </label>
                      <textarea
                        rows={2}
                        placeholder="Price, doubts about taste, shelf life, or size..."
                        value={stoppedText}
                        onChange={(e) => setStoppedText(e.target.value)}
                        className="w-full text-xs px-3 py-2 rounded-xl border border-steel bg-paper"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-ink mb-1">
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
                                ? "bg-leaf text-paper border-leaf"
                                : "bg-paper text-ink border-steel"
                            }`}
                          >
                            {opt}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Launch Discount Opt-in */}
                    <div className="p-3 bg-haldi/15 rounded-xl border border-haldi space-y-2">
                      <label className="flex items-start space-x-2 cursor-pointer text-xs font-bold text-ink">
                        <input
                          type="checkbox"
                          checked={optInDiscount}
                          onChange={(e) => setOptInDiscount(e.target.checked)}
                          className="mt-0.5 rounded text-leaf"
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
                          className="w-full text-xs px-3 py-2 rounded-lg border border-steel bg-card"
                        />
                      )}
                    </div>

                    <button
                      type="submit"
                      className="w-full bg-ink hover:bg-deepLeaf text-paper font-heading font-black text-xs py-3.5 rounded-xl shadow transition"
                    >
                      Submit Feedback
                    </button>
                  </form>
                ) : (
                  <div className="py-6 text-center space-y-3">
                    <h4 className="font-heading font-black text-lg text-ink">
                      Thank You For Helping Us Build This!
                    </h4>
                    <p className="text-xs text-muted max-w-sm mx-auto">
                      Your response has been logged directly into our validation metrics.
                    </p>
                    <button
                      type="button"
                      onClick={() => setIsCheckoutOpen(false)}
                      className="bg-leaf text-paper font-heading font-bold text-xs px-6 py-2.5 rounded-xl"
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
