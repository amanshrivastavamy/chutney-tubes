import React from "react";
import Link from "next/link";
import storeConfig from "../../config/store";

export const metadata = {
  title: `Privacy Policy (DPDP Act) | ${storeConfig.brand.name}`,
  description: "Privacy policy complying with India's Digital Personal Data Protection Act 2023.",
};

export default function PrivacyPolicyPage() {
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
            Privacy &amp; Compliance
          </span>
          <h1 className="text-2xl sm:text-3xl font-heading font-black text-[#18241b] mt-1">
            Privacy Policy
          </h1>
          <p className="text-xs text-[#57534e] mt-1">
            Compliant with India&apos;s Digital Personal Data Protection (DPDP) Act, 2023 · Last updated: November 2026
          </p>
        </div>

        <div className="space-y-4 text-sm text-[#18241b] leading-relaxed">
          <section className="space-y-2">
            <h2 className="text-base font-bold font-heading">1. Data We Collect &amp; Purpose Limitation</h2>
            <p>
              We collect only the essential personal details needed to process orders and test consumer demand: <strong>Name, 10-digit mobile number, email address, delivery pincode, and street address</strong>.
            </p>
            <p className="bg-[#f2b81d]/15 p-3 rounded-xl text-xs text-[#18241b] border border-[#f2b81d]/40 font-medium">
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
              <a href={`mailto:${storeConfig.brand.contactEmail}`} className="text-[#1d6b3a] font-bold underline">
                {storeConfig.brand.contactEmail}
              </a>
              , and your records will be purged within 48 hours.
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
