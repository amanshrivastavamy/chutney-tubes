"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import storeConfig from "../../config/store";
import { trackEvent, resolvePriceVariant, resolveTrafficSource } from "../../lib/tracking";

export default function CheckoutPage() {
  const router = useRouter();

  // Pricing & variant
  const [variantId, setVariantId] = useState<"A" | "B" | "C">("A");
  const [cart, setCart] = useState<{
    pack: string;
    flavour: string;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
  }>({
    pack: "single",
    flavour: "green",
    quantity: 1,
    unitPrice: 99,
    totalPrice: 99,
  });

  // Customer & Shipping Form
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    email: "",
    pincode: "",
    address: "",
    city: "",
  });

  // Pincode validation state
  const [pincodeStatus, setPincodeStatus] = useState<"idle" | "deliverable" | "out_of_area">("idle");
  const [waitlistJoined, setWaitlistJoined] = useState(false);

  // Payment method selection (plain buttons)
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<"upi" | "card" | "cod">("upi");

  // Load cart & variant on mount
  useEffect(() => {
    const v = resolvePriceVariant();
    setVariantId(v);

    const pricing = storeConfig.prices[v] || storeConfig.prices.A;

    if (typeof window !== "undefined") {
      const stored = sessionStorage.getItem("ct_cart");
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          const uPrice = parsed.pack === "three_pack" || parsed.pack === "combo" || parsed.pack === "pick3"
            ? pricing.trio
            : pricing.single;
          setCart({
            ...parsed,
            unitPrice: uPrice,
            totalPrice: uPrice * (parsed.quantity || 1),
          });
        } catch (e) {
          // fallback default
        }
      } else {
        setCart({
          pack: "single",
          flavour: "green",
          quantity: 1,
          unitPrice: pricing.single,
          totalPrice: pricing.single,
        });
      }
    }

    trackEvent("checkout_started", {
      variant: v,
      source: resolveTrafficSource(),
    });
  }, []);

  // Handle live pincode check
  const handlePincodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const pin = e.target.value.replace(/\D/g, "").slice(0, 6);
    setFormData((prev) => ({ ...prev, pincode: pin }));

    if (pin.length === 6) {
      const isDeliverable = storeConfig.launchPincodes.includes(pin);
      if (isDeliverable) {
        setPincodeStatus("deliverable");
        trackEvent("pincode_checked", { pincode: pin, isDeliverable: true });
      } else {
        setPincodeStatus("out_of_area");
        trackEvent("pincode_checked", { pincode: pin, isDeliverable: false });
      }
    } else {
      setPincodeStatus("idle");
    }
  };

  // Join waitlist from pincode prompt
  const handleJoinWaitlist = () => {
    setWaitlistJoined(true);
    trackEvent("waitlist_optin", {
      pincode: formData.pincode,
      email: formData.email,
      phone: formData.phone,
      reason: "out_of_area_pincode",
    });
  };

  // Payment method selection
  const handleSelectPaymentMethod = (method: "upi" | "card" | "cod") => {
    setSelectedPaymentMethod(method);
    trackEvent("payment_method_selected", { paymentMethod: method });
  };

  // Submit mock payment -> Transition to honest reveal screen
  const handleSubmitPayment = (e: React.FormEvent) => {
    e.preventDefault();

    trackEvent("pay_clicked", {
      pack: cart.pack,
      flavour: cart.flavour,
      quantity: cart.quantity,
      totalAmount: cart.totalPrice,
      paymentMethod: selectedPaymentMethod,
      pincode: formData.pincode,
      isDeliverable: pincodeStatus === "deliverable",
      customerName: formData.name,
      customerEmail: formData.email,
      customerPhone: formData.phone,
    });

    if (typeof window !== "undefined") {
      sessionStorage.setItem(
        "ct_order_summary",
        JSON.stringify({
          pack: cart.pack,
          flavour: cart.flavour,
          quantity: cart.quantity,
          totalPrice: cart.totalPrice,
          paymentMethod: selectedPaymentMethod,
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
          pincode: formData.pincode,
        })
      );
    }

    router.push("/reveal");
  };

  const selectedFlavourName =
    storeConfig.flavours.find((f) => f.id === cart.flavour)?.name || "Chatpati Hari Chutney";

  return (
    <div className="min-h-screen bg-paper flex flex-col text-ink">
      {/* Top Header */}
      <header className="bg-card border-b border-steel py-3.5 px-4 sm:px-8">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <Link href="/" className="flex items-center space-x-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink active:translate-y-px">
            <div className="w-8 h-8 rounded-lg bg-leaf flex items-center justify-center text-paper font-black text-sm">
              C
            </div>
            <span className="font-extrabold text-lg text-ink font-heading">
              {storeConfig.brand.name}
            </span>
          </Link>
          <div className="text-xs text-muted font-medium flex items-center space-x-1.5">
            <svg aria-hidden="true" className="w-4 h-4 text-leaf" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
              <path d="M7 11V7a5 5 0 0 1 10 0v4" />
            </svg>
            <span>Pre-Launch Reservation</span>
          </div>
        </div>
      </header>

      {/* Main Checkout Container */}
      <main className="flex-1 max-w-4xl mx-auto w-full p-4 sm:p-6 lg:p-8">
        <div className="mb-6">
          <Link href="/" className="text-xs font-bold text-leaf hover:underline flex items-center space-x-1 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink active:translate-y-px">
            <span>Back to product details</span>
          </Link>
          <h1 className="text-2xl sm:text-3xl font-black text-ink mt-2 font-heading">
            Confirm Delivery Details
          </h1>
          <p className="text-xs sm:text-sm text-muted">
            Reserve your batch from our upcoming pilot production.
          </p>
        </div>

        <form onSubmit={handleSubmitPayment} className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left Column: Delivery & Payment Details */}
          <div className="lg:col-span-7 space-y-6">
            {/* Step 1: Contact & Address */}
            <div className="bg-card rounded-3xl p-6 border border-steel shadow-sm space-y-4">
              <h2 className="text-base font-extrabold text-ink flex items-center space-x-2 border-b border-steel pb-3 font-heading">
                <span className="w-6 h-6 rounded-full bg-paper-2 text-ink flex items-center justify-center text-xs font-black">
                  1
                </span>
                <span>Delivery Address</span>
              </h2>

              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-bold text-ink mb-1">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Priya Sharma"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full text-sm px-3.5 py-2.5 rounded-xl border border-steel bg-paper focus:bg-card focus:border-leaf focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink transition-colors"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-ink mb-1">
                      Phone (for WhatsApp/delivery alerts) *
                    </label>
                    <input
                      type="tel"
                      required
                      placeholder="9876543210"
                      pattern="[0-9]{10}"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value.replace(/\D/g, "").slice(0, 10) })}
                      className="w-full text-sm px-3.5 py-2.5 rounded-xl border border-steel bg-paper focus:bg-card focus:border-leaf focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink transition-colors"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-ink mb-1">
                      Email Address *
                    </label>
                    <input
                      type="email"
                      required
                      placeholder="priya@company.com"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="w-full text-sm px-3.5 py-2.5 rounded-xl border border-steel bg-paper focus:bg-card focus:border-leaf focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink transition-colors"
                    />
                  </div>
                </div>

                {/* Pincode with live check */}
                <div>
                  <label className="block text-xs font-bold text-ink mb-1">
                    6-digit Delivery Pincode *
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      required
                      maxLength={6}
                      placeholder="e.g. 560001 (Bengaluru), 400001 (Mumbai)..."
                      value={formData.pincode}
                      onChange={handlePincodeChange}
                      className="w-full text-sm px-3.5 py-2.5 rounded-xl border border-steel bg-paper focus:bg-card focus:border-leaf focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink transition-colors"
                    />
                  </div>

                  {/* Live Pincode Feedback */}
                  {pincodeStatus === "deliverable" && (
                    <div className="mt-2 p-2.5 bg-paper-2 border border-leaf rounded-xl text-xs font-bold text-leaf flex items-center space-x-1.5">
                      <span>✓</span>
                      <span>We deliver here in our Phase 1 metro launch batch!</span>
                    </div>
                  )}

                  {pincodeStatus === "out_of_area" && (
                    <div className="mt-2 p-3 bg-paper-2 border border-haldi rounded-xl text-xs text-ink space-y-2">
                      <div className="font-bold flex items-center space-x-1.5">
                        <svg aria-hidden="true" className="w-4 h-4 text-leaf" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                          <circle cx="12" cy="10" r="3" />
                        </svg>
                        <span>Not in our Phase 1 coverage area yet.</span>
                      </div>
                      <p className="text-[11px] text-muted">
                        We are opening cities based on local demand. Click below to register this pincode on our launch priority list.
                      </p>
                      {waitlistJoined ? (
                        <div className="text-leaf font-bold text-xs">
                          ✓ Pincode {formData.pincode} added to launch priority list!
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={handleJoinWaitlist}
                          className="bg-leaf hover:bg-deepLeaf text-paper text-xs font-bold px-3 py-1.5 rounded-lg shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink active:translate-y-px"
                        >
                          Join Waitlist for {formData.pincode}
                        </button>
                      )}
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-bold text-ink mb-1">
                    Complete Address (Flat, Office desk, Street) *
                  </label>
                  <textarea
                    required
                    rows={2}
                    placeholder="Floor 4, Desk 42, WeWork Salarpuria, Koramangala..."
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    className="w-full text-sm px-3.5 py-2.5 rounded-xl border border-steel bg-paper focus:bg-card focus:border-leaf focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink transition-colors"
                  />
                </div>
              </div>
            </div>

            {/* Step 2: Payment Step (STRICTLY MOCK ONLY - Plain buttons, no gateway, no card inputs) */}
            <div className="bg-card rounded-3xl p-6 border border-steel shadow-sm space-y-4">
              <h2 className="text-base font-extrabold text-ink flex items-center space-x-2 border-b border-steel pb-3 font-heading">
                <span className="w-6 h-6 rounded-full bg-paper-2 text-ink flex items-center justify-center text-xs font-black">
                  2
                </span>
                <span>Select Payment Preference (Mock Step)</span>
              </h2>

              {/* Informative Mock Banner */}
              <div className="p-3 bg-paper border border-steel rounded-xl text-xs text-muted flex items-start space-x-2">
                <svg aria-hidden="true" className="w-4 h-4 text-leaf mt-0.5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="16" x2="12" y2="12" />
                  <line x1="12" y1="8" x2="12.01" y2="8" />
                </svg>
                <div>
                  <strong className="text-ink">No payment is collected.</strong> This confirms which payment method you prefer when the product launches. No card details or UPI IDs will be asked.
                </div>
              </div>

              {/* Plain Payment Buttons - Generic only, NO logos */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {(() => {
                  const isUpi = selectedPaymentMethod === "upi";
                  const isCard = selectedPaymentMethod === "card";
                  const isCod = selectedPaymentMethod === "cod";
                  return (
                    <>
                      <button
                        type="button"
                        onClick={() => handleSelectPaymentMethod("upi")}
                        className={`py-3 px-3 rounded-xl border text-center transition-colors flex flex-col items-center justify-center space-y-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink active:translate-y-px ${
                          isUpi
                            ? "border-leaf bg-paper-2 text-leaf font-bold"
                            : "border-steel bg-paper text-muted hover:border-steel"
                        }`}
                      >
                        <svg aria-hidden="true" className="w-5 h-5 text-current mb-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <rect x="5" y="2" width="14" height="20" rx="2" ry="2" />
                          <line x1="12" y1="18" x2="12.01" y2="18" />
                        </svg>
                        <span className="text-xs font-bold whitespace-nowrap">UPI</span>
                        <span className="text-[10px] text-muted whitespace-nowrap">Instant and easy</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleSelectPaymentMethod("card")}
                        className={`py-3 px-3 rounded-xl border text-center transition-colors flex flex-col items-center justify-center space-y-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink active:translate-y-px ${
                          isCard
                            ? "border-leaf bg-paper-2 text-leaf font-bold"
                            : "border-steel bg-paper text-muted hover:border-steel"
                        }`}
                      >
                        <svg aria-hidden="true" className="w-5 h-5 text-current mb-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <rect x="1" y="4" width="22" height="16" rx="2" ry="2" />
                          <line x1="1" y1="10" x2="23" y2="10" />
                        </svg>
                        <span className="text-xs font-bold whitespace-nowrap">Credit / Debit</span>
                        <span className="text-[10px] text-muted whitespace-nowrap">Banks</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleSelectPaymentMethod("cod")}
                        className={`py-3 px-3 rounded-xl border text-center transition-colors flex flex-col items-center justify-center space-y-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink active:translate-y-px ${
                          isCod
                            ? "border-leaf bg-paper-2 text-leaf font-bold"
                            : "border-steel bg-paper text-muted hover:border-steel"
                        }`}
                      >
                        <svg aria-hidden="true" className="w-5 h-5 text-current mb-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <rect x="2" y="6" width="20" height="12" rx="2" />
                          <circle cx="12" cy="12" r="2" />
                        </svg>
                        <span className="text-xs font-bold whitespace-nowrap">Cash on Delivery</span>
                        <span className="text-[10px] text-muted whitespace-nowrap">Doorstep</span>
                      </button>
                    </>
                  );
                })()}
              </div>

              {/* Privacy Consent Line (Under Form - DPDP Act compliant) */}
              <div className="pt-2 text-[11px] text-muted leading-snug">
                <strong>Privacy Notice:</strong> By placing your reservation, you consent to our collecting your contact details strictly to communicate production milestones, launch availability, and dispatch updates under the Digital Personal Data Protection (DPDP) Act. We never sell or share your data.
              </div>
            </div>
          </div>

          {/* Right Column: Order Summary & Pay CTA */}
          <div className="lg:col-span-5">
            <div className="sticky top-20 bg-card rounded-3xl p-6 border border-steel shadow-md space-y-4">
              <h3 className="font-extrabold text-base text-ink border-b border-steel pb-3 font-heading">
                Order Summary
              </h3>

              <div className="space-y-3 text-xs">
                <div className="flex justify-between items-start">
                  <div>
                    <strong className="text-ink block text-sm">
                      {cart.pack === "three_pack" || cart.pack === "combo" || cart.pack === "pick3"
                        ? "3-Flavour Variety Pack (3 x 100g)"
                        : `Single Tube (100g) · ${selectedFlavourName}`}
                    </strong>
                    <span className="text-muted">Quantity: {cart.quantity}</span>
                  </div>
                  <span className="font-black text-sm text-ink font-heading">
                    ₹{cart.totalPrice}
                  </span>
                </div>

                <div className="flex justify-between text-muted pt-2 border-t border-steel">
                  <span>Delivery Fee</span>
                  <span className="text-leaf font-bold">FREE (Early Bird)</span>
                </div>

                <div className="flex justify-between text-muted">
                  <span>Packaging &amp; Insulation</span>
                  <span className="text-leaf font-bold">FREE</span>
                </div>

                <div className="flex justify-between items-center pt-3 border-t-2 border-ink text-base font-black text-ink">
                  <span>Total Payable:</span>
                  <span className="text-xl font-black text-leaf font-heading">
                    ₹{cart.totalPrice}
                  </span>
                </div>
              </div>

              {/* Action Button: Pay ₹X */}
              <button
                type="submit"
                className="w-full bg-leaf hover:bg-deepLeaf text-paper font-black text-base py-4 rounded-2xl shadow-lg transition-colors flex items-center justify-center font-heading focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink active:translate-y-px disabled:opacity-50"
              >
                <span>Pay ₹{cart.totalPrice}</span>
              </button>

              <div className="text-center">
                <span className="text-[11px] text-muted block">
                  Zero risk demand validation · No charge is applied
                </span>
              </div>
            </div>
          </div>
        </form>
      </main>
    </div>
  );
}
