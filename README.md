# Chutney Tubes 🌶️ — Demand Test

A mobile-first landing page and mock checkout built for testing consumer purchase intent for **Chutney Tubes** (everyday Indian chutneys and sauces in mess-free squeeze tubes).

> **Demand Test Validation Design:** The checkout journey feels authentic all the way to the "Pay" button. However, **NO payment is processed and NO payment details (card numbers, CVV, or UPI PINs) are ever collected.** Upon clicking "Pay", visitors encounter an unmistakable reveal screen explaining that no charge was made, offering an optional launch discount opt-in, and asking short qualitative feedback questions.

---

## 📋 Table of Contents
1. [Quick Start](#-quick-start)
2. [Single-File Configuration (`src/config/store.ts`)](#-single-file-configuration)
3. [How to Add Real Product Photos](#-how-to-add-real-product-photos)
4. [Tracking & Admin Analytics](#-tracking--admin-analytics)
5. [Deployment Guide (Vercel)](#-deployment-guide)
6. [Automated Test Suite](#-automated-test-suite)
7. [Ethics & Privacy Compliance (India DPDP Act 2023)](#-ethics--privacy-compliance)

---

## ⚡ Quick Start

```powershell
# Using agy-node runtime:
agy-node dev-server.js

# Or using npm:
npm run dev
```
Then open [http://localhost:3000](http://localhost:3000) in your browser.

---

## ⚙️ Single-File Configuration

All brand settings, products, packs, and copy live in:
- **`src/config/store.ts`** (TypeScript source for Next.js)
- **`src/config/store.js`** (CommonJS mirror for scripts & tests)

### Lineup (8 Everyday Tubes at ₹99)
1. `masala-ketchup`: Masala Tomato Ketchup
2. `tandoori-mayo`: Tandoori Mayo
3. `mint-mayo`: Mint Mayo
4. `garlic-mayo`: Garlic Mayo
5. `schezwan-sauce`: Schezwan Sauce
6. `chilli-garlic`: Red Chilli-Garlic Sauce
7. `hari-chutney`: Hari Chutney
8. `imli-chutney`: Khatti-Meethi Imli Chutney

### Value Packs
- **Chaat Pair (₹179):** Hari Chutney + Khatti-Meethi Imli Chutney
- **Desi-Chinese Pair (₹179):** Schezwan Sauce + Red Chilli-Garlic Sauce
- **Mayo Trio (₹269):** Tandoori Mayo + Mint Mayo + Garlic Mayo
- **Try-All-8 Sampler (₹699):** One tube of each flavour

---

## 📸 Product Images
Save photos in `public/products/{id}.jpg`. The app checks for existing files at build time and renders vector SVG tubes when no image exists to ensure zero 404 network requests.

---

## 📊 Admin Dashboard & Security
Visit `/admin` on your deployment or local server.
- The password is read from the `ADMIN_PASSWORD` environment variable (no fallback).
- Authentication sets an HttpOnly, Secure, SameSite=Strict cookie.
- Admin routes reject requests without a valid session with 401.

---

## 🚀 Deployment Guide
Push to branch `main` on GitHub to trigger automatic Vercel deployment:
```bash
git add .
git commit -m "Update product lineup and security"
git push origin main
```
Configure `ADMIN_PASSWORD` in your Vercel Project Settings under Environment Variables.

---

## 🧪 Automated Test Suite
```powershell
agy-node --test tests/*.test.js
```

---

## 🛡️ Ethics & Privacy Compliance (India DPDP Act 2023)
- No deceptive countdown timers, artificial stock numbers, or invented reviews.
- Zero financial details: We don't store card numbers, CVVs or UPI PINs.
- Clear disclosure after Pay: Visitors are informed that no payment was deducted.
