"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import productConfig from "../../config/product.config";
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
    flavour: "mint-coriander",
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

    const pricing = productConfig.pricing.variants[v] || productConfig.pricing.variants.A;

    if (typeof window !== "undefined") {
      const stored = sessionStorage.getItem("ct_cart");
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          const uPrice = parsed.pack === "three_pack" ? pricing.threePackPrice : pricing.singlePrice;
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
          flavour: "mint-coriander",
          quantity: 1,
          unitPrice: pricing.singlePrice,
          totalPrice: pricing.singlePrice,
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
      const isDeliverable = productConfig.launchPincodes.includes(pin);
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

    // Save submission context to sessionStorage for the reveal page
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
    productConfig.flavours.find((f) => f.id === cart.flavour)?.name || "Mint-Coriander";

  return (
    <div className="min-h-screen bg-[#FAF7F2] flex flex-col">
      {/* Top Header */}
      <header className="bg-white border-b border-[#E7E5E4] py-3.5 px-4 sm:px-8">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <Link href="/" className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-lg bg-[#C2410C] flex items-center justify-center text-white font-black text-sm">
              C
            </div>
            <span className="font-extrabold text-lg text-[#1C1917]">
              {productConfig.brand.name}
            </span>
          </Link>
          <div className="text-xs text-[#57534E] font-medium flex items-center space-x-1">
            <span>🔒 Secure Pre-Launch Reservation</span>
          </div>
        </div>
      </header>

      {/* Main Checkout Container */}
      <main className="flex-1 max-w-4xl mx-auto w-full p-4 sm:p-6 lg:p-8">
        <div className="mb-6">
          <Link href="/" className="text-xs font-bold text-[#C2410C] hover:underline flex items-center space-x-1">
            <span>← Back to product details</span>
          </Link>
          <h1 className="text-2xl sm:text-3xl font-black text-[#1C1917] mt-2">
            Confirm Your Delivery Details
          </h1>
          <p className="text-xs sm:text-sm text-[#57534E]">
            Reserve your batch from our upcoming pilot production.
          </p>
        </div>

        <form onSubmit={handleSubmitPayment} className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left Column: Delivery & Payment Details */}
          <div className="lg:col-span-7 space-y-6">
            {/* Step 1: Contact & Address */}
            <div className="bg-white rounded-3xl p-6 border border-[#E7E5E4] shadow-sm space-y-4">
              <h2 className="text-base font-extrabold text-[#1C1917] flex items-center space-x-2 border-b border-[#E7E5E4] pb-3">
                <span className="w-6 h-6 rounded-full bg-[#FEF3C7] text-[#78350F] flex items-center justify-center text-xs font-black">
                  1
                </span>
                <span>Delivery Address</span>
              </h2>

              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-bold text-[#1C1917] mb-1">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Priya Sharma"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full text-sm px-3.5 py-2.5 rounded-xl border border-[#D6D3D1] bg-[#FAF7F2] focus:bg-white focus:border-[#C2410C] transition"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-[#1C1917] mb-1">
                      Phone (for WhatsApp/delivery alerts) *
                    </label>
                    <input
                      type="tel"
                      required
                      placeholder="9876543210"
                      pattern="[0-9]{10}"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value.replace(/\D/g, "").slice(0, 10) })}
                      className="w-full text-sm px-3.5 py-2.5 rounded-xl border border-[#D6D3D1] bg-[#FAF7F2] focus:bg-white focus:border-[#C2410C] transition"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[#1C1917] mb-1">
                      Email Address *
                    </label>
                    <input
                      type="email"
                      required
                      placeholder="priya@company.com"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="w-full text-sm px-3.5 py-2.5 rounded-xl border border-[#D6D3D1] bg-[#FAF7F2] focus:bg-white focus:border-[#C2410C] transition"
                    />
                  </div>
                </div>

                {/* Pincode with live check */}
                <div>
                  <label className="block text-xs font-bold text-[#1C1917] mb-1">
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
                      className="w-full text-sm px-3.5 py-2.5 rounded-xl border border-[#D6D3D1] bg-[#FAF7F2] focus:bg-white focus:border-[#C2410C] transition font-mono"
                    />
                  </div>

                  {/* Live Pincode Feedback */}
                  {pincodeStatus === "deliverable" && (
                    <div className="mt-2 p-2.5 bg-[#DCFCE7] border border-[#86EFAC] rounded-xl text-xs font-bold text-[#15803D] flex items-center space-x-1.5 animate-fadeIn">
                      <span>✓</span>
                      <span>We deliver here in our Phase 1 metro launch batch!</span>
                    </div>
                  )}

                  {pincodeStatus === "out_of_area" && (
                    <div className="mt-2 p-3 bg-[#FEF3C7] border border-[#FDE68A] rounded-xl text-xs text-[#78350F] space-y-2 animate-fadeIn">
                      <div className="font-bold flex items-center space-x-1.5">
                        <span>📍</span>
                        <span>Not in our Phase 1 coverage area yet.</span>
                      </div>
                      <p className="text-[11px] text-[#57534E]">
                        We are opening cities based on local demand. Click below to register this pincode on our launch priority list.
                      </p>
                      {waitlistJoined ? (
                        <div className="text-[#15803D] font-bold text-xs">
                          ✓ Pincode {formData.pincode} added to launch priority list!
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={handleJoinWaitlist}
                          className="bg-[#78350F] hover:bg-[#451A03] text-white text-xs font-bold px-3 py-1.5 rounded-lg shadow-sm transition"
                        >
                          Join Waitlist for {formData.pincode}
                        </button>
                      )}
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#1C1917] mb-1">
                    Complete Address (Flat, Office desk, Street) *
                  </label>
                  <textarea
                    required
                    rows={2}
                    placeholder="Floor 4, Desk 42, WeWork Salarpuria, Koramangala..."
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    className="w-full text-sm px-3.5 py-2.5 rounded-xl border border-[#D6D3D1] bg-[#FAF7F2] focus:bg-white focus:border-[#C2410C] transition"
                  />
                </div>
              </div>
            </div>

            {/* Step 2: Payment Step (STRICTLY MOCK ONLY - Plain buttons, no gateway, no card inputs) */}
            <div className="bg-white rounded-3xl p-6 border border-[#E7E5E4] shadow-sm space-y-4">
              <h2 className="text-base font-extrabold text-[#1C1917] flex items-center space-x-2 border-b border-[#E7E5E4] pb-3">
                <span className="w-6 h-6 rounded-full bg-[#FEF3C7] text-[#78350F] flex items-center justify-center text-xs font-black">
                  2
                </span>
                <span>Select Payment Preference (Mock Step)</span>
              </h2>

              {/* Informative Mock Banner */}
              <div className="p-3 bg-[#FAF7F2] border border-[#E7E5E4] rounded-xl text-xs text-[#57534E] flex items-start space-x-2">
                <span className="text-base leading-none">ℹ️</span>
                <div>
                  <strong className="text-[#1C1917]">No payment is collected.</strong> This confirms which payment method you prefer when the product launches. No card details or UPI IDs will be asked.
                </div>
              </div>

              {/* Plain Payment Buttons - Generic only, NO logos */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <button
                  type="button"
                  onClick={() => handleSelectPaymentMethod("upi")}
                  className={`py-3.5 px-4 rounded-2xl border-2 text-center transition flex flex-col items-center justify-center space-y-1 ${
                    selectedPaymentMethod === "upi"
                      ? "border-[#C2410C] bg-[#FFF7ED] text-[#C2410C] font-black"
                      : "border-[#E7E5E4] bg-[#FAF7F2] text-[#57534E] hover:border-[#D6D3D1]"
                  }`}
                >
                  <span className="text-base">📱</span>
                  <span className="text-xs font-bold">UPI</span>
                  <span className="text-[10px] text-[#78716C]">Instant &amp; Easy</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleSelectPaymentMethod("card")}
                  className={`py-3.5 px-4 rounded-2xl border-2 text-center transition flex flex-col items-center justify-center space-y-1 ${
                    selectedPaymentMethod === "card"
                      ? "border-[#C2410C] bg-[#FFF7ED] text-[#C2410C] font-black"
                      : "border-[#E7E5E4] bg-[#FAF7F2] text-[#57534E] hover:border-[#D6D3D1]"
                  }`}
                >
                  <span className="text-base">💳</span>
                  <span className="text-xs font-bold">Credit / Debit Card</span>
                  <span className="text-[10px] text-[#78716C]">All Banks</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleSelectPaymentMethod("cod")}
                  className={`py-3.5 px-4 rounded-2xl border-2 text-center transition flex flex-col items-center justify-center space-y-1 ${
                    selectedPaymentMethod === "cod"
                      ? "border-[#C2410C] bg-[#FFF7ED] text-[#C2410C] font-black"
                      : "border-[#E7E5E4] bg-[#FAF7F2] text-[#57534E] hover:border-[#D6D3D1]"
                  }`}
                >
                  <span className="text-base">💵</span>
                  <span className="text-xs font-bold">Cash on Delivery</span>
                  <span className="text-[10px] text-[#78716C]">Pay on arrival</span>
                </button>
              </div>

              {/* Privacy Consent Line (Under Form - DPDP Act compliant) */}
              <div className="pt-2 text-[11px] text-[#78716C] leading-snug">
                🛡️ <strong>Privacy Notice:</strong> By placing your reservation, you consent to our collecting your contact details strictly to communicate production milestones, launch availability, and dispatch updates under the Digital Personal Data Protection (DPDP) Act. We never sell or share your data.
              </div>
            </div>
          </div>

          {/* Right Column: Order Summary & Pay CTA */}
          <div className="lg:col-span-5">
            <div className="sticky top-20 bg-white rounded-3xl p-6 border border-[#E7E5E4] shadow-md space-y-4">
              <h3 className="font-extrabold text-base text-[#1C1917] border-b border-[#E7E5E4] pb-3">
                Order Summary
              </h3>

              <div className="space-y-3 text-xs">
                <div className="flex justify-between items-start">
                  <div>
                    <strong className="text-[#1C1917] block text-sm">
                      {cart.pack === "three_pack"
                        ? "3-Flavour Variety Pack (3 x 150g)"
                        : `Single Tube (150g) • ${selectedFlavourName}`}
                    </strong>
                    <span className="text-[#57534E]">Quantity: {cart.quantity}</span>
                  </div>
                  <span className="font-black text-sm text-[#1C1917]">
                    ₹{cart.totalPrice}
                  </span>
                </div>

                <div className="flex justify-between text-[#57534E] pt-2 border-t border-[#F5F5F4]">
                  <span>Delivery Fee</span>
                  <span className="text-[#15803D] font-bold">FREE (Early Bird)</span>
                </div>

                <div className="flex justify-between text-[#57534E]">
                  <span>Packaging &amp; Insulation</span>
                  <span className="text-[#15803D] font-bold">FREE</span>
                </div>

                <div className="flex justify-between items-center pt-3 border-t-2 border-[#1C1917] text-base font-black text-[#1C1917]">
                  <span>Total Payable:</span>
                  <span className="text-xl font-black text-[#C2410C]">
                    ₹{cart.totalPrice}
                  </span>
                </div>
              </div>

              {/* Action Button: Pay ₹X */}
              <button
                type="submit"
                className="w-full bg-[#C2410C] hover:bg-[#9A3412] text-white font-black text-base py-4 rounded-2xl shadow-lg hover:shadow-xl transition transform active:scale-98 flex items-center justify-center space-x-2"
              >
                <span>Pay ₹{cart.totalPrice}</span>
                <span>→</span>
              </button>

              <div className="text-center">
                <span className="text-[11px] text-[#78716C] block">
                  Zero risk demand validation • No charge is applied
                </span>
              </div>
            </div>
          </div>
        </form>
      </main>
    </div>
  );
}
