import React from "react";
import Link from "next/link";
import { storeConfig } from "../../config/store";

export const metadata = {
  title: `Terms of Service | ${storeConfig?.brand?.name || "Chutney Tubes"}`,
  description: "Terms of service for Chutney Tubes.",
};

export default function TermsPolicyPage() {
  const brand = storeConfig?.brand || {
    name: "Chutney Tubes",
    contactEmail: "hello@chutneytubes.in",
    copyright: "© 2026 Chutney Tubes",
  };

  return (
    <div className="min-h-screen bg-paper text-ink flex flex-col justify-between">
      <header className="bg-deepLeaf text-paper py-4 px-4 sm:px-8">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <Link href="/" className="flex items-center space-x-2">
            <span className="font-heading font-extrabold text-xl text-haldi">
              {brand.name}
            </span>
          </Link>
          <Link href="/" className="text-xs font-bold text-paper hover:text-haldi transition-colors">
            Back to Shop
          </Link>
        </div>
      </header>

      <main className="max-w-3xl mx-auto w-full p-6 sm:p-10 my-8 bg-card rounded-3xl border border-steel shadow-sm space-y-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-heading font-black text-ink mt-1">
            Terms of Service
          </h1>
          <p className="text-xs text-muted mt-1">
            Last updated: 2026
          </p>
        </div>

        <div className="space-y-4 text-sm text-ink leading-relaxed">
          <section className="space-y-2">
            <h2 className="text-base font-bold font-heading">1. Pricing &amp; Currency</h2>
            <p>
              All prices shown on this site are in <strong>Indian Rupees (INR)</strong> and are inclusive of all applicable taxes.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-bold font-heading">2. Packaging &amp; Product Imagery</h2>
            <p>
              Product renders and packaging images displayed on this site are illustrative visual representations designed for consumer interest evaluation.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-bold font-heading">3. Spice Levels &amp; Taste Guide</h2>
            <p>
              Our spice ratings (Mild 1, Medium 2, Hot 3) serve as a culinary guide based on traditional recipes. Individual tolerance to spices may vary.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-bold font-heading">4. Food Allergens &amp; Ingredients</h2>
            <p>
              Please check the ingredient list for common food allergens before consumption once physical packs are received.
            </p>
          </section>
        </div>
      </main>

      <footer className="py-6 text-center text-xs text-muted border-t border-steel">
        <p>{brand.copyright}</p>
      </footer>
    </div>
  );
}
