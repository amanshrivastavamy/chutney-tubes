"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { storeConfig } from "../../config/store";
import { trackEvent, resolveTrafficSource } from "../../lib/tracking";

export default function RevealPage() {
  const [optInDiscount, setOptInDiscount] = useState<boolean>(false);
  const [feedback, setFeedback] = useState<string>("");
  const [frequency, setFrequency] = useState<string>("");
  const [nextFlavourWanted, setNextFlavourWanted] = useState<string>("");
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
        } catch (e) {}
      }
    }
  }, []);

  const handleSurveySubmit = (e: React.FormEvent) => {
    e.preventDefault();

    trackEvent("survey_submitted", {
      optInDiscount,
      feedback: feedback.trim(),
      frequency,
      nextFlavourWanted,
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
      <header className="bg-card border-b border-steel py-4 px-4 sm:px-8">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <Link href="/" className="flex items-center space-x-2">
            <span className="font-extrabold text-lg text-ink font-heading">
              {storeConfig.brand.name}
            </span>
          </Link>
          <span className="text-xs font-bold text-leaf bg-paper px-2.5 py-1 rounded-full border border-steel">
            Interest Recorded
          </span>
        </div>
      </header>

      <main className="flex-1 max-w-2xl mx-auto w-full p-4 sm:p-6 my-6">
        <div className="bg-card rounded-3xl p-6 sm:p-8 border-2 border-leaf shadow-xl text-center space-y-4 relative overflow-hidden">
          <div className="w-16 h-16 rounded-full bg-paper text-leaf flex items-center justify-center text-2xl mx-auto border-4 border-steel font-black">
            ✓
          </div>

          <div className="space-y-1">
            <h1 className="text-2xl sm:text-3xl font-black text-ink font-heading">
              You haven&apos;t been charged.
            </h1>
            <p className="text-xs sm:text-sm font-semibold text-leaf">
              No money was deducted · No card details were collected
            </p>
          </div>

          <div className="text-sm text-muted leading-relaxed max-w-lg mx-auto bg-paper p-4 rounded-2xl border border-steel">
            <p>
              You&apos;re one of the first people who wanted this, and your interest helps us launch!
            </p>
            <p className="mt-2 text-xs text-muted">
              We are gauging real consumer demand across India for home-style chutneys and sauces in mess-free squeeze tubes.
            </p>
          </div>

          {!submitted ? (
            <form onSubmit={handleSurveySubmit} className="pt-4 text-left space-y-5 border-t border-steel">
              <div className="bg-paper p-4 rounded-2xl border border-steel">
                <label className="flex items-start space-x-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={optInDiscount}
                    onChange={(e) => setOptInDiscount(e.target.checked)}
                    className="mt-0.5 w-5 h-5 rounded border-steel text-leaf"
                  />
                  <div className="text-xs sm:text-sm">
                    <strong className="text-ink block font-bold">
                      Want an exclusive launch discount?
                    </strong>
                    <span className="text-muted text-xs">
                      Opt-in to get an early bird discount code sent to you when we launch.
                    </span>
                  </div>
                </label>
              </div>

              <div className="space-y-4">
                {/* NEW SURVEY QUESTION */}
                <div>
                  <label className="block text-xs font-bold text-ink mb-1">
                    Which would you want in a tube next?
                  </label>
                  <select
                    value={nextFlavourWanted}
                    onChange={(e) => setNextFlavourWanted(e.target.value)}
                    className="w-full text-xs sm:text-sm px-3.5 py-2.5 rounded-xl border border-steel bg-paper"
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
                    What almost stopped you from buying? <span className="font-normal text-muted">(Optional)</span>
                  </label>
                  <textarea
                    rows={2}
                    value={feedback}
                    onChange={(e) => setFeedback(e.target.value)}
                    placeholder="e.g. Wondered about shelf life, wanted a different pack, preferred smaller size..."
                    className="w-full text-xs sm:text-sm px-3.5 py-2.5 rounded-xl border border-steel bg-paper"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-ink mb-1">
                    How often would you use it? <span className="font-normal text-muted">(Optional)</span>
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                    {[
                      { id: "Daily", label: "Daily" },
                      { id: "A few times a week", label: "Few times a week" },
                      { id: "Weekly", label: "Weekly" },
                      { id: "Rarely", label: "Rarely" },
                    ].map((opt) => (
                      <label
                        key={opt.id}
                        className={`flex items-center space-x-2 p-2.5 rounded-xl border cursor-pointer transition-colors ${
                          frequency === opt.id
                            ? "border-leaf bg-paper font-bold text-leaf"
                            : "border-steel bg-paper text-ink"
                        }`}
                      >
                        <input
                          type="radio"
                          name="frequency"
                          value={opt.id}
                          checked={frequency === opt.id}
                          onChange={(e) => setFrequency(e.target.value)}
                          className="text-leaf"
                        />
                        <span>{opt.label}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>

              <button
                type="submit"
                className="w-full bg-leaf hover:bg-deepLeaf text-paper font-black text-sm py-3.5 rounded-xl shadow-md transition-colors flex items-center justify-center font-heading"
              >
                Save Preferences
              </button>
            </form>
          ) : (
            <div className="pt-6 border-t border-steel space-y-4">
              <div className="p-4 bg-paper rounded-2xl text-center space-y-1">
                <span className="text-xl text-leaf block font-bold">Thank You!</span>
                <p className="text-xs text-muted">
                  Your feedback has been recorded. We&apos;ll notify you when the first run is ready.
                </p>
              </div>

              <Link
                href="/"
                className="inline-block text-xs font-bold text-leaf hover:underline"
              >
                Return to Chutney Tubes homepage
              </Link>
            </div>
          )}
        </div>
      </main>

      <footer className="text-center py-6 text-xs text-muted border-t border-steel">
        <p>{storeConfig.brand.copyright}</p>
      </footer>
    </div>
  );
}
