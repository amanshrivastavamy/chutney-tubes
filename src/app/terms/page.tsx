import React from "react";
import Link from "next/link";
import productConfig from "../../config/product.config";

export const metadata = {
  title: `Terms of Pre-Launch Validation | ${productConfig.brand.name}`,
  description: "Terms governing the fake door demand test for Chutney Tubes.",
};

export default function TermsPage() {
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
            Consumer Information
          </span>
          <h1 className="text-2xl sm:text-3xl font-black text-[#1C1917] mt-1">
            Terms of Pre-Launch Demand Testing
          </h1>
          <p className="text-xs text-[#78716C] mt-1">
            Last updated: November 2026
          </p>
        </div>

        <div className="space-y-4 text-sm text-[#57534E] leading-relaxed">
          <section className="space-y-2">
            <h2 className="text-base font-extrabold text-[#1C1917]">1. Non-Commercial Nature of this Website</h2>
            <p>
              This website is an early-stage consumer demand experiment (&ldquo;fake door test&rdquo;) designed solely to measure purchasing intent for <strong>{productConfig.brand.name}</strong>.
            </p>
            <p>
              No sale of goods, financial transaction, contract for supply, or binding commercial agreement is completed on this site.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-extrabold text-[#1C1917]">2. No Payment Collection</h2>
            <p>
              At no point are visitors required, prompted, or able to submit payment credentials. The checkout and payment steps are simulated mock interfaces designed to quantify customer interest without taking payments.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-extrabold text-[#1C1917]">3. Product Specifications and Timelines</h2>
            <p>
              All product imagery, representations, packaging mockups, shelf-life estimates, and ingredient listings marked with <strong>[TBD]</strong> represent planned specifications currently subject to food technology testing, shelf stability assays, and regulatory certifications.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-extrabold text-[#1C1917]">4. Early Access &amp; Launch Discount</h2>
            <p>
              Registering an order preference or opting into the discount list grants priority access to order from the first commercial production batch should the product proceed to manufacturing. It does not guarantee delivery dates or impose any obligation to purchase.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-extrabold text-[#1C1917]">5. Inquiries</h2>
            <p>
              For questions regarding this study or product development, please reach out to:{" "}
              <a href={`mailto:${productConfig.brand.contactEmail}`} className="text-[#C2410C] font-bold underline">
                {productConfig.brand.contactEmail}
              </a>
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
