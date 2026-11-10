import React from "react";
import Link from "next/link";
import storeConfig from "../../config/store";

export const metadata = {
  title: `Shipping Policy | ${storeConfig.brand.name}`,
  description: "Shipping and delivery policy for Chutney Tubes across India.",
};

export default function ShippingPolicyPage() {
  return (
    <div className="min-h-screen bg-[#f4f3ec] text-[#18241b] flex flex-col justify-between">
      <header className="bg-[#134a28] text-white py-4 px-4 sm:px-8">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <Link href="/" className="flex items-center space-x-2">
            <span className="font-heading font-extrabold text-xl text-[#f2b81d]">
              {storeConfig.brand.name}
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
            Delivery Information
          </span>
          <h1 className="text-2xl sm:text-3xl font-heading font-black text-[#18241b] mt-1">
            Shipping Policy
          </h1>
          <p className="text-xs text-[#57534e] mt-1">
            Last updated: November 2026
          </p>
        </div>

        <div className="space-y-4 text-sm text-[#18241b] leading-relaxed">
          <section className="space-y-2">
            <h2 className="text-base font-bold font-heading">1. Dispatch &amp; Delivery Timelines</h2>
            <p>
              Every order is packed and dispatched from our facility within <strong>1–2 working days</strong>.
            </p>
            <p>
              Once dispatched, standard delivery across India usually takes <strong>3–7 working days</strong>, depending on your delivery pincode and location zone. Metro cities typically arrive sooner.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-bold font-heading">2. Delivery Charges</h2>
            <p>
              Any applicable delivery charges will always be shown clearly in your cart summary before you confirm your order. We currently offer free shipping across India for our pilot launch batch.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-bold font-heading">3. Tracking Your Order</h2>
            <p>
              As soon as your package is dispatched, we send live tracking updates via SMS and email with courier AWB tracking links.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-bold font-heading">4. Questions &amp; Support</h2>
            <p>
              If your package is delayed or you have questions about pincode coverage, write to us at{" "}
              <a href={`mailto:${storeConfig.brand.contactEmail}`} className="text-[#1d6b3a] underline font-bold">
                {storeConfig.brand.contactEmail}
              </a>{" "}
              or message our WhatsApp care desk.
            </p>
          </section>
        </div>
      </main>

      <footer className="py-6 text-center text-xs text-[#57534e] border-t border-[#d8dcd4]">
        <p>{storeConfig.brand.copyright}. All rights reserved.</p>
      </footer>
    </div>
  );
}
