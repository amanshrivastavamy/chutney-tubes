"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import productConfig from "../../config/product.config";
import { trackEvent, resolveTrafficSource } from "../../lib/tracking";

export default function RevealPage() {
  const [optInDiscount, setOptInDiscount] = useState<boolean>(false);
  const [feedback, setFeedback] = useState<string>("");
  const [frequency, setFrequency] = useState<string>("");
  const [submitted, setSubmitted] = useState<boolean>(false);

  const [orderSummary, setOrderSummary] = useState<{
    pack?: string;
    flavour?: string;
    totalPrice?: number;
    email?: string;
    phone?: string;
  }>({});

  useEffect(() => {
    if (typeof window !== "undefined") {
      const stored = sessionStorage.getItem("ct_order_summary");
      if (stored) {
        try {
          setOrderSummary(JSON.parse(stored));
        } catch (e) {
          // ignore
        }
      }
    }
  }, []);

  const handleSurveySubmit = (e: React.FormEvent) => {
    e.preventDefault();

    trackEvent("survey_submitted", {
      optInDiscount,
      feedback: feedback.trim(),
      frequency,
      contact: orderSummary.email || orderSummary.phone || "",
      orderSummary,
      source: resolveTrafficSource(),
    });

    if (optInDiscount) {
      trackEvent("waitlist_optin", {
        email: orderSummary.email,
        phone: orderSummary.phone,
        discountOptIn: true,
      });
    }

    setSubmitted(true);
  };

  return (
    <div className="min-h-screen bg-[#FAF7F2] flex flex-col justify-between">
      {/* Header */}
      <header className="bg-white border-b border-[#E7E5E4] py-4 px-4 sm:px-8">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <Link href="/" className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-lg bg-[#C2410C] flex items-center justify-center text-white font-black text-sm">
              C
            </div>
            <span className="font-extrabold text-lg text-[#1C1917]">
              {productConfig.brand.name}
            </span>
          </Link>
          <span className="text-xs font-bold text-[#15803D] bg-[#DCFCE7] px-2.5 py-1 rounded-full">
            ● Demand Verification Complete
          </span>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-2xl mx-auto w-full p-4 sm:p-6 my-6">
        {/* Unmistakable Reassurance Box */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border-2 border-[#15803D] shadow-xl text-center space-y-4 relative overflow-hidden">
          {/* Green Top Indicator */}
          <div className="w-16 h-16 rounded-full bg-[#DCFCE7] text-[#15803D] flex items-center justify-center text-3xl mx-auto border-4 border-[#86EFAC]">
            ✓
          </div>

          <div className="space-y-1">
            <h1 className="text-2xl sm:text-3xl font-black text-[#1C1917] tracking-tight">
              You haven&apos;t been charged. We&apos;re not live yet!
            </h1>
            <p className="text-xs sm:text-sm font-bold text-[#15803D] uppercase tracking-wider">
              No money was deducted • No card details were collected
            </p>
          </div>

          <div className="text-sm text-[#57534E] leading-relaxed max-w-lg mx-auto bg-[#FAF7F2] p-4 rounded-2xl border border-[#E7E5E4]">
            <p>
              You&apos;re one of the first people who wanted this, and that helps us decide to launch!
            </p>
            <p className="mt-2 text-xs text-[#78716C]">
              We are a passionate team of home food lovers testing real purchase interest before investing in commercial food-grade tube filling machinery.
            </p>
          </div>

          {!submitted ? (
            /* Optional Survey & Launch-Day Discount */
            <form onSubmit={handleSurveySubmit} className="pt-4 text-left space-y-5 border-t border-[#E7E5E4]">
              {/* Launch Day Discount Single Opt-In (Unchecked by default) */}
              <div className="bg-[#FEF3C7] p-4 rounded-2xl border border-[#FDE68A]">
                <label className="flex items-start space-x-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={optInDiscount}
                    onChange={(e) => setOptInDiscount(e.target.checked)}
                    className="mt-0.5 w-5 h-5 rounded border-[#D97706] text-[#C2410C] focus:ring-[#C2410C]"
                  />
                  <div className="text-xs sm:text-sm">
                    <strong className="text-[#78350F] block">
                      Want an exclusive {productConfig.brand.surveyDiscountPercent}% launch-day discount?
                    </strong>
                    <span className="text-[#92400E] text-xs">
                      Check this box if you&apos;d like us to notify you via WhatsApp / email as soon as our first batch rolls out. (Optional, unchecked by default)
                    </span>
                  </div>
                </label>
              </div>

              {/* Feedback Question 1 */}
              <div>
                <label className="block text-xs font-bold text-[#1C1917] mb-1">
                  What almost stopped you from buying? <span className="font-normal text-[#78716C]">(Optional)</span>
                </label>
                <textarea
                  rows={2}
                  placeholder="e.g. Price, wanted to see ingredients first, flavour preference, wanted to check bottle size..."
                  value={feedback}
                  onChange={(e) => setFeedback(e.target.value)}
                  className="w-full text-xs sm:text-sm px-3.5 py-2.5 rounded-xl border border-[#D6D3D1] bg-[#FAF7F2] focus:bg-white focus:border-[#C2410C] transition"
                />
              </div>

              {/* Feedback Question 2 */}
              <div>
                <label className="block text-xs font-bold text-[#1C1917] mb-2">
                  How often would you use it? <span className="font-normal text-[#78716C]">(Optional)</span>
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {[
                    { id: "daily", label: "Daily (with tiffin / desk lunch)" },
                    { id: "few_times_a_week", label: "A few times a week" },
                    { id: "weekly", label: "Weekly (weekend snacks / chaat)" },
                    { id: "rarely", label: "Rarely / Travel only" },
                  ].map((item) => (
                    <label
                      key={item.id}
                      className={`flex items-center space-x-2.5 p-3 rounded-xl border text-xs cursor-pointer transition ${
                        frequency === item.id
                          ? "border-[#C2410C] bg-[#FFF7ED] font-bold text-[#C2410C]"
                          : "border-[#E7E5E4] bg-[#FAF7F2] text-[#57534E] hover:border-[#D6D3D1]"
                      }`}
                    >
                      <input
                        type="radio"
                        name="frequency"
                        value={item.id}
                        checked={frequency === item.id}
                        onChange={() => setFrequency(item.id)}
                        className="text-[#C2410C] focus:ring-[#C2410C]"
                      />
                      <span>{item.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Submit Feedback Button */}
              <button
                type="submit"
                className="w-full bg-[#1C1917] hover:bg-[#292524] text-white font-black text-sm py-3.5 rounded-2xl shadow transition"
              >
                Send Feedback &amp; Save Preference →
              </button>
            </form>
          ) : (
            /* Heartfelt Thank You Confirmation */
            <div className="pt-6 border-t border-[#E7E5E4] space-y-4 animate-fadeIn">
              <div className="p-4 bg-[#DCFCE7] rounded-2xl text-[#15803D] font-bold text-sm">
                🎉 Thank you! Your honest input directly shapes whether this product gets made.
              </div>
              <p className="text-xs text-[#57534E]">
                If we manufacture our first batch, you will be among the very first to know with VIP pricing.
              </p>
              <div className="pt-2">
                <Link
                  href="/"
                  className="inline-block text-xs font-bold text-[#C2410C] hover:underline"
                >
                  Return to Homepage
                </Link>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="text-center py-6 text-xs text-[#78716C] border-t border-[#E7E5E4]">
        <p>© {new Date().getFullYear()} {productConfig.brand.name}. Validation Experiment.</p>
      </footer>
    </div>
  );
}
