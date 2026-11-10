"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { storeConfig, formatInr } from "../../config/store";
import { trackEvent, resolveTrafficSource } from "../../lib/tracking";

export default function CheckoutPage() {
  const router = useRouter();

  const [cart, setCart] = useState<{
    pack: string;
    flavour: string;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
  }>({
    pack: "single",
    flavour: "masala-ketchup",
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
  });

  const [pincodeStatus, setPincodeStatus] = useState<"idle" | "deliverable" | "out_of_area">("idle");
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<"upi" | "card" | "cod">("upi");

  useEffect(() => {
    if (typeof window !== "undefined") {
      const stored = sessionStorage.getItem("ct_cart") || localStorage.getItem("ct_cart_items");
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          if (Array.isArray(parsed) && parsed.length > 0) {
            const first = parsed[0];
            const tot = parsed.reduce((sum: number, it: any) => sum + (it.unitPrice || 99) * (it.quantity || 1), 0);
            setCart({
              pack: first.kind || "single",
              flavour: (first.flavours && first.flavours[0]) || "masala-ketchup",
              quantity: parsed.reduce((sum: number, it: any) => sum + (it.quantity || 1), 0),
              unitPrice: 99,
              totalPrice: tot,
            });
          }
        } catch (e) {}
      }
    }

    trackEvent("checkout_started", {
      source: resolveTrafficSource(),
    });
  }, []);

  const handlePincodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const pin = e.target.value.replace(/\D/g, "").slice(0, 6);
    setFormData((prev) => ({ ...prev, pincode: pin }));

    if (pin.length === 6) {
      const isDeliverable = /^[1-8]\d{5}$/.test(pin);
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

  const handlePayClick = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.phone || formData.phone.length !== 10 || pincodeStatus !== "deliverable") {
      return;
    }

    trackEvent("pay_clicked", {
      amount: cart.totalPrice,
      paymentMethod: selectedPaymentMethod,
      customerDetails: {
        name: formData.name,
        phone: formData.phone,
        email: formData.email,
        pincode: formData.pincode,
        address: formData.address,
      },
      cart,
    });

    if (typeof window !== "undefined") {
      sessionStorage.setItem(
        "ct_order_summary",
        JSON.stringify({
          pack: cart.pack,
          flavour: cart.flavour,
          totalPrice: cart.totalPrice,
          email: formData.email,
          phone: formData.phone,
        })
      );
    }

    router.push("/reveal");
  };

  return (
    <div className="min-h-screen bg-paper flex flex-col justify-between text-ink">
      <header className="bg-card border-b border-steel py-4 px-4 sm:px-8">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <Link href="/" className="flex items-center space-x-2">
            <span className="font-extrabold text-xl text-ink font-heading">
              {storeConfig.brand.name}
            </span>
          </Link>
          <span className="text-xs text-muted font-bold">Free Delivery Across India</span>
        </div>
      </header>

      <main className="flex-1 max-w-4xl mx-auto w-full p-4 sm:p-6 my-4">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
          <div className="md:col-span-7 bg-card rounded-3xl p-6 sm:p-8 border border-steel shadow-sm space-y-6">
            <h1 className="text-xl sm:text-2xl font-black text-ink font-heading">
              Delivery &amp; Payment
            </h1>

            <form onSubmit={handlePayClick} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-ink mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Priya Sharma"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full text-xs sm:text-sm px-4 py-2.5 rounded-xl border border-steel bg-paper"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-ink mb-1">Mobile Number</label>
                  <input
                    type="tel"
                    required
                    pattern="[0-9]{10}"
                    placeholder="9876543210"
                    value={formData.phone}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        phone: e.target.value.replace(/\D/g, "").slice(0, 10),
                      })
                    }
                    className="w-full text-xs sm:text-sm px-4 py-2.5 rounded-xl border border-steel bg-paper"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-ink mb-1">Email</label>
                  <input
                    type="email"
                    required
                    placeholder="priya@example.com"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full text-xs sm:text-sm px-4 py-2.5 rounded-xl border border-steel bg-paper"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-ink mb-1">6-Digit Pincode</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 560001"
                  value={formData.pincode}
                  onChange={handlePincodeChange}
                  className="w-full text-xs sm:text-sm px-4 py-2.5 rounded-xl border border-steel bg-paper"
                />
                {pincodeStatus === "deliverable" && (
                  <p className="text-xs text-leaf font-bold mt-1">✓ Delivery across India available</p>
                )}
                {pincodeStatus === "out_of_area" && (
                  <p className="text-xs text-mirch font-bold mt-1">✕ Please enter a valid Indian pincode</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-ink mb-1">Delivery Address</label>
                <textarea
                  required
                  rows={2}
                  placeholder="House / Flat / Block no., Street name, Area"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  className="w-full text-xs sm:text-sm px-4 py-2.5 rounded-xl border border-steel bg-paper"
                />
              </div>

              <div className="pt-2">
                <label className="block text-xs font-bold text-ink mb-2">Payment Option</label>
                <div className="space-y-2">
                  {[
                    { id: "upi", label: "UPI (Google Pay, PhonePe, Paytm, BHIM)" },
                    { id: "card", label: "Debit / Credit Card (Visa, Mastercard, RuPay)" },
                    { id: "cod", label: "Cash on Delivery" },
                  ].map((m) => (
                    <div
                      key={m.id}
                      onClick={() => setSelectedPaymentMethod(m.id as any)}
                      className={`p-3 rounded-xl border cursor-pointer flex justify-between items-center text-xs ${
                        selectedPaymentMethod === m.id
                          ? "border-leaf bg-leaf/10 font-bold"
                          : "border-steel bg-paper"
                      }`}
                    >
                      <span>{m.label}</span>
                      {selectedPaymentMethod === m.id && <span className="text-leaf">✓</span>}
                    </div>
                  ))}
                </div>
              </div>

              <button
                type="submit"
                disabled={pincodeStatus !== "deliverable" || formData.phone.length !== 10}
                className="w-full bg-haldi hover:bg-[#e2a80d] text-ink font-heading font-black text-sm py-3.5 rounded-xl shadow-lg transition disabled:opacity-40"
              >
                Pay {formatInr(cart.totalPrice)}
              </button>
            </form>
          </div>

          <div className="md:col-span-5 bg-card rounded-3xl p-6 border border-steel shadow-sm space-y-4 h-fit">
            <h2 className="font-heading font-bold text-base text-ink">Order Summary</h2>
            <div className="p-3 bg-paper rounded-2xl border border-steel space-y-2 text-xs">
              <div className="flex justify-between">
                <span>Items:</span>
                <span className="font-bold">{cart.quantity} {cart.quantity === 1 ? "tube" : "tubes"}</span>
              </div>
              <div className="flex justify-between">
                <span>Delivery:</span>
                <span className="font-bold text-leaf">FREE</span>
              </div>
              <div className="flex justify-between text-sm font-bold border-t border-steel pt-2">
                <span>Total:</span>
                <span className="font-heading font-black">{formatInr(cart.totalPrice)}</span>
              </div>
            </div>

            <div className="p-3.5 bg-leaf/10 border border-leaf/30 rounded-2xl text-xs space-y-1">
              <span className="font-heading font-extrabold text-leaf flex items-center space-x-1">
                <span>✓</span>
                <span>Empty-Tube Taste Guarantee</span>
              </span>
              <p className="text-[11px] text-muted leading-relaxed">
                If you don&apos;t love the fresh authentic taste and clean squeeze, message us on WhatsApp for a full 100% refund. Keep the tubes.
              </p>
            </div>
            <p className="text-[11px] text-muted text-center">
              100 g squeeze tube with flip-top cap · Free delivery across India
            </p>
          </div>
        </div>
      </main>

      <footer className="text-center py-6 text-xs text-muted border-t border-steel">
        <p>{storeConfig.brand.copyright}</p>
      </footer>
    </div>
  );
}
