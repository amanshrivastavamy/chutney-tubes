"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import productConfig from "../config/product.config";
import {
  trackEvent,
  resolvePriceVariant,
  resolveTrafficSource,
  setupScrollTracking,
} from "../lib/tracking";

export default function LandingPage() {
  const router = useRouter();

  // Pricing & variant state
  const [variantId, setVariantId] = useState<"A" | "B" | "C">("A");
  const [trafficSource, setTrafficSource] = useState<string>("direct");

  // Cart selection state
  const [selectedPack, setSelectedPack] = useState<string>("single");
  const [selectedFlavour, setSelectedFlavour] = useState<string>("mint-coriander");
  const [quantity, setQuantity] = useState<number>(1);
  const [faqOpenIndex, setFaqOpenIndex] = useState<number | null>(null);

  // Initialize tracking and sticky pricing
  useEffect(() => {
    const v = resolvePriceVariant();
    const src = resolveTrafficSource();
    setVariantId(v);
    setTrafficSource(src);

    // Track page_view
    trackEvent("page_view", {
      path: "/",
      referrer: document.referrer || "direct",
    });

    // Track 50% scroll
    const cleanupScroll = setupScrollTracking();
    return () => cleanupScroll();
  }, []);

  const currentPricing = productConfig.pricing.variants[variantId] || productConfig.pricing.variants.A;
  const isThreePack = selectedPack === "three_pack";
  const unitPrice = isThreePack ? currentPricing.threePackPrice : currentPricing.singlePrice;
  const totalPrice = unitPrice * quantity;

  // Handle flavour click
  const handleSelectFlavour = (flavourId: string) => {
    setSelectedFlavour(flavourId);
    trackEvent("flavour_selected", { flavour: flavourId });
  };

  // Handle pack change
  const handleSelectPack = (packId: string) => {
    setSelectedPack(packId);
    trackEvent("flavour_selected", { pack: packId });
  };

  // Proceed to Checkout
  const handleAddToCartAndCheckout = () => {
    trackEvent("add_to_cart", {
      flavour: isThreePack ? "all_three" : selectedFlavour,
      pack: selectedPack,
      quantity,
      unitPrice,
      totalAmount: totalPrice,
      variant: variantId,
    });

    // Save cart state to sessionStorage for checkout page
    if (typeof window !== "undefined") {
      sessionStorage.setItem(
        "ct_cart",
        JSON.stringify({
          pack: selectedPack,
          flavour: selectedFlavour,
          quantity,
          unitPrice,
          totalPrice,
          variantId,
        })
      );
    }

    router.push("/checkout");
  };

  return (
    <div className="flex flex-col min-h-screen">
      {/* Top Banner: Authentic Pre-launch Transparency */}
      <div className="bg-[#1C1917] text-[#FEF3C7] text-xs sm:text-sm font-medium py-2.5 px-4 text-center tracking-wide">
        <span>🚀 <strong>Early Access Demand Test</strong> • Pre-order to shape our first production batch</span>
        {variantId && (
          <span className="ml-2 inline-block bg-[#78350F] text-[#FDE68A] text-[10px] uppercase font-bold px-2 py-0.5 rounded">
            Variant {variantId}
          </span>
        )}
      </div>

      {/* Navigation Header */}
      <header className="sticky top-0 z-40 bg-[#FAF7F2]/95 backdrop-blur-md border-b border-[#E7E5E4] px-4 sm:px-8 py-3.5 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 rounded-lg bg-[#C2410C] flex items-center justify-center text-white font-black text-lg shadow-sm">
            C
          </div>
          <span className="font-extrabold text-lg sm:text-xl text-[#1C1917] tracking-tight">
            {productConfig.brand.name}
          </span>
        </div>

        <nav className="hidden md:flex items-center space-x-6 text-sm font-medium text-[#57534E]">
          <a href="#how-it-works" className="hover:text-[#C2410C] transition">How It Works</a>
          <a href="#flavours" className="hover:text-[#C2410C] transition">Flavours</a>
          <a href="#why-tube" className="hover:text-[#C2410C] transition">Why a Tube?</a>
          <a href="#faq" className="hover:text-[#C2410C] transition">FAQ</a>
        </nav>

        <a
          href="#order"
          className="bg-[#C2410C] hover:bg-[#9A3412] text-white font-bold text-xs sm:text-sm px-4 py-2 rounded-full shadow-sm hover:shadow transition flex items-center space-x-1"
        >
          <span>Pre-Order • ₹{currentPricing.singlePrice}</span>
        </a>
      </header>

      {/* HERO SECTION */}
      <section className="relative pt-8 pb-14 px-4 sm:px-8 max-w-6xl mx-auto w-full">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          {/* Hero Left Content */}
          <div className="lg:col-span-7 space-y-5 text-center lg:text-left">
            <div className="inline-flex items-center space-x-2 bg-[#DCFCE7] text-[#15803D] text-xs font-bold px-3 py-1.5 rounded-full border border-[#86EFAC]/60">
              <span>🌿 Real Indian Kitchen Flavour</span>
              <span className="w-1.5 h-1.5 rounded-full bg-[#15803D]"></span>
              <span>100% Mess-Free</span>
            </div>

            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black text-[#1C1917] leading-[1.15] tracking-tight">
              Desk-lunch chutney with <span className="text-[#C2410C] underline decoration-[#F59E0B] decoration-wavy decoration-2">no mess</span>.
            </h1>

            <p className="text-base sm:text-lg text-[#57534E] leading-relaxed max-w-xl mx-auto lg:mx-0">
              Home-style Indian chutney in an easy, squeezable tube. No spoon needed, no leaking dabba in your bag, fits straight into your tiffin or office drawer.
            </p>

            {/* Quick Benefits Pills */}
            <div className="flex flex-wrap items-center justify-center lg:justify-start gap-2 pt-1">
              <span className="bg-[#FEF3C7] text-[#78350F] text-xs font-semibold px-3 py-1 rounded-md">
                ✓ No Spoons to Wash
              </span>
              <span className="bg-[#FEF3C7] text-[#78350F] text-xs font-semibold px-3 py-1 rounded-md">
                ✓ Leak-Proof Flip Cap
              </span>
              <span className="bg-[#FEF3C7] text-[#78350F] text-xs font-semibold px-3 py-1 rounded-md">
                ✓ Fits Any Tiffin Bag
              </span>
            </div>

            {/* CTA Button Block */}
            <div className="pt-4 flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-3">
              <a
                href="#order"
                className="w-full sm:w-auto text-center bg-[#C2410C] hover:bg-[#9A3412] text-white font-extrabold text-base sm:text-lg px-8 py-3.5 rounded-xl shadow-lg hover:shadow-xl transition transform active:scale-98"
              >
                Buy Now • ₹{currentPricing.singlePrice}
              </a>
              <span className="text-xs text-[#78350F] font-medium bg-[#FEF3C7] px-3 py-1.5 rounded-lg border border-[#FDE68A]">
                ⚡ Zero risk: Demand test only (no charge)
              </span>
            </div>
          </div>

          {/* Hero Right Visual */}
          <div className="lg:col-span-5 flex justify-center">
            <div className="relative w-full max-w-md bg-white rounded-3xl p-4 shadow-xl border border-[#E7E5E4] overflow-hidden">
              <img
                src="/images/hero-tubes.svg"
                alt="Chutney Tubes packaging with tiffin box"
                className="w-full h-auto object-contain rounded-2xl"
              />
              <div className="mt-3 text-center">
                <span className="text-xs font-bold text-[#57534E] uppercase tracking-wider">
                  Authentic Chutney • Ergonomic Squeeze Tube (150g)
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* HOW IT WORKS SECTION */}
      <section id="how-it-works" className="py-14 bg-white border-y border-[#E7E5E4] px-4 sm:px-8">
        <div className="max-w-5xl mx-auto">
          <div className="text-center max-w-xl mx-auto mb-10">
            <h2 className="text-xs font-extrabold text-[#C2410C] uppercase tracking-widest mb-1">
              Simple &amp; Clean
            </h2>
            <h3 className="text-2xl sm:text-3xl font-black text-[#1C1917]">
              How It Works
            </h3>
            <p className="text-sm text-[#57534E] mt-2">
              Three effortless steps from desk drawer to your plate.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Step 1 */}
            <div className="bg-[#FAF7F2] rounded-2xl p-6 border border-[#E7E5E4] text-center flex flex-col items-center hover:shadow-md transition">
              <div className="w-24 h-24 mb-4">
                <img src="/images/step-1.svg" alt="Step 1: Open Tiffin" className="w-full h-full object-contain" />
              </div>
              <h4 className="font-extrabold text-lg text-[#1C1917] mb-2">1. Open Your Tiffin</h4>
              <p className="text-sm text-[#57534E]">
                Pull out your hot rotis, parathas, sandwich, or lunch container at your desk.
              </p>
            </div>

            {/* Step 2 */}
            <div className="bg-[#FAF7F2] rounded-2xl p-6 border border-[#E7E5E4] text-center flex flex-col items-center hover:shadow-md transition">
              <div className="w-24 h-24 mb-4">
                <img src="/images/step-2.svg" alt="Step 2: Squeeze" className="w-full h-full object-contain" />
              </div>
              <h4 className="font-extrabold text-lg text-[#1C1917] mb-2">2. Squeeze</h4>
              <p className="text-sm text-[#57534E]">
                Flip the precision cap and squeeze the exact dollop or swirl you want directly onto your food.
              </p>
            </div>

            {/* Step 3 */}
            <div className="bg-[#FAF7F2] rounded-2xl p-6 border border-[#E7E5E4] text-center flex flex-col items-center hover:shadow-md transition">
              <div className="w-24 h-24 mb-4">
                <img src="/images/step-3.svg" alt="Step 3: Done" className="w-full h-full object-contain" />
              </div>
              <h4 className="font-extrabold text-lg text-[#1C1917] mb-2">3. Snap Shut &amp; Done</h4>
              <p className="text-sm text-[#57534E]">
                Snap the cap closed. No sticky spoons to scrub in the office washroom, no oily spills.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* FLAVOUR PICKER & CART BUILDER */}
      <section id="order" className="py-16 px-4 sm:px-8 max-w-6xl mx-auto w-full">
        <div className="text-center max-w-2xl mx-auto mb-10">
          <span className="text-xs font-extrabold text-[#C2410C] uppercase tracking-widest">
            Taste The Tradition
          </span>
          <h2 className="text-2xl sm:text-4xl font-black text-[#1C1917] mt-1">
            Choose Your Flavour &amp; Pack
          </h2>
          <p className="text-sm sm:text-base text-[#57534E] mt-2">
            Cooked with authentic home recipes. Select a single tube or save with the 3-flavour pack.
          </p>
        </div>

        {/* Pack Selector Toggle */}
        <div className="max-w-md mx-auto mb-8 bg-[#E7E5E4]/60 p-1.5 rounded-2xl flex items-center">
          <button
            type="button"
            onClick={() => handleSelectPack("single")}
            className={`flex-1 py-2.5 px-4 rounded-xl text-xs sm:text-sm font-bold transition ${
              selectedPack === "single"
                ? "bg-white text-[#1C1917] shadow-sm"
                : "text-[#57534E] hover:text-[#1C1917]"
            }`}
          >
            Single Tube (150g) • ₹{currentPricing.singlePrice}
          </button>
          <button
            type="button"
            onClick={() => handleSelectPack("three_pack")}
            className={`flex-1 py-2.5 px-4 rounded-xl text-xs sm:text-sm font-bold transition flex items-center justify-center space-x-1.5 ${
              selectedPack === "three_pack"
                ? "bg-[#C2410C] text-white shadow-sm"
                : "text-[#57534E] hover:text-[#1C1917]"
            }`}
          >
            <span>3-Pack (3x150g) • ₹{currentPricing.threePackPrice}</span>
            <span className="bg-[#FEF3C7] text-[#78350F] text-[10px] px-1.5 py-0.5 rounded font-extrabold">
              Save
            </span>
          </button>
        </div>

        {/* Flavour Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {productConfig.flavours.map((flavour) => {
            const isSelected = selectedPack === "three_pack" || selectedFlavour === flavour.id;
            return (
              <div
                key={flavour.id}
                onClick={() => {
                  if (selectedPack === "single") {
                    handleSelectFlavour(flavour.id);
                  }
                }}
                className={`relative bg-white rounded-3xl p-5 border-2 transition-all cursor-pointer ${
                  isSelected
                    ? "border-[#C2410C] ring-4 ring-[#C2410C]/10 shadow-lg"
                    : "border-[#E7E5E4] hover:border-[#CBD5E1]"
                }`}
              >
                {/* Stock Tag */}
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[11px] font-extrabold uppercase px-2.5 py-1 rounded-full bg-[#FAF7F2] text-[#57534E] border border-[#E7E5E4]">
                    {flavour.tag}
                  </span>
                  {flavour.inStock ? (
                    <span className="inline-flex items-center text-[11px] font-bold text-[#15803D] bg-[#DCFCE7] px-2 py-0.5 rounded-full">
                      ● In Stock
                    </span>
                  ) : (
                    <span className="text-[11px] font-bold text-red-600 bg-red-100 px-2 py-0.5 rounded-full">
                      Out of Stock
                    </span>
                  )}
                </div>

                {/* Flavour Image */}
                <div className="w-full h-44 mb-3 flex items-center justify-center bg-[#FAF7F2] rounded-2xl overflow-hidden p-2">
                  <img
                    src={flavour.image}
                    alt={flavour.name}
                    className="w-full h-full object-contain transform hover:scale-105 transition"
                  />
                </div>

                {/* Details */}
                <h3 className="font-extrabold text-lg text-[#1C1917] mb-1">
                  {flavour.name}
                </h3>
                <p className="text-xs sm:text-sm text-[#57534E] mb-3 leading-snug">
                  {flavour.shortDesc}
                </p>

                <div className="pt-2 border-t border-[#F5F5F4] text-[11px] text-[#78350F] font-medium">
                  {flavour.pairing}
                </div>

                {/* Selection Checkbox / Radio */}
                <div className="mt-4 pt-3 flex items-center justify-between">
                  <span className="text-xs font-bold text-[#1C1917]">
                    {selectedPack === "three_pack"
                      ? "Included in 3-Pack"
                      : isSelected
                      ? "✓ Selected"
                      : "Click to select"}
                  </span>
                  <div
                    className={`w-6 h-6 rounded-full flex items-center justify-center border-2 ${
                      isSelected
                        ? "bg-[#C2410C] border-[#C2410C] text-white"
                        : "border-[#CBD5E1] bg-white"
                    }`}
                  >
                    {isSelected && <span className="text-xs font-bold">✓</span>}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Sticky Cart Summary Bar / Checkout Box */}
        <div className="bg-white rounded-3xl p-6 border border-[#E7E5E4] shadow-xl max-w-xl mx-auto">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-[#E7E5E4] gap-3">
            <div>
              <span className="text-xs font-bold text-[#C2410C] uppercase tracking-wider">
                Order Configuration
              </span>
              <h4 className="text-lg font-black text-[#1C1917]">
                {selectedPack === "three_pack"
                  ? "3-Flavour Variety Pack (3 x 150g)"
                  : `Single Tube (150g) - ${productConfig.flavours.find((f) => f.id === selectedFlavour)?.name}`}
              </h4>
              <p className="text-xs text-[#57534E]">Includes all launch batch benefits</p>
            </div>

            {/* Quantity Selector */}
            <div className="flex items-center space-x-2">
              <span className="text-xs font-bold text-[#57534E]">Qty:</span>
              <div className="flex items-center border border-[#E7E5E4] rounded-xl overflow-hidden bg-[#FAF7F2]">
                <button
                  type="button"
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="px-3 py-1 font-black text-sm text-[#1C1917] hover:bg-[#E7E5E4] transition"
                  aria-label="Decrease quantity"
                >
                  -
                </button>
                <span className="px-3 py-1 text-sm font-bold text-[#1C1917] min-w-[28px] text-center">
                  {quantity}
                </span>
                <button
                  type="button"
                  onClick={() => setQuantity(Math.min(10, quantity + 1))}
                  className="px-3 py-1 font-black text-sm text-[#1C1917] hover:bg-[#E7E5E4] transition"
                  aria-label="Increase quantity"
                >
                  +
                </button>
              </div>
            </div>
          </div>

          <div className="pt-4 flex items-center justify-between">
            <div>
              <span className="text-xs text-[#57534E] block">Total Amount</span>
              <span className="text-2xl sm:text-3xl font-black text-[#1C1917]">
                ₹{totalPrice}
              </span>
            </div>

            <button
              type="button"
              onClick={handleAddToCartAndCheckout}
              className="bg-[#C2410C] hover:bg-[#9A3412] text-white font-extrabold text-sm sm:text-base px-8 py-3.5 rounded-xl shadow-md hover:shadow-lg transition flex items-center space-x-2"
            >
              <span>Proceed to Checkout</span>
              <span>→</span>
            </button>
          </div>
        </div>
      </section>

      {/* WHY A TUBE? COMPARISON SECTION */}
      <section id="why-tube" className="py-16 bg-[#FAF7F2] border-t border-[#E7E5E4] px-4 sm:px-8">
        <div className="max-w-5xl mx-auto">
          <div className="text-center max-w-xl mx-auto mb-10">
            <span className="text-xs font-extrabold text-[#C2410C] uppercase tracking-widest">
              Smart Design
            </span>
            <h2 className="text-2xl sm:text-3xl font-black text-[#1C1917] mt-1">
              Why a Tube?
            </h2>
            <p className="text-sm text-[#57534E] mt-2">
              Designed specifically for the daily office tiffin routine. Benefits only, no unprovable claims.
            </p>
          </div>

          {/* Desktop Table View */}
          <div className="hidden md:block overflow-hidden bg-white rounded-3xl border border-[#E7E5E4] shadow-sm">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#FAF7F2] border-b border-[#E7E5E4] text-xs font-black text-[#1C1917] uppercase tracking-wider">
                  <th className="py-4 px-5">Factor</th>
                  <th className="py-4 px-5 bg-[#DCFCE7]/60 text-[#15803D]">Chutney Tube ✨</th>
                  <th className="py-4 px-5">Glass Jar</th>
                  <th className="py-4 px-5">Plastic Sachet</th>
                  <th className="py-4 px-5">Small Dabba</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E7E5E4] text-sm">
                {productConfig.tubeComparisons.map((item, idx) => (
                  <tr key={idx} className="hover:bg-[#FAF7F2]/40 transition">
                    <td className="py-4 px-5 font-bold text-[#1C1917]">
                      {item.factor}
                    </td>
                    <td className="py-4 px-5 font-semibold text-[#15803D] bg-[#DCFCE7]/30">
                      ✓ {item.tube}
                    </td>
                    <td className="py-4 px-5 text-[#57534E]">
                      ✗ {item.jar}
                    </td>
                    <td className="py-4 px-5 text-[#57534E]">
                      ✗ {item.sachet}
                    </td>
                    <td className="py-4 px-5 text-[#57534E]">
                      ✗ {item.dabba}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Card Carousel/Stack View */}
          <div className="md:hidden space-y-4">
            {productConfig.tubeComparisons.map((item, idx) => (
              <div key={idx} className="bg-white rounded-2xl p-5 border border-[#E7E5E4] shadow-sm">
                <h4 className="font-extrabold text-[#1C1917] text-base mb-3 border-b border-[#E7E5E4] pb-2">
                  {item.factor}
                </h4>
                <div className="space-y-2 text-xs">
                  <div className="bg-[#DCFCE7] text-[#15803D] p-2.5 rounded-xl font-bold">
                    <strong>Chutney Tube:</strong> {item.tube}
                  </div>
                  <div className="text-[#57534E] px-1">
                    <strong>Glass Jar:</strong> {item.jar}
                  </div>
                  <div className="text-[#57534E] px-1">
                    <strong>Sachet:</strong> {item.sachet}
                  </div>
                  <div className="text-[#57534E] px-1">
                    <strong>Small Dabba:</strong> {item.dabba}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ SECTION (Clear TBD Markers) */}
      <section id="faq" className="py-16 bg-white border-t border-[#E7E5E4] px-4 sm:px-8">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-10">
            <span className="text-xs font-extrabold text-[#C2410C] uppercase tracking-widest">
              Questions &amp; Details
            </span>
            <h2 className="text-2xl sm:text-3xl font-black text-[#1C1917] mt-1">
              Frequently Asked Questions
            </h2>
            <p className="text-sm text-[#57534E] mt-2">
              Transparent answers regarding our formulation, packaging, and pilot delivery.
            </p>
          </div>

          <div className="space-y-3">
            {productConfig.faq.map((item, idx) => {
              const isOpen = faqOpenIndex === idx;
              return (
                <div
                  key={idx}
                  className="border border-[#E7E5E4] rounded-2xl overflow-hidden transition"
                >
                  <button
                    type="button"
                    onClick={() => setFaqOpenIndex(isOpen ? null : idx)}
                    className="w-full text-left py-4 px-5 bg-[#FAF7F2] hover:bg-[#F5F5F4] flex items-center justify-between font-bold text-sm sm:text-base text-[#1C1917] transition"
                  >
                    <span>{item.q}</span>
                    <span className="text-[#C2410C] text-lg font-black ml-2">
                      {isOpen ? "−" : "+"}
                    </span>
                  </button>
                  {isOpen && (
                    <div className="p-5 bg-white text-xs sm:text-sm text-[#57534E] leading-relaxed border-t border-[#E7E5E4]">
                      {item.a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="mt-auto bg-[#1C1917] text-[#A8A29E] py-12 px-4 sm:px-8 border-t border-[#292524]">
        <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-12 gap-8">
          <div className="md:col-span-6 space-y-3">
            <div className="flex items-center space-x-2">
              <div className="w-7 h-7 rounded-lg bg-[#C2410C] flex items-center justify-center text-white font-black text-sm">
                C
              </div>
              <span className="font-black text-lg text-white">
                {productConfig.brand.name}
              </span>
            </div>
            <p className="text-xs text-[#A8A29E] leading-relaxed max-w-sm">
              {productConfig.brand.tagline} Designed for desk lunches and busy office routines across India.
            </p>
            <p className="text-xs text-[#78716C]">
              Contact: <a href={`mailto:${productConfig.brand.contactEmail}`} className="text-[#FEF3C7] underline">{productConfig.brand.contactEmail}</a>
            </p>
          </div>

          <div className="md:col-span-3 space-y-2">
            <h5 className="text-xs font-bold uppercase tracking-wider text-white">
              Legal &amp; Privacy
            </h5>
            <ul className="space-y-1.5 text-xs">
              <li>
                <Link href="/privacy" className="hover:text-white transition underline">
                  Privacy Policy (DPDP Act)
                </Link>
              </li>
              <li>
                <Link href="/terms" className="hover:text-white transition underline">
                  Terms of Demand Testing
                </Link>
              </li>
            </ul>
          </div>

          <div className="md:col-span-3 space-y-2">
            <h5 className="text-xs font-bold uppercase tracking-wider text-white">
              Internal Portal
            </h5>
            <ul className="space-y-1.5 text-xs">
              <li>
                <Link href="/admin" className="text-[#FDE68A] hover:underline font-bold">
                  Admin Analytics &amp; Funnel Dashboard →
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="max-w-6xl mx-auto mt-8 pt-6 border-t border-[#292524] text-center text-[11px] text-[#78716C]">
          <p>© {new Date().getFullYear()} {productConfig.brand.name}. Pre-launch validation prototype. No commercial transactions are processed on this site.</p>
        </div>
      </footer>
    </div>
  );
}
