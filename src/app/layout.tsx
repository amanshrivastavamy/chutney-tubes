import "./globals.css";
import React from "react";
import { storeConfig } from "../config/store";

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

const rawSiteUrl = process.env.SITE_URL || "https://chutneytubes.in";
const siteUrl = rawSiteUrl.replace(/\/$/, "");
const ogImageUrl = `${siteUrl}/images/og-share.jpg`;

export const metadata = {
  metadataBase: new URL(siteUrl),
  title: "Chutney Tubes: Indian chutneys and sauces in squeeze tubes",
  description:
    "Ketchup, mayo, Schezwan, hari and imli chutney in no-spill squeeze tubes. ₹99 a tube, free delivery across India.",
  alternates: {
    canonical: siteUrl,
  },
  icons: {
    icon: "/favicon.svg",
  },
  openGraph: {
    title: "Chutney Tubes: Indian chutneys and sauces in squeeze tubes",
    description:
      "Ketchup, mayo, Schezwan, hari and imli chutney in no-spill squeeze tubes. ₹99 a tube, free delivery across India.",
    url: siteUrl,
    siteName: "Chutney Tubes",
    images: [
      {
        url: ogImageUrl,
        width: 1200,
        height: 630,
        alt: "Chutney Tubes: Indian chutneys and sauces in squeeze tubes",
      },
    ],
    locale: "en_IN",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Chutney Tubes: Indian chutneys and sauces in squeeze tubes",
    description:
      "Ketchup, mayo, Schezwan, hari and imli chutney in no-spill squeeze tubes. ₹99 a tube, free delivery across India.",
    images: [ogImageUrl],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="scroll-smooth overflow-x-clip">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,700;12..96,800&family=Hind:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-screen bg-paper text-ink antialiased selection:bg-haldi selection:text-ink overflow-x-clip">
        {children}
      </body>
    </html>
  );
}
