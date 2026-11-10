# Chutney Tubes 🌶️ — Pre-Launch "Fake Door" Demand Test

A mobile-first landing page and mock checkout built for testing real consumer purchase intent for **Chutney Tubes** (home-style Indian chutney in a squeezable, toothpaste-style tube) before committing capital to manufacturing.

> **Validation Design:** The entire checkout and payment journey feels real, but **NO payment is processed and NO payment details (card numbers, CVV, or UPI PINs) are ever collected.** Upon clicking "Pay", visitors encounter an honest reveal screen thanking them for helping validate demand, with an optional 20% launch-day discount opt-in and qualitative feedback questionnaire.

---

## 📋 Table of Contents
1. [Core Features](#-core-features)
2. [Project Architecture](#-project-architecture)
3. [Running Locally](#-running-locally)
4. [How to Configure Brand, Prices, Flavours & Pincodes](#-how-to-configure-brand-prices-flavours--pincodes)
5. [A/B/C Price Testing & Traffic Source Tagging](#-abc-price-testing--traffic-source-tagging)
6. [Tracking & Firebase Firestore Setup](#-tracking--firebase-firestore-setup)
7. [How to Read the Admin Dashboard](#-how-to-read-the-admin-dashboard)
8. [Deployment Guide (Vercel & Firebase Hosting)](#-deployment-guide-vercel--firebase-hosting)
9. [Running the Test Suite](#-running-the-test-suite)
10. [Compliance & Privacy (India DPDP Act 2023)](#-compliance--privacy-india-dpdp-act-2023)

---

## 🌟 Core Features

- **Working Brand Config:** Renaming the product or tagline in `src/config/product.config.js` updates every page, header, and metadata tag instantly.
- **Flavours & Packs:** Configurable list with Tamarind (Imli), Garlic-Chilli, and Mint-Coriander with individual descriptions, pairings, and in-stock badges; single tube and 3-pack options with real-time total ₹ calculation.
- **Desk-Lunch Focus:** Clean messaging crafted for metro office workers eating lunch at their desk (and hostel students) with a comparison matrix vs glass jars, plastic sachets, and stainless steel dabbas.
- **Transparent FAQ:** Honest answers with explicit `[TBD]` markers for shelf-life, ingredients, and refrigeration pending food lab results.
- **Pincode Delivery Check:** Live lookup against metro launch cities (Bengaluru, Mumbai, Delhi NCR, Pune, Hyderabad, Chennai, Kolkata). Non-launch pincodes seamlessly trigger an area waitlist registration.
- **MOCK Payment Step:** Plain buttons for UPI, Card, and Cash on Delivery. Zero payment gateways, zero financial input fields, and no third-party branding (no Razorpay, Paytm, PhonePe, GPay, Blinkit, Zepto, or Swiggy logos).
- **Unmistakable Honest Reveal Screen:** Reassures users they were not charged, explains the demand experiment, offers an unchecked 20% discount opt-in, and asks:
  1. *"What almost stopped you from buying?"* (free text)
  2. *"How often would you use it?"* (Daily / A few times a week / Weekly / Rarely)
- **Protected Admin Dashboard:** Live funnel visualization with conversion %, A/B/C price variant breakdown, traffic source breakdown, qualitative feedback quotes, and CSV export.

---

## 🏗️ Project Architecture

```
chutney-tubes/
├── dev-server.js              # Zero-dependency local server runner (runs with node / agy-node)
├── firestore.rules            # Firestore security rules (public write-only, read-restricted)
├── firebase.json              # Firebase Hosting & Firestore deploy configuration
├── next.config.js             # Next.js configuration
├── tailwind.config.js         # Tailwind theme with warm Indian spice palette
├── postcss.config.js          # PostCSS configuration
├── tsconfig.json              # TypeScript configuration
├── package.json               # Scripts and dependencies
├── .env.example               # Template for Firebase credentials & admin password
├── .env.local                 # Local environment variables
│
├── public/
│   └── images/                # Clean SVG illustrations (hero, flavours, how-it-works)
│       ├── hero-tubes.svg
│       ├── flavour-tamarind.svg
│       ├── flavour-garlic.svg
│       ├── flavour-mint.svg
│       ├── step-1.svg
│       ├── step-2.svg
│       └── step-3.svg
│
├── src/
│   ├── config/
│   │   ├── product.config.js  # Master configuration (Brand, Theme, Prices, Flavours, Pincodes, FAQ)
│   │   └── index.ts           # TypeScript exports & helper methods
│   ├── lib/
│   │   ├── tracking.ts        # Client event logger & sticky variant/source resolver
│   │   ├── firebase.ts        # Resilient Firestore sync client
│   │   └── metrics.js         # Funnel conversion & analytics aggregation engine
│   └── app/
│       ├── layout.tsx         # Root HTML layout with Google Fonts
│       ├── page.tsx           # Long-scroll Landing Page
│       ├── globals.css        # Tailwind directives and accessible CSS variables
│       ├── checkout/
│       │   └── page.tsx       # Delivery info, live pincode check & mock payment buttons
│       ├── reveal/
│       │   └── page.tsx       # Unmistakable honest reveal & survey screen
│       ├── admin/
│       │   └── page.tsx       # Password-protected funnel dashboard & metrics
│       ├── privacy/
│       │   └── page.tsx       # India DPDP Act 2023 compliant Privacy Policy
│       ├── terms/
│       │   └── page.tsx       # Terms of Pre-launch Demand Validation
│       └── api/
│           ├── events/route.ts# Event ingestion endpoint
│           ├── admin/route.ts # Admin auth & metrics computation
│           └── export/route.ts# CSV export download route
│
├── tests/
│   ├── pricing.test.js        # A/B/C price variant & sticky assignment tests
│   ├── tracking.test.js       # Event logging & source resolution tests
│   ├── pincode.test.js        # Metro launch pincode validation tests
│   ├── funnel.test.js         # Conversion calculation & survey parsing tests
│   └── server.test.js         # Request/response integration tests
│
└── data/
    ├── events.json            # Local fallback event database
    └── waitlist.json          # Local fallback waitlist entries
```

---

## ⚡ Running Locally

### Option 1: Instant Standalone Server (Zero-Dependency)
You can run the full app locally immediately with Node.js or `agy-node`:

```bash
# Using standard node:
node dev-server.js

# Or using agy-node on Windows Antigravity:
agy-node dev-server.js
```
Open **[http://localhost:3000](http://localhost:3000)** in your browser.
- Landing Page: `http://localhost:3000`
- Mock Checkout: `http://localhost:3000/checkout`
- Reveal Screen: `http://localhost:3000/reveal`
- Admin Dashboard: `http://localhost:3000/admin` (Password: `chutney2026`)

### Option 2: Standard Next.js Development Server
```bash
# Install dependencies
npm install

# Run Next.js dev server
npm run dev
```

---

## ⚙️ How to Configure Brand, Prices, Flavours & Pincodes

All settings live in **`src/config/product.config.js`**. You can customize everything in this single file:

### 1. Renaming the Brand
```javascript
brand: {
  name: "Chutney Tubes",                       // Change to your chosen brand name
  tagline: "Home-style Indian chutney in a squeezable, mess-free tube.",
  contactEmail: "hello@chutneytubes.example.com",
  adminPassword: process.env.ADMIN_PASSWORD || "chutney2026",
}
```

### 2. Setting Prices (A/B/C Price Variants)
Edit `pricing.variants` in `src/config/product.config.js`:
```javascript
pricing: {
  variants: {
    A: { id: "A", label: "Introductory", singlePrice: 99,  threePackPrice: 249 },
    B: { id: "B", label: "Standard",     singlePrice: 149, threePackPrice: 349 },
    C: { id: "C", label: "Premium",      singlePrice: 199, threePackPrice: 449 },
  }
}
```

### 3. Adding or Updating Flavours
```javascript
flavours: [
  {
    id: "tamarind",
    name: "Tamarind (Imli)",
    shortDesc: "Tangy, sweet, and slow-simmered with jaggery and roasted cumin.",
    image: "/images/flavour-tamarind.svg",
    inStock: true,
    tag: "Tangy & Sweet",
    pairing: "Pairs with: Samosas, aloo parathas, dahi vada",
  },
  // Add new flavours by adding an object here!
]
```

### 4. Updating Deliverable Launch Pincodes
Add or remove 6-digit postal codes under `launchPincodes`:
```javascript
launchPincodes: [
  "560001", "560002", "560034", "560102", // Bengaluru
  "400001", "400050", "400051",           // Mumbai
  "110001", "110016", "122002",           // Delhi NCR
  // ...
]
```

---

## 🧪 A/B/C Price Testing & Traffic Source Tagging

### Random Sticky Assignment
When an anonymous visitor visits for the first time, they are randomly assigned Variant **A**, **B**, or **C**. This selection is saved in `localStorage['ct_price_variant']`, ensuring that visitor consistently sees the exact same price on the hero CTA, flavour picker, cart bar, and checkout screen.

### Forcing a Price Variant via URL
You can force any variant using the `?variant=` query parameter:
- **Variant A (₹99):** `http://localhost:3000/?variant=A`
- **Variant B (₹149):** `http://localhost:3000/?variant=B`
- **Variant C (₹199):** `http://localhost:3000/?variant=C`

### Traffic Source Tagging (`?src=`)
Tag links shared on social channels or office groups to measure channel conversion:
- **WhatsApp Share:** `https://yourdomain.com/?src=whatsapp`
- **Instagram Bio / Ad:** `https://yourdomain.com/?src=instagram`
- **Office Slack Channel:** `https://yourdomain.com/?src=office-slack`
- **Combined Test Link:** `https://yourdomain.com/?variant=B&src=whatsapp`

---

## 📊 Tracking & Firebase Firestore Setup

### 10 Mandatory Events Logged
1. `page_view` — Visitor landed on the page
2. `scroll_50` — Visitor scrolled through at least 50% of the landing page
3. `flavour_selected` — Visitor switched flavours or pack options
4. `add_to_cart` — Visitor clicked "Buy Now" or "Proceed to Checkout"
5. `checkout_started` — Visitor loaded the checkout form
6. `pincode_checked` — Pincode checked with `isDeliverable` status
7. `payment_method_selected` — Chosen method (`upi`, `card`, or `cod`)
8. `pay_clicked` — Visitor clicked "Pay ₹X" (true purchase intent confirmed)
9. `waitlist_optin` — Visitor joined waitlist from out-of-area pincode or opted into launch discount
10. `survey_submitted` — Qualitative feedback answers submitted

### Dual-Storage Architecture
- **Production Mode (Firebase Firestore):** When Firebase credentials are provided in `.env.local` or host environment variables, events stream directly to Firestore.
- **Local / Fallback Mode:** When running locally without Firebase, events are automatically stored in `data/events.json` and browser `localStorage`. Nothing crashes.

### Firebase Configuration
Create a project on the [Firebase Console](https://console.firebase.google.com/), enable Firestore Database, and add these environment variables to `.env.local`:

```env
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSy...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-app.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-app-id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-app-id.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789
NEXT_PUBLIC_FIREBASE_APP_ID=1:123456789:web:...
ADMIN_PASSWORD=chutney2026
```

### Firestore Security Rules (`firestore.rules`)
Deploy our pre-configured rules to ensure public write-only access (no scraping or reading):

```bash
firebase deploy --only firestore:rules
```

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /events/{eventId} {
      allow create: if request.resource.data.keys().hasAll(['event', 'timestamp', 'visitorId', 'variant', 'source'])
                    && request.resource.data.variant in ['A', 'B', 'C'];
      allow read, update, delete: if false; // Public CANNOT read
    }
    match /waitlist/{waitlistId} {
      allow create: if request.resource.data.keys().hasAny(['email', 'phone', 'pincode']);
      allow read, update, delete: if false;
    }
  }
}
```

---

## 📈 How to Read the Admin Dashboard

Visit **`/admin`** and log in with your admin password (default: `chutney2026`).

1. **Top KPI Cards:**
   - **Unique Visitors:** Total distinct people who landed on the page.
   - **Added to Cart:** Visitors who configured a pack/flavour and initiated order flow.
   - **Started Checkout:** Visitors who entered their delivery details.
   - **Pay Clicked 🔥:** Visitors who committed to purchase by clicking the payment button.
   - **Overall Conversion:** Percentage of landed visitors who reached the final payment click.
2. **Funnel Progression Bar:** Shows drop-off percentages between each step.
3. **Price Variant A/B/C Breakdown:** Compares conversion rate (%) and purchase intent at ₹99 vs ₹149 vs ₹199 to find your optimal pricing elasticity.
4. **Traffic Source Breakdown:** Shows which channel delivers the highest intent (e.g. WhatsApp vs Instagram).
5. **Flavour & Pack Popularity:** Identifies your runaway bestselling flavour and whether buyers prefer singles or 3-packs.
6. **Voice of Customer:** Real qualitative answers to *"What almost stopped you from buying?"* directly surfacing product objections (pricing, sizing, taste doubts, etc.).
7. **Export to CSV:** Click **"Export CSV"** to download all records into Excel / Google Sheets.

---

## 🚀 Deployment Guide

### Deploying to Vercel (Recommended)
1. Push this repository to GitHub.
2. Import the project on [Vercel](https://vercel.com/new).
3. Under **Environment Variables**, set:
   - `ADMIN_PASSWORD`: Your secret admin password
   - (Optional) `NEXT_PUBLIC_FIREBASE_*`: Your Firebase project credentials
4. Click **Deploy**.

### Deploying to Firebase Hosting
```bash
# 1. Log in to Firebase CLI
firebase login

# 2. Build static output
npm run build

# 3. Deploy hosting & rules
firebase deploy
```

---

## 🧪 Running the Test Suite

Run the complete test suite verifying price-variant assignment, event logging, pincode validation, metrics, and server routing:

```bash
# Using standard node:
npm test

# Or with agy-node:
agy-node --test tests/*.test.js
```

All 16 unit tests verify:
- Accurate 3-tier A/B/C price variant resolution & URL overrides
- Validation of all 10 required demand test events
- Pincode delivery checking (metro vs out-of-area)
- Funnel metrics, conversion percentage, and CSV generation
- Mock server endpoint routing without socket overhead

---

## 🛡️ Compliance & Privacy (India DPDP Act 2023)

- **Notice & Plain Language:** The form includes a clear consent notice stating data is collected solely for product launch announcements.
- **No Financial Data:** Card numbers, CVVs, and UPI credentials are never requested or stored.
- **DPDP Act Compliant Privacy Policy:** Available at `/privacy` detailing data minimization, retention, purpose limitation, and Data Principal rights to data erasure upon email.
- **No Deceptive Marketing:** Zero fake reviews, invented customer counts, fake countdown timers, or unverified health claims. All pending specifications are transparently labeled `[TBD]`.
