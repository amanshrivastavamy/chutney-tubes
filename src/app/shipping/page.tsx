import React from "react";
import Link from "next/link";
import { storeConfig } from "../../config/store";

export const metadata = {
  title: `Shipping Policy | ${storeConfig?.brand?.name || "Chutney Tubes"}`,
  description: "Shipping and delivery policy for Chutney Tubes across India.",
};

export default function ShippingPolicyPage() {
  const brand = storeConfig?.brand || {
    name: "Chutney Tubes",
    contactEmail: "hello@chutneytubes.in",
    copyright: "© 2026 Chutney Tubes",
  };

  const hasEmail = Boolean(brand.contactEmail && brand.contactEmail.trim().length > 0);
  const hasWhatsApp = Boolean(brand.whatsAppNumber && brand.whatsAppNumber.trim().length > 0);

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
            Delivery Information
          </span>
          <h1 className="text-2xl sm:text-3xl font-heading font-black text-ink mt-1">
            Shipping Policy
          </h1>
          <p className="text-xs text-muted mt-1">
            Last updated: 2026
          </p>
        </div>

        <div className="space-y-4 text-sm text-ink leading-relaxed">
          <section className="space-y-2">
            <h2 className="text-base font-bold font-heading">1. Dispatch &amp; Delivery Timelines</h2>
            <p>
              Every order is packed and dispatched from our facility within <strong>1–2 working days</strong>.
            </p>
            <p>
              Once dispatched, standard delivery across India usually takes <strong>3–7 working days</strong>, depending on your delivery pincode.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-bold font-heading">2. Delivery Charges</h2>
            <p>
              We provide free delivery across India on all orders.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-bold font-heading">3. Tracking Your Order</h2>
            <p>
              As soon as your package is dispatched, we send live tracking updates via SMS and email with courier tracking links.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-bold font-heading">4. Questions &amp; Support</h2>
            <p>
              If your package is delayed or you have questions about pincode coverage, write to us at{" "}
              {hasEmail && (
                <a href={`mailto:${brand.contactEmail}`} className="text-leaf underline font-bold">
                  {brand.contactEmail}
                </a>
              )}
              {hasWhatsApp && (
                <span>
                  {" "}or message us on{" "}
                  <a href={`https://wa.me/${brand.whatsAppNumber}`} className="text-leaf underline font-bold">
                    WhatsApp
                  </a>.
                </span>
              )}
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
