import "./globals.css";
import React from "react";
import { storeConfig } from "../config/store";

export const metadata = {
  title: "Chutney Tubes: your favourite chutney, now in a tube",
  description: "Hari, imli, schezwan, momo and more, in a squeezable tube. No spoon, no sticky jar, no spill. Everyday favourites delivered across India.",
  viewport: "width=device-width, initial-scale=1, maximum-scale=5",
  icons: {
    icon: "/favicon.svg",
  },
  openGraph: {
    title: "Chutney Tubes: your favourite chutney, now in a tube",
    description: "Hari, imli, schezwan, momo and more, in a squeezable tube. 100% vegetarian everyday chutneys.",
    url: "https://chutneytubes.in",
    siteName: "Chutney Tubes",
    images: [
      {
        url: "/images/og-share.svg",
        width: 1200,
        height: 630,
        alt: "Chutney Tubes - Squeezable Indian Chutneys",
      },
    ],
    locale: "en_IN",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Chutney Tubes: your favourite chutney, now in a tube",
    description: "Hari, imli, schezwan, momo and more, in a squeezable tube.",
    images: ["/images/og-share.svg"],
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
