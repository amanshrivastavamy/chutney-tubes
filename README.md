# Chutney Tubes 🌶️ — Pre-Launch "Fake Door" Demand Test

A mobile-first landing page and mock checkout built for testing real consumer purchase intent for **Chutney Tubes** (everyday Indian chutneys in squeezable, toothpaste-style tubes) before committing capital to manufacturing and inventory.

> **Demand Test Validation Design:** The entire checkout journey feels 100% authentic all the way to the "Pay" button. However, **NO payment is processed and NO payment details (card numbers, CVV, or UPI PINs) are ever collected.** Upon clicking "Pay", visitors encounter an unmistakable, honest reveal screen explaining the pre-launch validation, offering an optional launch-day discount opt-in, and asking short qualitative questions.

---

## 📋 Table of Contents
1. [Quick Start (For Non-Tech Users)](#-quick-start-for-non-tech-users)
2. [Single-File Configuration (`src/config/store.ts`)](#-single-file-configuration)
3. [How to Add Real Product Photos](#-how-to-add-real-product-photos)
4. [A/B/C Price Testing & Ad Source Tagging](#-abc-price-testing--ad-source-tagging)
5. [Tracking & Firebase Setup](#-tracking--firebase-setup)
6. [How to Read the Admin Dashboard](#-how-to-read-the-admin-dashboard)
7. [Deployment Guide (Vercel & Firebase Hosting)](#-deployment-guide)
8. [Connecting Your Own Custom Domain](#-connecting-your-own-custom-domain)
9. [Automated Test Suite](#-automated-test-suite)
10. [Ethics & Privacy Compliance (India DPDP Act 2023)](#-ethics--privacy-compliance)

---

## ⚡ Quick Start (For Non-Tech Users)

You do **not** need to be a developer to run this project on your Windows PC!

### Method 1: The 1-Click Desktop Launcher
1. Double-click the file named:
   ```
   START_CHUTNEY_TUBES.bat
   ```
2. A terminal window will open, automatically start the server, and open your browser to:
   ```
   http://localhost:3000
   ```
3. To stop the server, just close the terminal window or press `Ctrl + C`.

### Method 2: Command Line
Open PowerShell or Command Prompt in the project folder and run:
```powershell
# Using the bundled agy-node runtime:
agy-node dev-server.js

# Or using standard node:
npm run serve
```
Then open [http://localhost:3000](http://localhost:3000) in your browser.

---

## ⚙️ Single-File Configuration

**Rule:** You never need to touch React components or code. **Everything** is controlled in one master configuration file:
- **`src/config/store.ts`** (TypeScript source for Next.js)
- **`src/config/store.js`** (CommonJS mirror for dev-server & tests)

### 1. Change Brand Name, WhatsApp Number & Copy
Open `src/config/store.ts` and modify the `brand` object:
```typescript
brand: {
  name: "Chutney Tubes",
  tagline: "The chutney you love. Squeeze, eat, done.",
  subheadline: "Everyday Indian chutneys in squeezable tubes. Made in India.",
  netWeight: "100 g",
  diet: "100% Vegetarian",
  whatsAppNumber: "919876543210", // Your 10-digit phone with country code (no + or spaces)
  contactEmail: "hello@chutneytubes.in",
  surveyDiscountPercent: 20,
}
```

### 2. Configure A/B/C Price Tiers
```typescript
pricing: {
  defaultVariant: "a",
  variants: {
    a: { id: "a", label: "Variant A (₹99)", single: 99, combo: 179, pick3: 269 },
    b: { id: "b", label: "Variant B (₹149)", single: 149, combo: 279, pick3: 399 },
    c: { id: "c", label: "Variant C (₹199)", single: 199, combo: 369, pick3: 529 },
  },
}
```
- Each visitor is randomly assigned to tier `a`, `b`, or `c` on their first visit.
- Their price is saved in `localStorage` and a cookie so they see the exact same price throughout their entire visit.

### 3. Add or Edit Flavours (12 Everyday Indian Favourites)
Each flavour has:
- `id`: unique url-safe id (e.g., `green`, `imli`, `thecha`)
- `name`: English display name
- `local`: Short descriptive local name
- `hindi`: Devanagari Hindi name
- `spice`: Spice indicator (`1` Mild, `2` Medium, `3` Hot)
- `color`: Hex color of the tube body (e.g., `#2f8f46`)
- `desc`: One-line appetising description
- `goesWith`: Food pairing suggestions
- `icons`: Array of 2 ingredient icon names (`leaf`, `chilli`, `greenchilli`, `garlic`, `tamarind`, `coconut`, `peanut`, `tomato`, `mango`, `mustard`)

```typescript
{
  id: "thecha",
  name: "Chilli-Peanut Thecha",
  local: "Kolhapuri Thecha",
  hindi: "मिरची ठेचा",
  spice: 3,
  color: "#3b5c2a",
  desc: "Crushed green chillies, garlic and roasted peanuts. Coarse and spicy.",
  goesWith: "Bhakri, paratha, dal-rice, vada pav",
  icons: ["greenchilli", "peanut"],
}
```

### 4. Postal Delivery Zones
India Post divides PIN codes by their first digit (1 through 8). Delivery is active nationwide across all 8 zones:
- `1`: Northern (Delhi, Haryana, Punjab, HP, J&K)
- `2`: Northern (Uttar Pradesh, Uttarakhand)
- `3`: Western (Rajasthan, Gujarat)
- `4`: Western (Maharashtra, MP, Chhattisgarh, Goa)
- `5`: Southern (Andhra, Telangana, Karnataka)
- `6`: Southern (Tamil Nadu, Kerala)
- `7`: Eastern (West Bengal, Odisha, Northeast)
- `8`: Eastern (Bihar, Jharkhand)

---

## 📸 How to Add Real Product Photos

The website renders high-quality **vector SVG renders** by default (with realistic matte cylindrical shading, zigzag crimped ends, toran border, brand sticker, Hindi text, vegetarian symbol, net weight, flip-cap, and stainless steel katori bowl).

When you receive physical product samples or professional studio photography:
1. Save your photograph as a JPG image.
2. Name the file with the flavour's `id` (e.g., `green.jpg`, `imli.jpg`, `thecha.jpg`).
3. Place it in the folder:
   ```
   public/products/{id}.jpg
   ```
4. That's it! The website automatically detects the file and replaces the SVG render with your real product photograph.

---

## 🎯 A/B/C Price Testing & Ad Source Tagging

### Forcing a Price Tier (For Testing)
Add `?variant=a`, `?variant=b`, or `?variant=c` to any URL:
- `https://yourdomain.com/?variant=a` — Forces Single ₹99 / 3-Pack ₹269
- `https://yourdomain.com/?variant=b` — Forces Single ₹149 / 3-Pack ₹399
- `https://yourdomain.com/?variant=c` — Forces Single ₹199 / 3-Pack ₹529

### Tagging Ad Campaigns & Social Sources
When posting ads or links, append standard `utm_source` or `src` parameters:
- **Instagram Ad:** `https://yourdomain.com/?src=instagram&utm_campaign=diwali_tiffin`
- **WhatsApp Broadcast:** `https://yourdomain.com/?src=whatsapp`
- **Office Slack Channel:** `https://yourdomain.com/?src=office-slack`
- **Testing Tier B on Instagram:** `https://yourdomain.com/?variant=b&src=instagram`

### Excluding Your Own Visits from Analytics
Add `?admin=1` to your URL when browsing:
```
https://yourdomain.com/?admin=1
```
This sets an internal cookie. Your test clicks and orders will **not** distort your production conversion funnel.

---

## 📊 Tracking & Firebase Setup

### Events Logged
The application logs key funnel milestones:
1. `page_view` — Page opened
2. `scroll_50` — Scrolled past 50%
3. `spice_filter_used` — Used Mild/Medium/Hot filters
4. `product_viewed` — Clicked into a flavour tile
5. `add_to_cart` — Added single, combo, or sampler pack
6. `checkout_started` — Began delivery form
7. `details_submitted` — Pincode and address confirmed
8. `payment_method_selected` — Selected UPI, Card, or COD
9. `pay_clicked` — Final purchase intent confirmed (Pay button pressed)
10. `survey_submitted` — Feedback and tube sentiment submitted
11. `launch_optin` — Email/WhatsApp discount opt-in
12. `chutney_requested` — User submitted a regional chutney suggestion

### Dual-Storage Mode
- **Local Mode (Default):** Without any Firebase credentials, events are saved locally to `data/events.json`, `data/signups.json`, and `data/requests.json`.
- **Cloud Mode (Firestore):** For production, add Firebase credentials to `.env.local`:

```env
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSy...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=chutney-tubes.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=chutney-tubes
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=chutney-tubes.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789
NEXT_PUBLIC_FIREBASE_APP_ID=1:123456789:web:abcdef
ADMIN_PASSWORD=chutney2026
```

### Firestore Security Rules
Deploy `firestore.rules` using the Firebase CLI:
```bash
firebase deploy --only firestore:rules
```
The rules guarantee that the public internet can only write anonymous events and waitlist signups, and can **never** read or scrape records.

---

## 📈 How to Read the Admin Dashboard

Visit **`/admin`** on your domain or local server:
```
http://localhost:3000/admin
```
Enter your admin password (default: `chutney2026`).

### Key Dashboard Metrics:
1. **Core Funnel Progression:**
   - **Visitors:** Total distinct people who landed on the page.
   - **Added to Cart:** Visitors who selected flavours and packs.
   - **Started Checkout:** Visitors who entered their delivery area.
   - **Pay Clicked:** True purchase intent! People who clicked "Pay ₹X".
   - Shows the exact **drop-off %** between each step.
2. **A/B/C Pricing Elasticity Table:**
   - Compares conversion rate (%) and Average Order Value (AOV) across ₹99, ₹149, and ₹199.
   - Highlights your most profitable price point.
3. **Flavour Demand Ranking:**
   - Ranks all 12 flavours by tubes ordered in paid flows vs browsing views.
   - Tells you exactly which 3 flavours to manufacture first!
4. **Pack Mix:**
   - Ratio between Single Tubes, Chaat Combo (3-Pack), and Custom Pick-3 Samplers.
5. **Geographical Demand by Postal Zone:**
   - Shows where demand is coming from across India (Zone 1 through 8).
6. **Consumer Sentiment & Objections:**
   - Tube feeling split (Pay-pressers vs Everyone).
   - Verbatim answers to *"What almost stopped you from buying?"*.
7. **1-Click CSV Export:**
   - Click **"Export CSV"** to download all records into Excel or Google Sheets.

---

## 🚀 Deployment Guide

### Option A: Deploy to Vercel (Recommended — Simplest for Non-Tech Users)
1. Create a free account at [vercel.com](https://vercel.com).
2. Connect your GitHub account.
3. Push this project to a GitHub repository:
   ```bash
   git add .
   git commit -m "Production ready Chutney Tubes release"
   git push origin main
   ```
4. On Vercel, click **"Add New Project"** and select your `chutney-tubes` repository.
5. In **Environment Variables**, add:
   - `ADMIN_PASSWORD` = `your_secure_password`
   - (Optional) `NEXT_PUBLIC_FIREBASE_*` keys if using Firestore
6. Click **Deploy**. Your site will be live in ~60 seconds with a free `.vercel.app` URL and automatic HTTPS!

### Option B: Deploy to Firebase Hosting
```bash
npm install -g firebase-tools
firebase login
firebase init hosting
npm run build
firebase deploy
```

---

## 🌐 Connecting Your Own Custom Domain

Once deployed on Vercel:
1. In your Vercel Dashboard, go to your project → **Settings** → **Domains**.
2. Type your domain (e.g. `chutneytubes.in` or `buychutneytubes.com`) and click **Add**.
3. Vercel will display the exact DNS records to add:
   - **Type A:** `@` → `76.76.21.21`
   - **Type CNAME:** `www` → `cname.vercel-dns.com`
4. Log into your domain registrar (GoDaddy, Namecheap, Hostinger, etc.), go to **DNS Management**, and add those two records.
5. Within 15–30 minutes, your custom domain will be live with an automatic free SSL certificate.

---

## 🧪 Automated Test Suite

Run the complete test suite verifying price tiers, cart math, pincode zones, tracking payloads, and server endpoints:

```powershell
# Using agy-node:
agy-node --test tests/*.test.js

# Or using standard node:
npm test
```

### What the 20 Automated Tests Cover:
- **`tests/pricing.test.js`**: 3 A/B/C pricing tiers in `store.js`, case-insensitive URL overrides (`?variant=b`), sticky storage, and single/combo/pick-3 cart totals.
- **`tests/pincode.test.js`**: Validates 6-digit Indian PIN codes across all 8 zones (1-8), rejects invalid prefixes (0 and 9), and checks geographical zone mapping.
- **`tests/tracking.test.js`**: Validates all demand test events, UTM parameters, internal visit flagging (`?admin=1`), and DPDP privacy compliance.
- **`tests/funnel.test.js`**: Computes 4-stage funnel conversion, variant table conversion rates, and survey aggregation.
- **`tests/server.test.js`**: Socket-free request/response testing of `/`, `/checkout`, `/reveal`, `/api/events`, `/api/admin`, and `/api/export`.

---

## 🛡️ Ethics & Privacy Compliance (India DPDP Act 2023)

- **No Deceptive Tricks:** Zero fake countdown timers, zero invented "only 2 left" stock counters, and zero fake customer reviews.
- **No Unproven Claims:** No claims of "preservative-free", health benefits, or FSSAI certifications. All pending specifications are marked `[TBD]`.
- **Zero Financial Data:** No payment gateways are integrated. Card numbers, CVVs, and UPI IDs are **never** rendered or collected.
- **Unmistakable Reveal Screen:** Visitors are immediately informed that no charge was made and the product is pre-launch.
- **Data Minimization:** Names, phone numbers, and street addresses are never saved to public event logs. Only the first 3 digits of the pincode and postal zone are retained. Email is stored only if the visitor explicitly opts in.
- **Full Legal Pages Included:**
  - `/privacy` — India DPDP Act 2023 compliant privacy policy with data principal rights and grievance contact.
  - `/terms` — Terms of pre-launch demand validation.
  - `/shipping` — Shipping policy and launch delivery timelines.
  - `/refunds` — Policy clarifying that no funds are accepted or retained.
