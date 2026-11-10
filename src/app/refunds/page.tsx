import React from "react";
import Link from "next/link";
import { storeConfig } from "../../config/store";

export const metadata = {
  title: `Refunds & Cancellations | ${storeConfig?.brand?.name || "Chutney Tubes"}`,
  description: "Clear and honest refund and cancellation policy for Chutney Tubes.",
};

export default function RefundsPolicyPage() {
  const brand = storeConfig?.brand || {
    name: "Chutney Tubes",
    contactEmail: "hello@chutneytubes.in",
    copyright: "© 2026 Chutney Tubes",
  };

  const hasEmail = Boolean(brand.contactEmail && brand.contactEmail.trim().length > 0);

  return (
    <div className="min-h-screen bg-paper text-ink flex flex-col justify-between">
      <header className="bg-deepLeaf text-paper py-4 px-4 sm:px-8">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <Link href="/" className="flex items-center space-x-2">
            <span className="font-heading font-extrabold text-xl text-haldi">
              {brand.name}
            </span>
          </Link>
          <Link href="/" className="text-xs font-bold text-paper hover:text-haldi transition">
            Back to Shop
          </Link>
        </div>
      </header>

      <main className="max-w-3xl mx-auto w-full p-6 sm:p-10 my-8 bg-card rounded-3xl border border-steel shadow-sm space-y-6">
        <div>
          <span className="text-xs font-bold text-leaf uppercase tracking-wider font-heading">
            Customer Support
          </span>
          <h1 className="text-2xl sm:text-3xl font-heading font-black text-ink mt-1">
            Refunds &amp; Cancellations
          </h1>
          <p className="text-xs text-muted mt-1">
            Last updated: 2026
          </p>
        </div>

        <div className="space-y-4 text-sm text-ink leading-relaxed">
          <section className="space-y-2">
            <h2 className="text-base font-bold font-heading">1. Order Cancellations</h2>
            <p>
              You can cancel your order at any time before dispatch for a <strong>100% full refund</strong>.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-bold font-heading">2. Damaged or Incorrect Tubes</h2>
            <p>
              In the rare event that your package arrives damaged or with the wrong flavours, please report it within <strong>48 hours of delivery</strong>.
              {hasEmail && (
                <>
                  {" "}Write to us at{" "}
                  <a href={`mailto:${brand.contactEmail}`} className="text-leaf font-bold underline">
                    {brand.contactEmail}
                  </a>.
                </>
              )}
            </p>
            <p>
              We will immediately ship a replacement or process a full refund.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-bold font-heading">3. Returns of Opened Food Products</h2>
            <p>
              Due to food safety and hygiene regulations, opened food products and tubes cannot be returned for taste preference or change of mind.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-bold font-heading">4. Refund Processing Timeline</h2>
            <p>
              All approved refunds are credited back to the original payment source within <strong>5–7 working days</strong>.
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
