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
  id: string; // unique cart line id
  kind: "single" | "combo" | "pick3";
  title: string;
  flavours: string[]; // flavour IDs
  quantity: number;
  unitPrice: number;
}

export default function StoreHomePage() {
  // Price variant state (a, b, or c)
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

  // Chutney request box
  const [requestName, setRequestName] = useState("");
  const [requestRegion, setRequestRegion] = useState("");
  const [requestSent, setRequestSent] = useState(false);

  // Checkout flow state
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [checkoutStep, setCheckoutStep] = useState<1 | 2 | 3>(1); // 1 Details, 2 Payment, 3 Reveal
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

  // On Mount: Resolve sticky variant, restore cart, track page_view & scroll_50
  useEffect(() => {
    const v = resolveVariant();
    setVariant(v);

    // Restore cart from localStorage
    try {
      const savedCart = localStorage.getItem("ct_cart_items");
      if (savedCart) setCart(JSON.parse(savedCart));
    } catch (e) {}

    track("page_view", { url: window.location.pathname });

    // 50% Scroll Listener
    let scrollLogged = false;
    const handleScroll = () => {
      if (scrollLogged) return;
      const total = document.documentElement.scrollHeight - window.innerHeight;
      if (total > 0 && window.scrollY / total >= 0.5) {
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

  // Total cart calculation
  const cartTotal = cart.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);
  const cartItemCount = cart.reduce((sum, item) => sum + item.quantity, 0);

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

  // Handle Spice Filter
  const handleSpiceFilter = (spice: number | null) => {
    setSpiceFilter(spice);
    track("spice_filter_used", { spice: spice === null ? "all" : spice });
  };

  // Open Product Detail Modal
  const openProductDetail = (flavour: FlavourItem) => {
    setSelectedFlavour(flavour);
    track("product_viewed", { flavour: flavour.id });
  };

  // Handle Pick 3 Modal
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

  // Filtered flavours
  const displayedFlavours = spiceFilter
    ? storeConfig.flavours.filter((f) => f.spice === spiceFilter)
    : storeConfig.flavours;

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

  // Start Checkout
  const handleStartCheckout = () => {
    setIsCartOpen(false);
    setIsCheckoutOpen(true);
    setCheckoutStep(1);
    track("checkout_started", { cart, total: cartTotal, variant });
  };

  // Step 1 Delivery Form Submission
  const handleDetailsSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!pincodeValid || deliveryDetails.phone.length !== 10) return;

    const pinPrefix = deliveryDetails.pincode.slice(0, 3);
    track("details_submitted", { pinPrefix, zone: postalZone });
    setOptInEmail(deliveryDetails.email);
    setCheckoutStep(2);
  };

  // Step 2 Payment Selection
  const handleSelectPaymentMethod = (m: "upi" | "card" | "cod") => {
    setPaymentMethod(m);
    track("payment_method_selected", { method: m });
  };

  // Step 2 Click Pay
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

    // Move to honest reveal
    setCheckoutStep(3);
  };

  // Step 3 Reveal Survey Submit
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

    // PRIVACY RULE: Never store name, phone or address. Clear all personal fields from state!
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

  // Request a flavour submit
  const handleChutneyRequestSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!requestName.trim()) return;

    recordChutneyRequest(requestName, requestRegion);
    setRequestSent(true);
    showToast("Thank you! Your chutney suggestion has been noted.");
    setTimeout(() => {
      setRequestName("");
      setRequestRegion("");
      setRequestSent(false);
    }, 3000);
  };

  return (
    <div className="flex flex-col min-h-screen bg-[#f4f3ec] text-[#18241b]">
      {/* 1. Announcement Bar (Dark) */}
      <div className="bg-[#18241b] text-[#f4f3ec] text-xs sm:text-sm font-medium py-2 px-4 text-center tracking-wide flex items-center justify-center space-x-2">
        <span>{storeConfig.copy.announcement}</span>
      </div>

      {/* 2. Sticky Header (Deep Leaf Green #134a28) */}
      <header className="sticky top-0 z-40 bg-[#134a28] text-white px-4 sm:px-8 py-3.5 border-b border-[#18241b] shadow-md flex items-center justify-between">
        <div className="flex items-center space-x-3">
          {/* Yellow Tube Logo */}
          <Link href="/" className="flex items-center space-x-2.5 group">
            <div className="w-8 h-8 rounded-lg bg-[#f2b81d] flex items-center justify-center p-1 shadow-sm">
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
          <a href="#chutneys" className="hover:text-[#f2b81d] transition">Chutneys</a>
          <a href="#packs" className="hover:text-[#f2b81d] transition">Packs</a>
          <a href="#faq" className="hover:text-[#f2b81d] transition">FAQ</a>
        </nav>

        {/* Yellow Cart Pill with Item Count */}
        <button
          type="button"
          onClick={() => setIsCartOpen(true)}
          className="bg-[#f2b81d] hover:bg-[#e2a80d] text-[#18241b] font-heading font-black text-xs sm:text-sm px-4 py-2 rounded-full shadow-md flex items-center space-x-2 transition transform active:scale-95"
          aria-label="Open Cart"
        >
          <span>Cart</span>
          <span className="w-5 h-5 rounded-full bg-[#18241b] text-white flex items-center justify-center text-xs font-bold">
            {cartItemCount}
          </span>
        </button>
      </header>

      {/* 3. HERO (Leaf Green #1d6b3a, Left-aligned text, Three fanned tubes on right) */}
      <section className="bg-[#1d6b3a] text-white pt-10 pb-16 px-4 sm:px-8 border-b border-[#134a28] overflow-hidden">
        <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          {/* Left Text */}
          <div className="lg:col-span-7 space-y-5 text-left">
            <p className="text-xs uppercase tracking-widest font-heading font-black text-[#f2b81d]">
              {storeConfig.copy.hero.smallCaps}
            </p>

            <h1 className="font-heading font-extrabold text-4xl sm:text-5xl lg:text-6xl text-white leading-[1.12] tracking-tight">
              {storeConfig.copy.hero.headlinePart1}
              <span className="text-[#f2b81d]">{storeConfig.copy.hero.headlineHighlight}</span>
            </h1>

            <p className="text-base sm:text-xl text-[#f4f3ec] leading-relaxed max-w-xl font-normal">
              {storeConfig.copy.hero.sub}
            </p>

            <div className="pt-3 flex flex-wrap items-center gap-3">
              <a
                href="#chutneys"
                className="bg-[#f2b81d] hover:bg-[#e2a80d] text-[#18241b] font-heading font-black text-sm sm:text-base px-7 py-3.5 rounded-xl shadow-lg transition transform active:scale-95"
              >
                {storeConfig.copy.hero.exploreCta}
              </a>
              <a
                href="#packs"
                className="border-2 border-white/80 hover:border-white text-white font-heading font-black text-sm sm:text-base px-6 py-3 rounded-xl transition hover:bg-white/10"
              >
                {storeConfig.copy.hero.packsCta}
              </a>
            </div>
          </div>

          {/* Right Visual: Fanned Tubes (Hari, Schezwan, Imli) */}
          <div className="lg:col-span-5 flex justify-center lg:justify-end">
            <div className="w-full max-w-md sm:max-w-lg">
              <img
                src="/images/hero-fanned-tubes.svg"
                alt="Chutney Tubes fanned trio"
                className="w-full h-auto object-contain drop-shadow-2xl"
              />
            </div>
          </div>
        </div>
      </section>

      {/* 4. TRUST STRIP (White, 4 icons in a row, 2x2 on mobile) */}
      <section className="bg-white border-b border-[#d8dcd4] py-6 px-4 sm:px-8">
        <div className="max-w-6xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
          {storeConfig.copy.trustStrip.map((item, idx) => (
            <div key={idx} className="flex flex-col items-center justify-center p-2 space-y-1">
              <div className="w-8 h-8 rounded-full bg-[#f4f3ec] text-[#1d6b3a] flex items-center justify-center font-black text-base">
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

      {/* 5. CATALOGUE */}
      <section id="chutneys" className="py-14 px-4 sm:px-8 max-w-6xl mx-auto w-full">
        <div className="text-center max-w-2xl mx-auto mb-8 space-y-2">
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
                  ? "bg-[#18241b] text-white"
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
                  ? "bg-[#1d6b3a] text-white"
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
                  ? "bg-[#f2b81d] text-[#18241b]"
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
                  ? "bg-[#c8361f] text-white"
                  : "bg-white text-[#18241b] border border-[#d8dcd4] hover:border-[#c8361f]"
              }`}
            >
              Hot 🔥
            </button>
          </div>
        </div>

        {/* Product Grid (4 col desktop, 2 col tablet, 1-2 phone) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {displayedFlavours.map((flavour) => (
            <div
              key={flavour.id}
              className="bg-white rounded-3xl p-5 border border-[#d8dcd4] shadow-sm hover:shadow-md transition flex flex-col justify-between group"
            >
              <div>
                {/* Product Tile Container with Tinted Flavour Color */}
                <div
                  onClick={() => openProductDetail(flavour)}
                  className="w-full h-56 rounded-2xl p-2 cursor-pointer relative overflow-hidden flex items-center justify-center transition"
                  style={{ backgroundColor: `${flavour.color}15` }}
                >
                  <ProductRender flavour={flavour} showKatori={true} angle={-14} />
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
                  className="font-heading font-black text-base sm:text-lg text-[#18241b] cursor-pointer hover:text-[#1d6b3a] transition"
                >
                  {flavour.name}
                </h3>

                {/* 100g tube + spice dots */}
                <div className="flex items-center space-x-2 my-1 text-xs text-[#57534e]">
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

                <p className="text-xs text-[#57534e] line-clamp-2 my-2 leading-relaxed">
                  {flavour.desc}
                </p>
              </div>

              {/* Price & Add Button */}
              <div className="pt-3 border-t border-[#f4f3ec] flex items-center justify-between mt-2">
                <div>
                  <span className="font-heading font-extrabold text-lg text-[#18241b]">
                    {formatInr(pricing.single)}
                  </span>
                  <span className="block text-[10px] text-[#57534e]">MRP incl. of all taxes</span>
                </div>

                <button
                  type="button"
                  onClick={() => addToCart("single", [flavour.id], flavour.name, pricing.single)}
                  className="bg-[#1d6b3a] hover:bg-[#134a28] text-white font-heading font-bold text-xs px-4 py-2.5 rounded-xl shadow-sm transition transform active:scale-95 flex items-center space-x-1"
                >
                  <span>Add</span>
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* "Want a chutney we don't have?" Box */}
        <div className="mt-12 bg-white rounded-3xl p-6 sm:p-8 border border-[#d8dcd4] shadow-sm max-w-2xl mx-auto text-center space-y-4">
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

      {/* 6. "Pick. Squeeze. Enjoy." — Three Steps */}
      <section className="py-14 bg-white border-y border-[#d8dcd4] px-4 sm:px-8">
        <div className="max-w-5xl mx-auto">
          <div className="text-center max-w-xl mx-auto mb-10">
            <h2 className="font-heading font-black text-2xl sm:text-3xl text-[#18241b]">
              {storeConfig.copy.steps.heading}
            </h2>
            <p className="text-xs sm:text-sm text-[#57534e] mt-1">
              {storeConfig.copy.steps.sub}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {storeConfig.copy.steps.items.map((step) => (
              <div
                key={step.num}
                className="bg-[#f4f3ec] rounded-2xl p-6 border border-[#d8dcd4] text-center flex flex-col items-center space-y-3"
              >
                <div className="w-12 h-12 rounded-full bg-[#134a28] text-[#f2b81d] flex items-center justify-center font-heading font-black text-lg">
                  {step.num}
                </div>
                <h3 className="font-heading font-bold text-lg text-[#18241b]">{step.title}</h3>
                <p className="text-xs sm:text-sm text-[#57534e] leading-relaxed">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 7. "Why a tube?" (Dark Section #18241b) */}
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

          <div className="overflow-hidden bg-[#134a28] rounded-2xl border border-white/10 shadow-lg">
            <table className="w-full text-left text-xs sm:text-sm border-collapse">
              <thead>
                <tr className="border-b border-white/10 text-white/70 uppercase text-[10px] font-heading font-bold">
                  <th className="py-3 px-4">Feature</th>
                  <th className="py-3 px-4 text-[#f2b81d]">Tube ✨</th>
                  <th className="py-3 px-4">Jar</th>
                  <th className="py-3 px-4">Sachet</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10">
                {storeConfig.copy.comparison.rows.map((row, idx) => (
                  <tr key={idx} className="hover:bg-white/5 transition">
                    <td className="py-3 px-4 font-semibold text-white">{row.factor}</td>
                    <td className="py-3 px-4 font-bold text-[#f2b81d]">✓ {row.tube}</td>
                    <td className="py-3 px-4 text-white/70">{row.jar}</td>
                    <td className="py-3 px-4 text-white/70">{row.sachet}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* 8. "Where people use it" (4 tiles) */}
      <section className="py-14 px-4 sm:px-8 max-w-6xl mx-auto w-full">
        <div className="text-center max-w-xl mx-auto mb-10">
          <h2 className="font-heading font-black text-2xl sm:text-3xl text-[#18241b]">
            Where people use it
          </h2>
          <p className="text-xs sm:text-sm text-[#57534e] mt-1">
            Made for real Indian daily food routines.
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

      {/* 9. PACKS (Single, Chaat Combo, Pick Any 3) */}
      <section id="packs" className="py-14 bg-white border-t border-[#d8dcd4] px-4 sm:px-8">
        <div className="max-w-5xl mx-auto">
          <div className="text-center max-w-xl mx-auto mb-10">
            <span className="text-xs font-heading font-extrabold text-[#1d6b3a] uppercase tracking-wider">
              Bundles &amp; Value
            </span>
            <h2 className="font-heading font-black text-2xl sm:text-3xl text-[#18241b] mt-1">
              Choose Your Pack
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Card 1: Single Tube */}
            <div className="bg-[#f4f3ec] rounded-3xl p-6 border border-[#d8dcd4] flex flex-col justify-between space-y-4">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#57534e]">Everyday</span>
                <h3 className="font-heading font-black text-xl text-[#18241b] mt-1">Single Tube</h3>
                <p className="text-xs text-[#57534e] mt-1">Choose any one favourite flavour.</p>
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
                Choose a chutney
              </a>
            </div>

            {/* Card 2: Chaat Combo */}
            <div className="bg-[#f4f3ec] rounded-3xl p-6 border border-[#d8dcd4] flex flex-col justify-between space-y-4">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#c8361f]">Classic Pair</span>
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
                Add the combo
              </button>
            </div>

            {/* Card 3: Pick Any 3 (Featured) */}
            <div className="bg-[#134a28] text-white rounded-3xl p-6 border-2 border-[#f2b81d] shadow-xl flex flex-col justify-between space-y-4 relative overflow-hidden">
              <div className="absolute top-4 right-4 bg-[#f2b81d] text-[#18241b] text-[10px] uppercase font-heading font-black px-2.5 py-0.5 rounded-full">
                Best value
              </div>

              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#f2b81d]">Custom Box</span>
                <h3 className="font-heading font-black text-xl text-white mt-1">Pick Any 3</h3>
                <p className="text-xs text-[#f4f3ec] mt-1">Pick your 3 favourite flavours in a custom box.</p>
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
                className="w-full bg-[#f2b81d] hover:bg-[#e2a80d] text-[#18241b] font-heading font-black text-xs py-3 rounded-xl shadow-md transition transform active:scale-95"
              >
                Pick your 3
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* 10. FAQ (Accordion) */}
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

      {/* 11. FOOTER (Deep Leaf Green #134a28) */}
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
                className="inline-flex items-center space-x-2 bg-[#25D366] text-white text-xs font-bold px-4 py-2 rounded-xl mt-2"
              >
                <span>WhatsApp us</span>
              </a>
            )}
          </div>

          <div className="md:col-span-3 space-y-2">
            <h4 className="font-heading font-bold text-xs uppercase tracking-wider text-[#f2b81d]">Shop</h4>
            <ul className="space-y-1.5 text-xs text-[#f4f3ec]">
              <li><a href="#chutneys" className="hover:underline">All 12 Chutneys</a></li>
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

      {/* 12. FLOATING WHATSAPP BUTTON (Hidden if number is empty) */}
      {storeConfig.brand.whatsAppNumber && (
        <a
          href={`https://wa.me/${storeConfig.brand.whatsAppNumber}`}
          target="_blank"
          rel="noopener noreferrer"
          className="fixed bottom-5 right-5 z-40 bg-[#25D366] text-white rounded-full p-3.5 shadow-2xl hover:scale-105 transition flex items-center space-x-2"
          aria-label="WhatsApp Us"
        >
          <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
            <path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.582 2.128 2.182-.573c.978.58 1.911.928 3.145.929 3.178 0 5.767-2.587 5.768-5.766.001-3.187-2.575-5.77-5.764-5.771zm3.392 8.244c-.144.405-.837.774-1.17.824-.299.045-.677.063-1.092-.069-.252-.08-.575-.187-.988-.365-1.739-.751-2.874-2.502-2.961-2.617-.087-.116-.708-.94-.708-1.793s.448-1.273.607-1.446c.159-.173.346-.217.462-.217l.332.006c.106.005.249-.04.39.298.144.347.491 1.2.534 1.287.043.087.072.188.014.304-.058.116-.087.188-.173.289l-.26.304c-.087.086-.177.18-.076.354.101.174.449.741.964 1.201.662.591 1.221.774 1.394.86.174.086.275.072.376-.044.101-.116.433-.506.549-.68.116-.173.231-.145.39-.086s1.011.477 1.184.564.289.13.332.202c.045.072.045.419-.099.824z" />
          </svg>
          <span className="text-xs font-bold font-heading pr-1">WhatsApp us</span>
        </a>
      )}

      {/* TOAST NOTIFICATION */}
      {toastMessage && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-[#18241b] text-white text-xs font-bold px-4 py-2.5 rounded-full shadow-2xl flex items-center space-x-2 animate-bounce">
          <span>✓</span>
          <span>{toastMessage}</span>
        </div>
      )}

      {/* CART DRAWER (Slides from Right) */}
      {isCartOpen && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div
            onClick={() => setIsCartOpen(false)}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity"
          />
          <div className="relative w-full max-w-md bg-white h-full shadow-2xl flex flex-col justify-between p-6 z-10 animate-slideLeft">
            <div>
              <div className="flex items-center justify-between border-b border-[#d8dcd4] pb-4">
                <h3 className="font-heading font-black text-xl text-[#18241b]">Your Cart</h3>
                <button
                  onClick={() => setIsCartOpen(false)}
                  className="w-8 h-8 rounded-full bg-[#f4f3ec] text-[#18241b] font-black text-sm"
                >
                  ✕
                </button>
              </div>

              {cart.length === 0 ? (
                <div className="py-16 text-center space-y-3">
                  <div className="w-16 h-16 rounded-full bg-[#f4f3ec] text-3xl flex items-center justify-center mx-auto">
                    🛒
                  </div>
                  <p className="font-heading font-bold text-sm text-[#18241b]">Your cart is empty.</p>
                  <p className="text-xs text-[#57534e]">Add your favourite chutney tubes to begin.</p>
                </div>
              ) : (
                <div className="divide-y divide-[#f4f3ec] max-h-[60vh] overflow-y-auto py-2">
                  {cart.map((item) => (
                    <div key={item.id} className="py-3 flex items-center justify-between">
                      <div className="space-y-0.5 max-w-[220px]">
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
                  <span>Total (MRP incl. of taxes):</span>
                  <span className="font-heading font-black text-xl text-[#18241b]">
                    {formatInr(cartTotal)}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={handleStartCheckout}
                  className="w-full bg-[#1d6b3a] hover:bg-[#134a28] text-white font-heading font-black text-sm py-3.5 rounded-xl shadow-lg transition"
                >
                  Checkout
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* PRODUCT DETAIL DIALOG */}
      {selectedFlavour && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            onClick={() => setSelectedFlavour(null)}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm"
          />
          <div className="relative bg-white rounded-3xl p-6 sm:p-8 max-w-lg w-full z-10 shadow-2xl space-y-4">
            <button
              onClick={() => setSelectedFlavour(null)}
              className="absolute top-4 right-4 w-8 h-8 rounded-full bg-[#f4f3ec] text-[#18241b] font-black text-sm"
            >
              ✕
            </button>

            <div className="w-full h-52 flex items-center justify-center bg-[#f4f3ec] rounded-2xl p-2">
              <ProductRender flavour={selectedFlavour} showKatori={true} angle={-10} />
            </div>

            <div className="space-y-1">
              <div className="flex justify-between items-center">
                <span className="text-xs font-bold text-[#c8361f] uppercase">{selectedFlavour.local}</span>
                <span className="font-heading font-black text-lg text-[#18241b]">
                  {formatInr(pricing.single)}
                </span>
              </div>
              <h3 className="font-heading font-black text-2xl text-[#18241b]">
                {selectedFlavour.name} ({selectedFlavour.hindi})
              </h3>
              <p className="text-xs text-[#57534e] leading-relaxed">{selectedFlavour.desc}</p>
            </div>

            {/* Details List */}
            <div className="bg-[#f4f3ec] p-4 rounded-xl text-xs space-y-1.5 border border-[#d8dcd4]">
              <div className="flex justify-between">
                <span className="text-[#57534e]">Spice Level:</span>
                <span className="font-bold">
                  {selectedFlavour.spice === 1 ? "Mild (1/3)" : selectedFlavour.spice === 2 ? "Medium (2/3)" : "Hot 🔥 (3/3)"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#57534e]">Goes With:</span>
                <span className="font-bold">{selectedFlavour.goesWith}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#57534e]">Pack:</span>
                <span className="font-bold">100 g squeeze tube with flip-top cap</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#57534e]">Diet:</span>
                <span className="font-bold text-[#1d6b3a]">Vegetarian (Green mark)</span>
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
              Add to cart · {formatInr(pricing.single)}
            </button>
          </div>
        </div>
      )}

      {/* PICK ANY 3 MODAL */}
      {isPick3Open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            onClick={() => setIsPick3Open(false)}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm"
          />
          <div className="relative bg-white rounded-3xl p-6 sm:p-8 max-w-lg w-full z-10 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b border-[#d8dcd4] pb-3">
              <div>
                <h3 className="font-heading font-black text-xl text-[#18241b]">Pick Any 3 Flavours</h3>
                <p className="text-xs text-[#57534e]">Selected {pick3Selected.length} of 3</p>
              </div>
              <button
                onClick={() => setIsPick3Open(false)}
                className="w-8 h-8 rounded-full bg-[#f4f3ec] text-[#18241b] font-black text-sm"
              >
                ✕
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 max-h-64 overflow-y-auto pr-1">
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
              Confirm 3-Pack · {formatInr(pricing.pick3)}
            </button>
          </div>
        </div>
      )}

      {/* CHECKOUT & REVEAL MODAL */}
      {isCheckoutOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm" />
          <div className="relative bg-white rounded-3xl p-6 sm:p-8 max-w-xl w-full z-10 shadow-2xl max-h-[92vh] overflow-y-auto">
            {/* Header */}
            <div className="flex justify-between items-center border-b border-[#d8dcd4] pb-3 mb-4">
              <span className="font-heading font-black text-lg text-[#134a28]">
                {checkoutStep === 3 ? "Order Completed" : "Checkout"}
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

            {/* STEP 1: DELIVERY DETAILS */}
            {checkoutStep === 1 && (
              <form onSubmit={handleDetailsSubmit} className="space-y-4">
                <h3 className="font-heading font-bold text-base text-[#18241b]">
                  1. Delivery Details
                </h3>

                <div>
                  <label className="block text-xs font-bold text-[#18241b] mb-1">Full Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="Priya Sharma"
                    value={deliveryDetails.name}
                    onChange={(e) => setDeliveryDetails({ ...deliveryDetails, name: e.target.value })}
                    className="w-full text-xs sm:text-sm px-3.5 py-2.5 rounded-xl border border-[#d8dcd4] bg-[#f4f3ec] focus:bg-white focus:border-[#1d6b3a]"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-[#18241b] mb-1">
                      10-digit Mobile (starts 6–9) *
                    </label>
                    <input
                      type="tel"
                      required
                      pattern="^[6-9]\d{9}$"
                      maxLength={10}
                      placeholder="9876543210"
                      value={deliveryDetails.phone}
                      onChange={(e) =>
                        setDeliveryDetails({
                          ...deliveryDetails,
                          phone: e.target.value.replace(/\D/g, "").slice(0, 10),
                        })
                      }
                      className="w-full text-xs sm:text-sm px-3.5 py-2.5 rounded-xl border border-[#d8dcd4] bg-[#f4f3ec] focus:bg-white focus:border-[#1d6b3a]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[#18241b] mb-1">Email Address *</label>
                    <input
                      type="email"
                      required
                      placeholder="priya@gmail.com"
                      value={deliveryDetails.email}
                      onChange={(e) => setDeliveryDetails({ ...deliveryDetails, email: e.target.value })}
                      className="w-full text-xs sm:text-sm px-3.5 py-2.5 rounded-xl border border-[#d8dcd4] bg-[#f4f3ec] focus:bg-white focus:border-[#1d6b3a]"
                    />
                  </div>
                </div>

                {/* 6-Digit Indian Pincode */}
                <div>
                  <label className="block text-xs font-bold text-[#18241b] mb-1">
                    6-digit Delivery Pincode *
                  </label>
                  <input
                    type="text"
                    required
                    maxLength={6}
                    placeholder="e.g. 560001, 110001, 400001"
                    value={deliveryDetails.pincode}
                    onChange={handlePincodeChange}
                    className="w-full text-xs sm:text-sm px-3.5 py-2.5 rounded-xl border border-[#d8dcd4] bg-[#f4f3ec] focus:bg-white focus:border-[#1d6b3a] font-mono"
                  />
                  {pincodeValid === true && (
                    <div className="mt-2 p-2 bg-[#1d6b3a]/10 border border-[#1d6b3a] rounded-xl text-xs font-bold text-[#1d6b3a]">
                      ✓ We deliver to this pincode. ({postalZone})
                    </div>
                  )}
                  {pincodeValid === false && (
                    <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded-xl text-xs font-bold text-[#c8361f]">
                      Please enter a valid 6-digit Indian pincode (first digit 1–8).
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#18241b] mb-1">
                    Complete Address (Flat, Desk, Street) *
                  </label>
                  <textarea
                    required
                    rows={2}
                    placeholder="Floor 4, Desk 12, WeWork Koramangala..."
                    value={deliveryDetails.address}
                    onChange={(e) => setDeliveryDetails({ ...deliveryDetails, address: e.target.value })}
                    className="w-full text-xs sm:text-sm px-3.5 py-2.5 rounded-xl border border-[#d8dcd4] bg-[#f4f3ec] focus:bg-white focus:border-[#1d6b3a]"
                  />
                </div>

                <div className="text-[11px] text-[#57534e]">
                  We use your details only to process your order.{" "}
                  <Link href="/privacy" target="_blank" className="underline font-bold">
                    Privacy policy
                  </Link>
                  .
                </div>

                <button
                  type="submit"
                  disabled={!pincodeValid || deliveryDetails.phone.length !== 10}
                  className="w-full bg-[#1d6b3a] hover:bg-[#134a28] text-white font-heading font-black text-sm py-3.5 rounded-xl shadow-lg transition disabled:opacity-40"
                >
                  Continue to Payment →
                </button>
              </form>
            )}

            {/* STEP 2: PAYMENT (MOCK ONLY - Plain buttons, No CVV/Card fields, No Gateway) */}
            {checkoutStep === 2 && (
              <form onSubmit={handlePayClick} className="space-y-5">
                <h3 className="font-heading font-bold text-base text-[#18241b]">
                  2. Payment Method (Simulated Test)
                </h3>

                <div className="bg-[#f4f3ec] p-3 rounded-xl text-xs text-[#18241b] space-y-1">
                  <div className="flex justify-between">
                    <span>Items ({cartItemCount}):</span>
                    <span className="font-bold">{formatInr(cartTotal)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Delivery:</span>
                    <span className="font-bold text-[#1d6b3a]">Free</span>
                  </div>
                  <div className="flex justify-between border-t border-[#d8dcd4] pt-1 text-sm font-extrabold font-heading">
                    <span>Total Amount:</span>
                    <span className="text-[#134a28]">{formatInr(cartTotal)}</span>
                  </div>
                </div>

                {/* Plain Payment Choices: UPI, Debit/credit card, Cash on delivery */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  <button
                    type="button"
                    onClick={() => handleSelectPaymentMethod("upi")}
                    className={`p-3.5 rounded-xl border-2 text-center transition flex flex-col items-center justify-center space-y-1 ${
                      paymentMethod === "upi"
                        ? "border-[#1d6b3a] bg-[#1d6b3a]/10 font-bold"
                        : "border-[#d8dcd4] bg-[#f4f3ec] hover:border-[#18241b]"
                    }`}
                  >
                    <span className="text-xs font-bold font-heading">UPI</span>
                    <span className="text-[10px] text-[#57534e]">Any UPI app</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleSelectPaymentMethod("card")}
                    className={`p-3.5 rounded-xl border-2 text-center transition flex flex-col items-center justify-center space-y-1 ${
                      paymentMethod === "card"
                        ? "border-[#1d6b3a] bg-[#1d6b3a]/10 font-bold"
                        : "border-[#d8dcd4] bg-[#f4f3ec] hover:border-[#18241b]"
                    }`}
                  >
                    <span className="text-xs font-bold font-heading">Debit or card</span>
                    <span className="text-[10px] text-[#57534e]">Visa, Mastercard, RuPay</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleSelectPaymentMethod("cod")}
                    className={`p-3.5 rounded-xl border-2 text-center transition flex flex-col items-center justify-center space-y-1 ${
                      paymentMethod === "cod"
                        ? "border-[#1d6b3a] bg-[#1d6b3a]/10 font-bold"
                        : "border-[#d8dcd4] bg-[#f4f3ec] hover:border-[#18241b]"
                    }`}
                  >
                    <span className="text-xs font-bold font-heading">Cash on delivery</span>
                    <span className="text-[10px] text-[#57534e]">Pay when it arrives</span>
                  </button>
                </div>

                <button
                  type="submit"
                  disabled={!paymentMethod}
                  className="w-full bg-[#18241b] hover:bg-[#134a28] text-white font-heading font-black text-sm py-4 rounded-xl shadow-lg transition disabled:opacity-40"
                >
                  {paymentMethod === "cod"
                    ? `Place order · ${formatInr(cartTotal)}`
                    : `Pay ${formatInr(cartTotal)}`}
                </button>
              </form>
            )}

            {/* STEP 3: HONEST REVEAL SCREEN */}
            {checkoutStep === 3 && (
              <div className="space-y-5">
                <div className="bg-[#f2b81d] text-[#18241b] text-xs font-heading font-black px-3 py-1 rounded-full inline-block">
                  You haven&apos;t been charged
                </div>

                <div className="space-y-1">
                  <h3 className="font-heading font-black text-2xl sm:text-3xl text-[#18241b]">
                    Thank you. You&apos;re one of the first.
                  </h3>
                  <p className="text-xs sm:text-sm text-[#57534e] leading-relaxed">
                    Chutney Tubes isn&apos;t on sale yet. This was a test checkout to learn whether people want chutney in a tube before we start making it. No money was taken, and we didn&apos;t save your phone number or address.
                  </p>
                </div>

                {!revealDone ? (
                  <form onSubmit={handleRevealSurveySubmit} className="space-y-4 pt-2 border-t border-[#d8dcd4]">
                    {/* Q1 (Radio): How do you feel about chutney in a tube? */}
                    <div>
                      <label className="block text-xs font-bold font-heading text-[#18241b] mb-2">
                        How do you feel about chutney in a tube?
                      </label>
                      <div className="space-y-1.5 text-xs">
                        {[
                          "Love it, easier than a jar",
                          "Fine with it",
                          "Not sure yet",
                          "I'd rather have a jar or sachet",
                        ].map((opt) => (
                          <label key={opt} className="flex items-center space-x-2.5 p-2 rounded-lg bg-[#f4f3ec] cursor-pointer hover:bg-[#d8dcd4]">
                            <input
                              type="radio"
                              name="feeling"
                              value={opt}
                              checked={tubeFeeling === opt}
                              onChange={(e) => setTubeFeeling(e.target.value)}
                              className="text-[#1d6b3a]"
                            />
                            <span>{opt}</span>
                          </label>
                        ))}
                      </div>
                    </div>

                    {/* Q2: What almost stopped you from buying? */}
                    <div>
                      <label className="block text-xs font-bold font-heading text-[#18241b] mb-1">
                        What almost stopped you from buying? (optional)
                      </label>
                      <textarea
                        rows={2}
                        placeholder="e.g. Price, wanted to see ingredients first, packaging doubts..."
                        value={stoppedText}
                        onChange={(e) => setStoppedText(e.target.value)}
                        className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-[#d8dcd4] bg-[#f4f3ec] focus:bg-white"
                      />
                    </div>

                    {/* Q3: How often would you use it? */}
                    <div>
                      <label className="block text-xs font-bold font-heading text-[#18241b] mb-2">
                        How often would you use it?
                      </label>
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        {["Daily", "A few times a week", "Weekly", "Rarely"].map((freq) => (
                          <label key={freq} className="flex items-center space-x-2 p-2 rounded-lg bg-[#f4f3ec] cursor-pointer hover:bg-[#d8dcd4]">
                            <input
                              type="radio"
                              name="freq"
                              value={freq}
                              checked={frequency === freq}
                              onChange={(e) => setFrequency(e.target.value)}
                              className="text-[#1d6b3a]"
                            />
                            <span>{freq}</span>
                          </label>
                        ))}
                      </div>
                    </div>

                    {/* Checkbox: Email me once when Chutney Tubes launches (UNCHECKED BY DEFAULT) */}
                    <div className="bg-[#f4f3ec] p-3.5 rounded-xl border border-[#d8dcd4]">
                      <label className="flex items-start space-x-2.5 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={optInDiscount}
                          onChange={(e) => setOptInDiscount(e.target.checked)}
                          className="mt-0.5 w-4 h-4 rounded text-[#1d6b3a]"
                        />
                        <span className="text-xs font-bold text-[#18241b]">
                          Email me once when Chutney Tubes launches, with a launch-day discount.
                        </span>
                      </label>

                      {optInDiscount && (
                        <div className="mt-2.5 pt-2 border-t border-[#d8dcd4]">
                          <label className="block text-[11px] text-[#57534e] mb-1">Email address:</label>
                          <input
                            type="email"
                            required={optInDiscount}
                            value={optInEmail}
                            onChange={(e) => setOptInEmail(e.target.value)}
                            className="w-full text-xs px-3 py-1.5 rounded-lg border border-[#d8dcd4] bg-white"
                          />
                        </div>
                      )}
                    </div>

                    <button
                      type="submit"
                      className="w-full bg-[#18241b] hover:bg-[#134a28] text-white font-heading font-black text-xs sm:text-sm py-3.5 rounded-xl shadow-lg transition"
                    >
                      Send and close
                    </button>
                  </form>
                ) : (
                  <div className="text-center py-6 space-y-3">
                    <p className="font-heading font-bold text-sm text-[#1d6b3a]">
                      ✓ Thank you! Your response will help us decide whether to launch.
                    </p>
                    <button
                      onClick={() => setIsCheckoutOpen(false)}
                      className="bg-[#18241b] text-white font-heading font-bold text-xs px-6 py-2.5 rounded-xl"
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
