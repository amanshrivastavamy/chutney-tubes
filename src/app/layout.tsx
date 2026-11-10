import "./globals.css";
import React from "react";
import productConfig from "../config/product.config";

export const metadata = {
  title: `${productConfig.brand.name} | Desk-Lunch Chutney with Zero Mess`,
  description: productConfig.brand.tagline,
  viewport: "width=device-width, initial-scale=1, maximum-scale=5",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="scroll-smooth">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800&family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-screen bg-[#FAF7F2] text-[#1C1917] antialiased selection:bg-[#FDE68A] selection:text-[#78350F]">
        {children}
      </body>
    </html>
  );
}
