import React from "react";
import Link from "next/link";
import productConfig from "../../config/product.config";

export const metadata = {
  title: `Privacy Policy (DPDP Act) | ${productConfig.brand.name}`,
  description: "Privacy policy complying with India's Digital Personal Data Protection Act 2023.",
};

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-[#FAF7F2] text-[#1C1917] flex flex-col justify-between">
      <header className="bg-white border-b border-[#E7E5E4] py-4 px-4 sm:px-8">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <Link href="/" className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-lg bg-[#C2410C] flex items-center justify-center text-white font-black text-sm">
              C
            </div>
            <span className="font-extrabold text-lg text-[#1C1917]">
              {productConfig.brand.name}
            </span>
          </Link>
          <Link href="/" className="text-xs font-bold text-[#C2410C] hover:underline">
            ← Return to Home
          </Link>
        </div>
      </header>

      <main className="max-w-3xl mx-auto w-full p-6 sm:p-10 my-8 bg-white rounded-3xl border border-[#E7E5E4] shadow-sm space-y-6">
        <div>
          <span className="text-xs font-bold text-[#C2410C] uppercase tracking-wider">
            Legal &amp; Compliance
          </span>
          <h1 className="text-2xl sm:text-3xl font-black text-[#1C1917] mt-1">
            Privacy Policy
          </h1>
          <p className="text-xs text-[#78716C] mt-1">
            Compliant with the Digital Personal Data Protection Act, 2023 (India) • Last updated: November 2026
          </p>
        </div>

        <div className="space-y-4 text-sm text-[#57534E] leading-relaxed">
          <section className="space-y-2">
            <h2 className="text-base font-extrabold text-[#1C1917]">1. Who We Are and Purpose of Processing</h2>
            <p>
              This website is operated by the creators of <strong>{productConfig.brand.name}</strong> as a pre-launch demand validation project. The primary purpose is to assess whether Indian office workers and consumers are interested in home-style chutney in a squeezable tube format before initiating commercial manufacturing.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-extrabold text-[#1C1917]">2. Data We Collect (Data Minimization)</h2>
            <p>We collect only the minimum personal data necessary for testing demand and communicating launch updates:</p>
            <ul className="list-disc pl-5 space-y-1 text-xs">
              <li><strong>Contact Information:</strong> Name, phone number (WhatsApp), email address.</li>
              <li><strong>Location Data:</strong> Pincode and general delivery address to evaluate city-level logistics viability.</li>
              <li><strong>Optional Feedback:</strong> Survey answers regarding usage frequency and product feedback.</li>
              <li><strong>Technical Metadata:</strong> Anonymous visitor identifier, browser interaction events (page view, scroll depth, flavour selections).</li>
            </ul>
            <p className="bg-[#FEF3C7] text-[#78350F] p-3 rounded-xl text-xs font-bold border border-[#FDE68A]">
              We DO NOT collect credit card numbers, CVVs, expiry dates, UPI PINs, or bank account credentials. No payments are processed on this website.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-extrabold text-[#1C1917]">3. Legal Basis and Purpose Limitation</h2>
            <p>
              In accordance with Section 6 of the DPDP Act 2023, personal data is processed based on your unambiguous consent. Your data will be used strictly for:
            </p>
            <ul className="list-disc pl-5 space-y-1 text-xs">
              <li>Evaluating consumer interest in individual flavours and price variants.</li>
              <li>Sending product launch announcements, sampling opportunities, and launch discounts (if opted-in).</li>
            </ul>
            <p>We do not sell, rent, or trade your personal data to third-party marketers or data brokers.</p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-extrabold text-[#1C1917]">4. Data Retention &amp; Security</h2>
            <p>
              Your contact details are stored securely. If we decide not to proceed with commercial production, all personal data collected during this validation test will be permanently deleted within 180 days.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-extrabold text-[#1C1917]">5. Your Rights as a Data Principal</h2>
            <p>Under the DPDP Act 2023, you have the right to:</p>
            <ul className="list-disc pl-5 space-y-1 text-xs">
              <li><strong>Access:</strong> Inquire about what personal data we hold about you.</li>
              <li><strong>Correction &amp; Erasure:</strong> Request immediate removal or correction of your email or phone number.</li>
              <li><strong>Withdraw Consent:</strong> Opt out of future launch messages at any point.</li>
            </ul>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-extrabold text-[#1C1917]">6. Grievance Officer &amp; Inquiries</h2>
            <p>
              To exercise any of your rights or request data erasure, email our Data Grievance Contact at:
            </p>
            <p className="font-bold text-[#C2410C]">
              <a href={`mailto:${productConfig.brand.contactEmail}`}>{productConfig.brand.contactEmail}</a>
            </p>
          </section>
        </div>
      </main>

      <footer className="py-6 text-center text-xs text-[#78716C] border-t border-[#E7E5E4]">
        <p>© {new Date().getFullYear()} {productConfig.brand.name}. All rights reserved.</p>
      </footer>
    </div>
  );
}
