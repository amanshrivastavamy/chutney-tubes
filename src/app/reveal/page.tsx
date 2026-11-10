"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import storeConfig from "../../config/store";
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
    <div className="min-h-screen bg-paper flex flex-col justify-between text-ink">
      {/* Header */}
      <header className="bg-card border-b border-steel py-4 px-4 sm:px-8">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <Link href="/" className="flex items-center space-x-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink active:translate-y-px">
            <div className="w-8 h-8 rounded-lg bg-leaf flex items-center justify-center text-paper font-black text-sm">
              C
            </div>
            <span className="font-extrabold text-lg text-ink font-heading">
              {storeConfig.brand.name}
            </span>
          </Link>
          <span className="text-xs font-bold text-leaf bg-paper-2 px-2.5 py-1 rounded-full">
            Demand Verification Complete
          </span>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-2xl mx-auto w-full p-4 sm:p-6 my-6">
        {/* Unmistakable Reassurance Box */}
        <div className="bg-card rounded-3xl p-6 sm:p-8 border-2 border-leaf shadow-xl text-center space-y-4 relative overflow-hidden">
          {/* Green Top Indicator */}
          <div className="w-16 h-16 rounded-full bg-paper-2 text-leaf flex items-center justify-center text-2xl mx-auto border-4 border-steel">
            ✓
          </div>

          <div className="space-y-1">
            <h1 className="text-2xl sm:text-3xl font-black text-ink font-heading">
              You haven&apos;t been charged. Not yet.
            </h1>
            <p className="text-xs sm:text-sm font-semibold text-leaf">
              No money was deducted · No card details were collected
            </p>
          </div>

          <div className="text-sm text-muted leading-relaxed max-w-lg mx-auto bg-paper p-4 rounded-2xl border border-steel">
            <p>
              You&apos;re one of the first people who wanted this, and that helps us decide to launch!
            </p>
            <p className="mt-2 text-xs text-muted">
              We are a passionate food team testing real purchase interest before investing in commercial food-grade tube filling machinery.
            </p>
          </div>

          {!submitted ? (
            /* Optional Survey & Launch-Day Discount */
            <form onSubmit={handleSurveySubmit} className="pt-4 text-left space-y-5 border-t border-steel">
              {/* Launch Day Discount Single Opt-In (Unchecked by default) */}
              <div className="bg-paper-2 p-4 rounded-2xl border border-steel">
                <label className="flex items-start space-x-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={optInDiscount}
                    onChange={(e) => setOptInDiscount(e.target.checked)}
                    className="mt-0.5 w-5 h-5 rounded border-steel text-leaf focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink"
                  />
                  <div className="text-xs sm:text-sm">
                    <strong className="text-ink block font-bold">
                      Want an exclusive launch-day discount?
                    </strong>
                    <span className="text-muted text-xs">
                      Opt-in to get an early bird discount coupon sent to your WhatsApp or email when we launch.
                    </span>
                  </div>
                </label>
              </div>

              {/* Quick Demand Survey (Optional) */}
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-ink mb-1">
                    What almost stopped you from buying? <span className="font-normal text-muted">(Optional)</span>
                  </label>
                  <textarea
                    rows={2}
                    value={feedback}
                    onChange={(e) => setFeedback(e.target.value)}
                    placeholder="e.g. Wondered about shelf life, wanted a different pack size, preferred smaller quantity..."
                    className="w-full text-xs sm:text-sm px-3.5 py-2.5 rounded-xl border border-steel bg-paper focus:bg-card focus:border-leaf focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-ink mb-1">
                    How often would you use chutney in a tube? <span className="font-normal text-muted">(Optional)</span>
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                    {[
                      { id: "daily", label: "Daily" },
                      { id: "few_times_week", label: "Few times a week" },
                      { id: "weekly", label: "Weekly" },
                      { id: "rarely", label: "Rarely" },
                    ].map((opt) => (
                      <label
                        key={opt.id}
                        className={`flex items-center space-x-2 p-2.5 rounded-xl border cursor-pointer transition-colors ${
                          frequency === opt.id
                            ? "border-leaf bg-paper-2 font-bold text-leaf"
                            : "border-steel bg-paper hover:bg-paper-2 text-ink"
                        }`}
                      >
                        <input
                          type="radio"
                          name="frequency"
                          value={opt.id}
                          checked={frequency === opt.id}
                          onChange={(e) => setFrequency(e.target.value)}
                          className="text-leaf focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink"
                        />
                        <span>{opt.label}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>

              {/* Submit Feedback */}
              <button
                type="submit"
                className="w-full bg-leaf hover:bg-deepLeaf text-paper font-black text-sm py-3.5 rounded-xl shadow-md transition-colors flex items-center justify-center font-heading whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink active:translate-y-px disabled:opacity-50"
              >
                Save Preferences
              </button>
            </form>
          ) : (
            /* Submission Success State */
            <div className="pt-6 border-t border-steel space-y-4">
              <div className="p-4 bg-paper-2 rounded-2xl text-center space-y-1">
                <span className="text-xl text-leaf block font-bold">Thank You!</span>
                <p className="text-xs text-muted">
                  Your feedback and contact preferences have been securely logged. We&apos;ll keep you posted as pilot batches enter production.
                </p>
              </div>

              <Link
                href="/"
                className="inline-block text-xs font-bold text-leaf hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink active:translate-y-px"
              >
                Return to Chutney Tubes homepage
              </Link>
            </div>
          )}
        </div>
      </main>

      <footer className="text-center py-6 text-xs text-muted border-t border-steel">
        <p>{storeConfig.brand.copyright} · Genuine pre-launch demand validation</p>
      </footer>
    </div>
  );
}
