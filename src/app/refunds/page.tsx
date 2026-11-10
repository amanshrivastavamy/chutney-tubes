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

  return (
    <div className="min-h-screen bg-[#f4f3ec] text-[#18241b] flex flex-col justify-between">
      <header className="bg-[#134a28] text-white py-4 px-4 sm:px-8">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <Link href="/" className="flex items-center space-x-2">
            <span className="font-heading font-extrabold text-xl text-[#f2b81d]">
              {brand.name}
            </span>
          </Link>
          <Link href="/" className="text-xs font-bold text-[#f4f3ec] hover:text-[#f2b81d] transition">
            ← Back to Shop
          </Link>
        </div>
      </header>

      <main className="max-w-3xl mx-auto w-full p-6 sm:p-10 my-8 bg-white rounded-3xl border border-[#d8dcd4] shadow-sm space-y-6">
        <div>
          <span className="text-xs font-bold text-[#1d6b3a] uppercase tracking-wider font-heading">
            Customer Guarantee
          </span>
          <h1 className="text-2xl sm:text-3xl font-heading font-black text-[#18241b] mt-1">
            Refunds &amp; Cancellations
          </h1>
          <p className="text-xs text-[#57534e] mt-1">
            Last updated: November 2026
          </p>
        </div>

        <div className="space-y-4 text-sm text-[#18241b] leading-relaxed">
          <section className="space-y-2">
            <h2 className="text-base font-bold font-heading">1. Order Cancellations</h2>
            <p>
              You can cancel your order at any time before dispatch for a <strong>100% full refund</strong>, no questions asked. Once an order is handed to the courier partner, it cannot be cancelled in transit.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-bold font-heading">2. Damaged, Leaking, or Incorrect Tubes</h2>
            <p>
              In the rare event that your package arrives damaged, leaking, or with the wrong flavours, please report it within <strong>48 hours of delivery</strong> with a photo sent to{" "}
              <a href={`mailto:${brand.contactEmail}`} className="text-[#1d6b3a] font-bold underline">
                {brand.contactEmail}
              </a>{" "}
              or via WhatsApp.
            </p>
            <p>
              We will immediately ship a free replacement or process a full refund, per your preference.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-bold font-heading">3. Returns of Opened Food Products</h2>
            <p>
              Due to food safety and hygiene regulations, opened food packages and tubes cannot be returned for taste preference or personal change of mind.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-bold font-heading">4. Refund Processing Timeline</h2>
            <p>
              All approved refunds are credited back to the original payment source within <strong>5–7 working days</strong>. For Cash on Delivery orders, refunds are processed via UPI or direct bank transfer.
            </p>
          </section>
        </div>
      </main>

      <footer className="py-6 text-center text-xs text-[#57534e] border-t border-[#d8dcd4]">
        <p>{brand.copyright}. All rights reserved.</p>
      </footer>
    </div>
  );
}
