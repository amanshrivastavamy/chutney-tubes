import React from "react";
import Link from "next/link";
import storeConfig from "../../config/store";

export const metadata = {
  title: `Privacy Policy (DPDP Act) | ${storeConfig.brand.name}`,
  description: "Privacy policy complying with India's Digital Personal Data Protection Act 2023.",
};

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-paper text-ink flex flex-col justify-between">
      <header className="bg-deepLeaf text-paper py-4 px-4 sm:px-8">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <Link href="/" className="flex items-center space-x-2">
            <span className="font-heading font-extrabold text-xl text-haldi">
              {storeConfig.brand.name}
            </span>
          </Link>
          <Link href="/" className="text-xs font-bold text-paper hover:text-haldi transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-haldi active:translate-y-px">
            Back to Shop
          </Link>
        </div>
      </header>

      <main className="max-w-3xl mx-auto w-full p-6 sm:p-10 my-8 bg-card rounded-3xl border border-steel shadow-sm space-y-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-heading font-black text-ink mt-1">
            Privacy Policy
          </h1>
          <p className="text-xs text-muted mt-1">
            Compliant with India&apos;s Digital Personal Data Protection (DPDP) Act, 2023 · Last updated: November 2026
          </p>
        </div>

        <div className="space-y-4 text-sm text-ink leading-relaxed">
          <section className="space-y-2">
            <h2 className="text-base font-bold font-heading">1. Data We Collect &amp; Purpose Limitation</h2>
            <p>
              We collect only the essential personal details needed to process orders and test consumer demand: <strong>Name, 10-digit mobile number, email address, delivery pincode, and street address</strong>.
            </p>
            <p className="bg-paper p-3 rounded-xl text-xs text-ink border border-haldi font-medium">
              <strong>Zero Financial Data Collected:</strong> We never collect, store, or process credit card numbers, CVVs, expiry dates, or UPI PINs. No payment gateways are integrated, and no payments are deducted.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-bold font-heading">2. Launch Communications (Opt-in Only)</h2>
            <p>
              Launch announcements and early bird discounts are sent <strong>strictly with your explicit opt-in consent</strong>. We will never spam you or subscribe you to marketing broadcasts without your active permission.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-bold font-heading">3. No Selling of Data</h2>
            <p>
              We do not sell, rent, or trade your personal data to third-party marketers, advertisers, or data brokers.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-bold font-heading">4. How to Request Deletion (Your Rights as a Data Principal)</h2>
            <p>
              Under India&apos;s DPDP Act 2023, you have the absolute right to review, update, or request the immediate and complete deletion of your contact data from our records.
            </p>
            <p>
              Simply email our Data Grievance Contact at{" "}
              <a href={`mailto:${storeConfig.brand.contactEmail}`} className="text-leaf font-bold underline">
                {storeConfig.brand.contactEmail}
              </a>
              , and your records will be purged within 48 hours.
            </p>
          </section>
        </div>
      </main>

      <footer className="py-6 text-center text-xs text-muted border-t border-steel">
        <p>{storeConfig.brand.copyright} · Pre-launch demand study for Indian tiffin lunches</p>
      </footer>
    </div>
  );
}
