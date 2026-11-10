/**
 * Standalone Local Development & Preview Server for Chutney Tubes
 * Runs with standard Node.js or agy-node with zero external dependencies.
 */

const http = require("http");
const fs = require("fs");
const path = require("path");
const url = require("url");

const productConfig = require("./src/config/product.config.js");
const { calculateMetrics } = require("./src/lib/metrics.js");

const PORT = process.env.PORT || 3000;
const DATA_DIR = path.join(__dirname, "data");
const EVENTS_FILE = path.join(DATA_DIR, "events.json");
const PUBLIC_DIR = path.join(__dirname, "public");

// Ensure data directory and events file exist
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
if (!fs.existsSync(EVENTS_FILE)) fs.writeFileSync(EVENTS_FILE, "[]", "utf-8");

function readEvents() {
  try {
    return JSON.parse(fs.readFileSync(EVENTS_FILE, "utf-8") || "[]");
  } catch (e) {
    return [];
  }
}

function writeEvents(events) {
  try {
    fs.writeFileSync(EVENTS_FILE, JSON.stringify(events, null, 2), "utf-8");
  } catch (e) {
    console.error("Error writing events file:", e);
  }
}

function escapeCsv(val) {
  if (val === undefined || val === null) return '""';
  const str = String(val).replace(/"/g, '""');
  return `"${str}"`;
}

function generateCsvString(events) {
  const headers = [
    "Timestamp",
    "Event",
    "Visitor_ID",
    "Price_Variant",
    "Traffic_Source",
    "Flavour",
    "Pack",
    "Quantity",
    "Total_Amount_INR",
    "Pincode",
    "Is_Deliverable",
    "Payment_Method",
    "Survey_Feedback",
    "Usage_Frequency",
    "Launch_Discount_OptIn",
  ];

  const rows = events.map((ev) => {
    const meta = ev.metadata || {};
    return [
      escapeCsv(ev.timestamp),
      escapeCsv(ev.event),
      escapeCsv(ev.visitorId),
      escapeCsv(ev.variant),
      escapeCsv(ev.source),
      escapeCsv(meta.flavour),
      escapeCsv(meta.pack),
      escapeCsv(meta.quantity),
      escapeCsv(meta.totalAmount),
      escapeCsv(meta.pincode),
      escapeCsv(meta.isDeliverable),
      escapeCsv(meta.paymentMethod),
      escapeCsv(meta.feedback),
      escapeCsv(meta.frequency),
      escapeCsv(meta.optInDiscount),
    ].join(",");
  });

  return [headers.join(","), ...rows].join("\r\n");
}

// Common HTML Shell Header
function renderHtmlShell(title, bodyContent) {
  return `<!DOCTYPE html>
<html lang="en" class="scroll-smooth">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=5.0">
  <title>${title} | ${productConfig.brand.name}</title>
  <meta name="description" content="${productConfig.brand.tagline}">
  <script src="https://cdn.tailwindcss.com"></script>
  <script>
    tailwind.config = {
      theme: {
        extend: {
          colors: {
            brand: {
              terracotta: '#C2410C',
              turmeric: '#D97706',
              mint: '#15803D',
              cream: '#FAF7F2',
              slate: '#1C1917'
            }
          }
        }
      }
    }
  </script>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@400;600;700;800;900&family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap" rel="stylesheet">
  <style>
    body {
      font-family: 'Plus Jakarta Sans', system-ui, -apple-system, sans-serif;
      background-color: #FAF7F2;
      color: #1C1917;
      -webkit-font-smoothing: antialiased;
    }
    h1, h2, h3, h4, .font-heading {
      font-family: 'Outfit', system-ui, -apple-system, sans-serif;
    }
    a:focus-visible, button:focus-visible, input:focus-visible, textarea:focus-visible {
      outline: 2px solid #C2410C;
      outline-offset: 2px;
    }
  </style>
</head>
<body class="min-h-screen flex flex-col justify-between selection:bg-[#FDE68A] selection:text-[#78350F]">
  ${bodyContent}

  <!-- Client-side Tracker Script -->
  <script>
    (function() {
      const config = ${JSON.stringify(productConfig)};

      // Visitor ID
      let visitorId = localStorage.getItem('ct_visitor_id');
      if (!visitorId) {
        visitorId = 'vis_' + Date.now().toString(36) + '_' + Math.random().toString(36).substring(2, 9);
        localStorage.setItem('ct_visitor_id', visitorId);
      }

      // Variant determination (?variant= param > localStorage > random A/B/C)
      const urlParams = new URLSearchParams(window.location.search);
      let variant = urlParams.get('variant');
      if (variant) {
        variant = variant.toUpperCase();
        if (['A', 'B', 'C'].includes(variant)) {
          localStorage.setItem('ct_price_variant', variant);
        } else {
          variant = null;
        }
      }
      if (!variant) {
        variant = localStorage.getItem('ct_price_variant');
      }
      if (!variant || !['A', 'B', 'C'].includes(variant)) {
        const opts = ['A', 'B', 'C'];
        variant = opts[Math.floor(Math.random() * opts.length)];
        localStorage.setItem('ct_price_variant', variant);
      }

      // Source determination (?src= param > localStorage > referrer > 'direct')
      let src = urlParams.get('src');
      if (src) {
        src = src.toLowerCase();
        localStorage.setItem('ct_traffic_src', src);
      } else {
        src = localStorage.getItem('ct_traffic_src');
      }
      if (!src) {
        if (document.referrer) {
          try {
            const h = new URL(document.referrer).hostname;
            if (h.includes('instagram')) src = 'instagram';
            else if (h.includes('whatsapp')) src = 'whatsapp';
            else if (h.includes('linkedin')) src = 'linkedin';
            else src = h;
          } catch(e) { src = 'direct'; }
        } else {
          src = 'direct';
        }
        localStorage.setItem('ct_traffic_src', src);
      }

      window.CT_APP = {
        config: config,
        visitorId: visitorId,
        variant: variant,
        source: src,
        pricing: config.pricing.variants[variant] || config.pricing.variants.A,
        track: function(eventName, metadata) {
          const payload = {
            event: eventName,
            timestamp: new Date().toISOString(),
            visitorId: visitorId,
            variant: variant,
            source: src,
            metadata: metadata || {}
          };
          fetch('/api/events', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
            keepalive: true
          }).catch(function() {});
          return payload;
        }
      };

      // 50% scroll tracker
      let scrolled50 = false;
      window.addEventListener('scroll', function() {
        if (scrolled50) return;
        const total = document.documentElement.scrollHeight - window.innerHeight;
        if (total > 0 && (window.scrollY / total) >= 0.5) {
          scrolled50 = true;
          window.CT_APP.track('scroll_50');
        }
      }, { passive: true });
    })();
  </script>
</body>
</html>`;
}

// Route: Landing Page
function renderLandingPage() {
  const c = productConfig;
  return renderHtmlShell(
    "Desk-Lunch Chutney with Zero Mess",
    `
    <!-- Pre-launch Transparency Bar -->
    <div class="bg-[#1C1917] text-[#FEF3C7] text-xs sm:text-sm font-medium py-2.5 px-4 text-center tracking-wide">
      <span>🚀 <strong>Early Access Demand Test</strong> • Pre-order to shape our first production batch</span>
      <span id="variant-badge" class="ml-2 inline-block bg-[#78350F] text-[#FDE68A] text-[10px] uppercase font-bold px-2 py-0.5 rounded">
        Variant Loading...
      </span>
    </div>

    <!-- Navigation Header -->
    <header class="sticky top-0 z-40 bg-[#FAF7F2]/95 backdrop-blur-md border-b border-[#E7E5E4] px-4 sm:px-8 py-3.5 flex items-center justify-between">
      <div class="flex items-center space-x-2">
        <div class="w-8 h-8 rounded-lg bg-[#C2410C] flex items-center justify-center text-white font-black text-lg shadow-sm">
          C
        </div>
        <span class="font-extrabold text-lg sm:text-xl text-[#1C1917] tracking-tight">
          ${c.brand.name}
        </span>
      </div>

      <nav class="hidden md:flex items-center space-x-6 text-sm font-medium text-[#57534E]">
        <a href="#how-it-works" class="hover:text-[#C2410C] transition">How It Works</a>
        <a href="#flavours" class="hover:text-[#C2410C] transition">Flavours</a>
        <a href="#why-tube" class="hover:text-[#C2410C] transition">Why a Tube?</a>
        <a href="#faq" class="hover:text-[#C2410C] transition">FAQ</a>
      </nav>

      <a href="#order" class="bg-[#C2410C] hover:bg-[#9A3412] text-white font-bold text-xs sm:text-sm px-4 py-2 rounded-full shadow-sm hover:shadow transition flex items-center space-x-1">
        <span id="header-cta-price">Buy Now • ₹99</span>
      </a>
    </header>

    <!-- HERO SECTION -->
    <section class="relative pt-8 pb-14 px-4 sm:px-8 max-w-6xl mx-auto w-full">
      <div class="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
        <!-- Hero Left Content -->
        <div class="lg:col-span-7 space-y-5 text-center lg:text-left">
          <div class="inline-flex items-center space-x-2 bg-[#DCFCE7] text-[#15803D] text-xs font-bold px-3 py-1.5 rounded-full border border-[#86EFAC]/60">
            <span>🌿 Real Indian Kitchen Flavour</span>
            <span class="w-1.5 h-1.5 rounded-full bg-[#15803D]"></span>
            <span>100% Mess-Free</span>
          </div>

          <h1 class="text-3xl sm:text-5xl lg:text-6xl font-black text-[#1C1917] leading-[1.15] tracking-tight font-heading">
            Desk-lunch chutney with <span class="text-[#C2410C] underline decoration-[#F59E0B] decoration-wavy decoration-2">no mess</span>.
          </h1>

          <p class="text-base sm:text-lg text-[#57534E] leading-relaxed max-w-xl mx-auto lg:mx-0">
            Home-style Indian chutney in an easy, squeezable tube. No spoon needed, no leaking dabba in your bag, fits straight into your tiffin or office drawer.
          </p>

          <div class="flex flex-wrap items-center justify-center lg:justify-start gap-2 pt-1">
            <span class="bg-[#FEF3C7] text-[#78350F] text-xs font-semibold px-3 py-1 rounded-md">
              ✓ No Spoons to Wash
            </span>
            <span class="bg-[#FEF3C7] text-[#78350F] text-xs font-semibold px-3 py-1 rounded-md">
              ✓ Leak-Proof Flip Cap
            </span>
            <span class="bg-[#FEF3C7] text-[#78350F] text-xs font-semibold px-3 py-1 rounded-md">
              ✓ Fits Any Tiffin Bag
            </span>
          </div>

          <div class="pt-4 flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-3">
            <a href="#order" id="hero-cta-btn" class="w-full sm:w-auto text-center bg-[#C2410C] hover:bg-[#9A3412] text-white font-extrabold text-base sm:text-lg px-8 py-3.5 rounded-xl shadow-lg hover:shadow-xl transition transform active:scale-98">
              Buy Now • ₹99
            </a>
            <span class="text-xs text-[#78350F] font-medium bg-[#FEF3C7] px-3 py-1.5 rounded-lg border border-[#FDE68A]">
              ⚡ Zero risk: Demand test only (no charge)
            </span>
          </div>
        </div>

        <!-- Hero Right Visual -->
        <div class="lg:col-span-5 flex justify-center">
          <div class="relative w-full max-w-md bg-white rounded-3xl p-4 shadow-xl border border-[#E7E5E4] overflow-hidden">
            <img src="/images/hero-tubes.svg" alt="Chutney Tubes packaging with tiffin box" class="w-full h-auto object-contain rounded-2xl">
            <div class="mt-3 text-center">
              <span class="text-xs font-bold text-[#57534E] uppercase tracking-wider">
                Authentic Chutney • Ergonomic Squeeze Tube (150g)
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- HOW IT WORKS SECTION -->
    <section id="how-it-works" class="py-14 bg-white border-y border-[#E7E5E4] px-4 sm:px-8">
      <div class="max-w-5xl mx-auto">
        <div class="text-center max-w-xl mx-auto mb-10">
          <h2 class="text-xs font-extrabold text-[#C2410C] uppercase tracking-widest mb-1 font-heading">Simple &amp; Clean</h2>
          <h3 class="text-2xl sm:text-3xl font-black text-[#1C1917] font-heading">How It Works</h3>
          <p class="text-sm text-[#57534E] mt-2">Three effortless steps from desk drawer to your plate.</p>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div class="bg-[#FAF7F2] rounded-2xl p-6 border border-[#E7E5E4] text-center flex flex-col items-center hover:shadow-md transition">
            <div class="w-24 h-24 mb-4">
              <img src="/images/step-1.svg" alt="Step 1: Open Tiffin" class="w-full h-full object-contain">
            </div>
            <h4 class="font-extrabold text-lg text-[#1C1917] mb-2 font-heading">1. Open Your Tiffin</h4>
            <p class="text-sm text-[#57534E]">Pull out your hot rotis, parathas, sandwich, or lunch container at your desk.</p>
          </div>

          <div class="bg-[#FAF7F2] rounded-2xl p-6 border border-[#E7E5E4] text-center flex flex-col items-center hover:shadow-md transition">
            <div class="w-24 h-24 mb-4">
              <img src="/images/step-2.svg" alt="Step 2: Squeeze" class="w-full h-full object-contain">
            </div>
            <h4 class="font-extrabold text-lg text-[#1C1917] mb-2 font-heading">2. Squeeze</h4>
            <p class="text-sm text-[#57534E]">Flip the precision cap and squeeze the exact dollop or swirl you want directly onto your food.</p>
          </div>

          <div class="bg-[#FAF7F2] rounded-2xl p-6 border border-[#E7E5E4] text-center flex flex-col items-center hover:shadow-md transition">
            <div class="w-24 h-24 mb-4">
              <img src="/images/step-3.svg" alt="Step 3: Done" class="w-full h-full object-contain">
            </div>
            <h4 class="font-extrabold text-lg text-[#1C1917] mb-2 font-heading">3. Snap Shut &amp; Done</h4>
            <p class="text-sm text-[#57534E]">Snap the cap closed. No sticky spoons to scrub in the office washroom, no oily spills.</p>
          </div>
        </div>
      </div>
    </section>

    <!-- FLAVOUR PICKER & CART BUILDER -->
    <section id="order" class="py-16 px-4 sm:px-8 max-w-6xl mx-auto w-full">
      <div class="text-center max-w-2xl mx-auto mb-10">
        <span class="text-xs font-extrabold text-[#C2410C] uppercase tracking-widest font-heading">Taste The Tradition</span>
        <h2 class="text-2xl sm:text-4xl font-black text-[#1C1917] mt-1 font-heading">Choose Your Flavour &amp; Pack</h2>
        <p class="text-sm sm:text-base text-[#57534E] mt-2">Cooked with authentic home recipes. Select a single tube or save with the 3-flavour pack.</p>
      </div>

      <!-- Pack Selector Toggle -->
      <div class="max-w-md mx-auto mb-8 bg-[#E7E5E4]/60 p-1.5 rounded-2xl flex items-center">
        <button type="button" id="btn-pack-single" onclick="setPack('single')" class="flex-1 py-2.5 px-4 rounded-xl text-xs sm:text-sm font-bold transition bg-white text-[#1C1917] shadow-sm">
          Single Tube (150g) • <span id="pack-single-price">₹99</span>
        </button>
        <button type="button" id="btn-pack-three" onclick="setPack('three_pack')" class="flex-1 py-2.5 px-4 rounded-xl text-xs sm:text-sm font-bold transition flex items-center justify-center space-x-1.5 text-[#57534E] hover:text-[#1C1917]">
          <span>3-Pack (3x150g) • <span id="pack-three-price">₹249</span></span>
          <span class="bg-[#FEF3C7] text-[#78350F] text-[10px] px-1.5 py-0.5 rounded font-extrabold">Save</span>
        </button>
      </div>

      <!-- Flavour Cards Grid -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8" id="flavour-cards-container">
        ${c.flavours
          .map(
            (f) => `
          <div id="card-${f.id}" onclick="selectFlavour('${f.id}')" class="flavour-card relative bg-white rounded-3xl p-5 border-2 border-[#E7E5E4] hover:border-[#CBD5E1] transition-all cursor-pointer">
            <div class="flex items-center justify-between mb-3">
              <span class="text-[11px] font-extrabold uppercase px-2.5 py-1 rounded-full bg-[#FAF7F2] text-[#57534E] border border-[#E7E5E4]">
                ${f.tag}
              </span>
              <span class="inline-flex items-center text-[11px] font-bold text-[#15803D] bg-[#DCFCE7] px-2 py-0.5 rounded-full">
                ● In Stock
              </span>
            </div>
            <div class="w-full h-44 mb-3 flex items-center justify-center bg-[#FAF7F2] rounded-2xl overflow-hidden p-2">
              <img src="${f.image}" alt="${f.name}" class="w-full h-full object-contain transform hover:scale-105 transition">
            </div>
            <h3 class="font-extrabold text-lg text-[#1C1917] mb-1 font-heading">${f.name}</h3>
            <p class="text-xs sm:text-sm text-[#57534E] mb-3 leading-snug">${f.shortDesc}</p>
            <div class="pt-2 border-t border-[#F5F5F4] text-[11px] text-[#78350F] font-medium">${f.pairing}</div>
            <div class="mt-4 pt-3 flex items-center justify-between">
              <span id="label-select-${f.id}" class="text-xs font-bold text-[#1C1917]">Click to select</span>
              <div id="check-${f.id}" class="w-6 h-6 rounded-full flex items-center justify-center border-2 border-[#CBD5E1] bg-white"></div>
            </div>
          </div>
        `
          )
          .join("")}
      </div>

      <!-- Sticky Cart Summary Box -->
      <div class="bg-white rounded-3xl p-6 border border-[#E7E5E4] shadow-xl max-w-xl mx-auto">
        <div class="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-[#E7E5E4] gap-3">
          <div>
            <span class="text-xs font-bold text-[#C2410C] uppercase tracking-wider font-heading">Order Configuration</span>
            <h4 id="summary-title" class="text-lg font-black text-[#1C1917] font-heading">Single Tube (150g) - Mint-Coriander</h4>
            <p class="text-xs text-[#57534E]">Includes all launch batch benefits</p>
          </div>

          <div class="flex items-center space-x-2">
            <span class="text-xs font-bold text-[#57534E]">Qty:</span>
            <div class="flex items-center border border-[#E7E5E4] rounded-xl overflow-hidden bg-[#FAF7F2]">
              <button type="button" onclick="updateQty(-1)" class="px-3 py-1 font-black text-sm text-[#1C1917] hover:bg-[#E7E5E4] transition">-</button>
              <span id="qty-display" class="px-3 py-1 text-sm font-bold text-[#1C1917] min-w-[28px] text-center">1</span>
              <button type="button" onclick="updateQty(1)" class="px-3 py-1 font-black text-sm text-[#1C1917] hover:bg-[#E7E5E4] transition">+</button>
            </div>
          </div>
        </div>

        <div class="pt-4 flex items-center justify-between">
          <div>
            <span class="text-xs text-[#57534E] block">Total Amount</span>
            <span id="total-display" class="text-2xl sm:text-3xl font-black text-[#1C1917] font-heading">₹99</span>
          </div>

          <button type="button" onclick="goToCheckout()" class="bg-[#C2410C] hover:bg-[#9A3412] text-white font-extrabold text-sm sm:text-base px-8 py-3.5 rounded-xl shadow-md hover:shadow-lg transition flex items-center space-x-2">
            <span>Proceed to Checkout</span>
            <span>→</span>
          </button>
        </div>
      </div>
    </section>

    <!-- WHY A TUBE? SECTION -->
    <section id="why-tube" class="py-16 bg-[#FAF7F2] border-t border-[#E7E5E4] px-4 sm:px-8">
      <div class="max-w-5xl mx-auto">
        <div class="text-center max-w-xl mx-auto mb-10">
          <span class="text-xs font-extrabold text-[#C2410C] uppercase tracking-widest font-heading">Smart Design</span>
          <h2 class="text-2xl sm:text-3xl font-black text-[#1C1917] mt-1 font-heading">Why a Tube?</h2>
          <p class="text-sm text-[#57534E] mt-2">Designed specifically for the daily office tiffin routine. Benefits only, no unprovable claims.</p>
        </div>

        <div class="hidden md:block overflow-hidden bg-white rounded-3xl border border-[#E7E5E4] shadow-sm">
          <table class="w-full text-left border-collapse">
            <thead>
              <tr class="bg-[#FAF7F2] border-b border-[#E7E5E4] text-xs font-black text-[#1C1917] uppercase tracking-wider">
                <th class="py-4 px-5">Factor</th>
                <th class="py-4 px-5 bg-[#DCFCE7]/60 text-[#15803D]">Chutney Tube ✨</th>
                <th class="py-4 px-5">Glass Jar</th>
                <th class="py-4 px-5">Plastic Sachet</th>
                <th class="py-4 px-5">Small Dabba</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-[#E7E5E4] text-sm">
              ${c.tubeComparisons
                .map(
                  (item) => `
                <tr class="hover:bg-[#FAF7F2]/40 transition">
                  <td class="py-4 px-5 font-bold text-[#1C1917]">${item.factor}</td>
                  <td class="py-4 px-5 font-semibold text-[#15803D] bg-[#DCFCE7]/30">✓ ${item.tube}</td>
                  <td class="py-4 px-5 text-[#57534E]">✗ ${item.jar}</td>
                  <td class="py-4 px-5 text-[#57534E]">✗ ${item.sachet}</td>
                  <td class="py-4 px-5 text-[#57534E]">✗ ${item.dabba}</td>
                </tr>
              `
                )
                .join("")}
            </tbody>
          </table>
        </div>

        <div class="md:hidden space-y-4">
          ${c.tubeComparisons
            .map(
              (item) => `
            <div class="bg-white rounded-2xl p-5 border border-[#E7E5E4] shadow-sm">
              <h4 class="font-extrabold text-[#1C1917] text-base mb-3 border-b border-[#E7E5E4] pb-2 font-heading">${item.factor}</h4>
              <div class="space-y-2 text-xs">
                <div class="bg-[#DCFCE7] text-[#15803D] p-2.5 rounded-xl font-bold">
                  <strong>Chutney Tube:</strong> ${item.tube}
                </div>
                <div class="text-[#57534E] px-1"><strong>Glass Jar:</strong> ${item.jar}</div>
                <div class="text-[#57534E] px-1"><strong>Sachet:</strong> ${item.sachet}</div>
                <div class="text-[#57534E] px-1"><strong>Small Dabba:</strong> ${item.dabba}</div>
              </div>
            </div>
          `
            )
            .join("")}
        </div>
      </div>
    </section>

    <!-- FAQ SECTION (With TBD Markers) -->
    <section id="faq" class="py-16 bg-white border-t border-[#E7E5E4] px-4 sm:px-8">
      <div class="max-w-3xl mx-auto">
        <div class="text-center mb-10">
          <span class="text-xs font-extrabold text-[#C2410C] uppercase tracking-widest font-heading">Questions &amp; Details</span>
          <h2 class="text-2xl sm:text-3xl font-black text-[#1C1917] mt-1 font-heading">Frequently Asked Questions</h2>
          <p class="text-sm text-[#57534E] mt-2">Transparent answers regarding our formulation, packaging, and pilot delivery.</p>
        </div>

        <div class="space-y-3">
          ${c.faq
            .map(
              (f, idx) => `
            <div class="border border-[#E7E5E4] rounded-2xl overflow-hidden transition">
              <button type="button" onclick="toggleFaq(${idx})" class="w-full text-left py-4 px-5 bg-[#FAF7F2] hover:bg-[#F5F5F4] flex items-center justify-between font-bold text-sm sm:text-base text-[#1C1917] transition font-heading">
                <span>${f.q}</span>
                <span id="faq-icon-${idx}" class="text-[#C2410C] text-lg font-black ml-2">+</span>
              </button>
              <div id="faq-ans-${idx}" class="hidden p-5 bg-white text-xs sm:text-sm text-[#57534E] leading-relaxed border-t border-[#E7E5E4]">
                ${f.a}
              </div>
            </div>
          `
            )
            .join("")}
        </div>
      </div>
    </section>

    <!-- FOOTER -->
    <footer class="bg-[#1C1917] text-[#A8A29E] py-12 px-4 sm:px-8 border-t border-[#292524]">
      <div class="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-12 gap-8">
        <div class="md:col-span-6 space-y-3">
          <div class="flex items-center space-x-2">
            <div class="w-7 h-7 rounded-lg bg-[#C2410C] flex items-center justify-center text-white font-black text-sm">C</div>
            <span class="font-black text-lg text-white font-heading">${c.brand.name}</span>
          </div>
          <p class="text-xs text-[#A8A29E] leading-relaxed max-w-sm">${c.brand.tagline}</p>
          <p class="text-xs text-[#78716C]">
            Contact: <a href="mailto:${c.brand.contactEmail}" class="text-[#FEF3C7] underline">${c.brand.contactEmail}</a>
          </p>
        </div>

        <div class="md:col-span-3 space-y-2">
          <h5 class="text-xs font-bold uppercase tracking-wider text-white font-heading">Legal &amp; Privacy</h5>
          <ul class="space-y-1.5 text-xs">
            <li><a href="/privacy" class="hover:text-white transition underline">Privacy Policy (DPDP Act)</a></li>
            <li><a href="/terms" class="hover:text-white transition underline">Terms of Demand Testing</a></li>
          </ul>
        </div>

        <div class="md:col-span-3 space-y-2">
          <h5 class="text-xs font-bold uppercase tracking-wider text-white font-heading">Internal Portal</h5>
          <ul class="space-y-1.5 text-xs">
            <li><a href="/admin" class="text-[#FDE68A] hover:underline font-bold">Admin Analytics Dashboard →</a></li>
          </ul>
        </div>
      </div>

      <div class="max-w-6xl mx-auto mt-8 pt-6 border-t border-[#292524] text-center text-[11px] text-[#78716C]">
        <p>© ${new Date().getFullYear()} ${c.brand.name}. Pre-launch validation prototype. No commercial transactions are processed on this site.</p>
      </div>
    </footer>

    <script>
      let state = {
        pack: 'single',
        flavour: 'mint-coriander',
        quantity: 1,
      };

      function updatePricingUI() {
        const p = window.CT_APP.pricing;
        const v = window.CT_APP.variant;
        document.getElementById('variant-badge').textContent = 'Variant ' + v;
        document.getElementById('header-cta-price').textContent = 'Pre-Order • ₹' + p.singlePrice;
        document.getElementById('hero-cta-btn').textContent = 'Buy Now • ₹' + p.singlePrice;
        document.getElementById('pack-single-price').textContent = '₹' + p.singlePrice;
        document.getElementById('pack-three-price').textContent = '₹' + p.threePackPrice;

        const uPrice = state.pack === 'three_pack' ? p.threePackPrice : p.singlePrice;
        document.getElementById('total-display').textContent = '₹' + (uPrice * state.quantity);
      }

      function setPack(packId) {
        state.pack = packId;
        window.CT_APP.track('flavour_selected', { pack: packId });

        const btnS = document.getElementById('btn-pack-single');
        const btnT = document.getElementById('btn-pack-three');

        if (packId === 'single') {
          btnS.className = 'flex-1 py-2.5 px-4 rounded-xl text-xs sm:text-sm font-bold transition bg-white text-[#1C1917] shadow-sm';
          btnT.className = 'flex-1 py-2.5 px-4 rounded-xl text-xs sm:text-sm font-bold transition flex items-center justify-center space-x-1.5 text-[#57534E] hover:text-[#1C1917]';
          selectFlavour(state.flavour);
        } else {
          btnS.className = 'flex-1 py-2.5 px-4 rounded-xl text-xs sm:text-sm font-bold transition text-[#57534E] hover:text-[#1C1917]';
          btnT.className = 'flex-1 py-2.5 px-4 rounded-xl text-xs sm:text-sm font-bold transition flex items-center justify-center space-x-1.5 bg-[#C2410C] text-white shadow-sm';
          
          // All 3 selected
          ['tamarind', 'garlic-chilli', 'mint-coriander'].forEach(id => {
            const card = document.getElementById('card-' + id);
            const lbl = document.getElementById('label-select-' + id);
            const chk = document.getElementById('check-' + id);
            card.className = 'flavour-card relative bg-white rounded-3xl p-5 border-2 border-[#C2410C] ring-4 ring-[#C2410C]/10 shadow-lg transition-all cursor-pointer';
            lbl.textContent = 'Included in 3-Pack';
            chk.className = 'w-6 h-6 rounded-full flex items-center justify-center border-2 bg-[#C2410C] border-[#C2410C] text-white font-bold text-xs';
            chk.textContent = '✓';
          });
          document.getElementById('summary-title').textContent = '3-Flavour Variety Pack (3 x 150g)';
        }
        updatePricingUI();
      }

      function selectFlavour(flavourId) {
        if (state.pack === 'three_pack') {
          setPack('single');
        }
        state.flavour = flavourId;
        window.CT_APP.track('flavour_selected', { flavour: flavourId });

        const flavours = ['tamarind', 'garlic-chilli', 'mint-coriander'];
        flavours.forEach(id => {
          const card = document.getElementById('card-' + id);
          const lbl = document.getElementById('label-select-' + id);
          const chk = document.getElementById('check-' + id);
          if (id === flavourId) {
            card.className = 'flavour-card relative bg-white rounded-3xl p-5 border-2 border-[#C2410C] ring-4 ring-[#C2410C]/10 shadow-lg transition-all cursor-pointer';
            lbl.textContent = '✓ Selected';
            chk.className = 'w-6 h-6 rounded-full flex items-center justify-center border-2 bg-[#C2410C] border-[#C2410C] text-white font-bold text-xs';
            chk.textContent = '✓';
          } else {
            card.className = 'flavour-card relative bg-white rounded-3xl p-5 border-2 border-[#E7E5E4] hover:border-[#CBD5E1] transition-all cursor-pointer';
            lbl.textContent = 'Click to select';
            chk.className = 'w-6 h-6 rounded-full flex items-center justify-center border-2 border-[#CBD5E1] bg-white';
            chk.textContent = '';
          }
        });

        const fName = flavourId === 'tamarind' ? 'Tamarind (Imli)' : (flavourId === 'garlic-chilli' ? 'Garlic-Chilli' : 'Mint-Coriander');
        document.getElementById('summary-title').textContent = 'Single Tube (150g) - ' + fName;
        updatePricingUI();
      }

      function updateQty(delta) {
        state.quantity = Math.max(1, Math.min(10, state.quantity + delta));
        document.getElementById('qty-display').textContent = state.quantity;
        updatePricingUI();
      }

      function goToCheckout() {
        const p = window.CT_APP.pricing;
        const uPrice = state.pack === 'three_pack' ? p.threePackPrice : p.singlePrice;
        const total = uPrice * state.quantity;

        window.CT_APP.track('add_to_cart', {
          pack: state.pack,
          flavour: state.pack === 'three_pack' ? 'all_three' : state.flavour,
          quantity: state.quantity,
          unitPrice: uPrice,
          totalAmount: total,
          variant: window.CT_APP.variant
        });

        sessionStorage.setItem('ct_cart', JSON.stringify({
          pack: state.pack,
          flavour: state.flavour,
          quantity: state.quantity,
          unitPrice: uPrice,
          totalPrice: total,
          variantId: window.CT_APP.variant
        }));

        window.location.href = '/checkout';
      }

      function toggleFaq(idx) {
        const ans = document.getElementById('faq-ans-' + idx);
        const icon = document.getElementById('faq-icon-' + idx);
        if (ans.classList.contains('hidden')) {
          ans.classList.remove('hidden');
          icon.textContent = '−';
        } else {
          ans.classList.add('hidden');
          icon.textContent = '+';
        }
      }

      window.addEventListener('load', function() {
        updatePricingUI();
        selectFlavour('mint-coriander');
        window.CT_APP.track('page_view', { path: '/' });
      });
    </script>
  `
  );
}

// Route: Checkout Page
function renderCheckoutPage() {
  const c = productConfig;
  return renderHtmlShell(
    "Checkout & Delivery",
    `
    <header class="bg-white border-b border-[#E7E5E4] py-3.5 px-4 sm:px-8">
      <div class="max-w-4xl mx-auto flex items-center justify-between">
        <a href="/" class="flex items-center space-x-2">
          <div class="w-8 h-8 rounded-lg bg-[#C2410C] flex items-center justify-center text-white font-black text-sm">C</div>
          <span class="font-extrabold text-lg text-[#1C1917] font-heading">${c.brand.name}</span>
        </a>
        <div class="text-xs text-[#57534E] font-medium flex items-center space-x-1">
          <span>🔒 Secure Pre-Launch Reservation</span>
        </div>
      </div>
    </header>

    <main class="max-w-4xl mx-auto w-full p-4 sm:p-6 lg:p-8 flex-1">
      <div class="mb-6">
        <a href="/" class="text-xs font-bold text-[#C2410C] hover:underline flex items-center space-x-1">
          <span>← Back to product details</span>
        </a>
        <h1 class="text-2xl sm:text-3xl font-black text-[#1C1917] mt-2 font-heading">
          Confirm Your Delivery Details
        </h1>
        <p class="text-xs sm:text-sm text-[#57534E]">
          Reserve your batch from our upcoming pilot production.
        </p>
      </div>

      <form id="checkout-form" onsubmit="handlePaySubmit(event)" class="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <!-- Delivery Info -->
        <div class="lg:col-span-7 space-y-6">
          <div class="bg-white rounded-3xl p-6 border border-[#E7E5E4] shadow-sm space-y-4">
            <h2 class="text-base font-extrabold text-[#1C1917] flex items-center space-x-2 border-b border-[#E7E5E4] pb-3 font-heading">
              <span class="w-6 h-6 rounded-full bg-[#FEF3C7] text-[#78350F] flex items-center justify-center text-xs font-black">1</span>
              <span>Delivery Address</span>
            </h2>

            <div class="space-y-3">
              <div>
                <label class="block text-xs font-bold text-[#1C1917] mb-1">Full Name *</label>
                <input type="text" id="cust-name" required placeholder="e.g. Priya Sharma" class="w-full text-sm px-3.5 py-2.5 rounded-xl border border-[#D6D3D1] bg-[#FAF7F2] focus:bg-white focus:border-[#C2410C] transition">
              </div>

              <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label class="block text-xs font-bold text-[#1C1917] mb-1">Phone (WhatsApp alerts) *</label>
                  <input type="tel" id="cust-phone" required pattern="[0-9]{10}" maxlength="10" placeholder="9876543210" class="w-full text-sm px-3.5 py-2.5 rounded-xl border border-[#D6D3D1] bg-[#FAF7F2] focus:bg-white focus:border-[#C2410C] transition">
                </div>
                <div>
                  <label class="block text-xs font-bold text-[#1C1917] mb-1">Email Address *</label>
                  <input type="email" id="cust-email" required placeholder="priya@company.com" class="w-full text-sm px-3.5 py-2.5 rounded-xl border border-[#D6D3D1] bg-[#FAF7F2] focus:bg-white focus:border-[#C2410C] transition">
                </div>
              </div>

              <!-- Pincode Check -->
              <div>
                <label class="block text-xs font-bold text-[#1C1917] mb-1">6-digit Delivery Pincode *</label>
                <input type="text" id="cust-pincode" required maxlength="6" oninput="checkPincode(this.value)" placeholder="e.g. 560001 (Bengaluru), 400001 (Mumbai)..." class="w-full text-sm px-3.5 py-2.5 rounded-xl border border-[#D6D3D1] bg-[#FAF7F2] focus:bg-white focus:border-[#C2410C] transition font-mono">
                
                <div id="pincode-status-box" class="hidden mt-2"></div>
              </div>

              <div>
                <label class="block text-xs font-bold text-[#1C1917] mb-1">Complete Address (Flat, Desk, Street) *</label>
                <textarea id="cust-address" required rows="2" placeholder="Floor 4, Desk 12, WeWork Salarpuria, Koramangala..." class="w-full text-sm px-3.5 py-2.5 rounded-xl border border-[#D6D3D1] bg-[#FAF7F2] focus:bg-white focus:border-[#C2410C] transition"></textarea>
              </div>
            </div>
          </div>

          <!-- MOCK PAYMENT STEP (Plain Buttons, No Gateway, No Logos, No Card inputs) -->
          <div class="bg-white rounded-3xl p-6 border border-[#E7E5E4] shadow-sm space-y-4">
            <h2 class="text-base font-extrabold text-[#1C1917] flex items-center space-x-2 border-b border-[#E7E5E4] pb-3 font-heading">
              <span class="w-6 h-6 rounded-full bg-[#FEF3C7] text-[#78350F] flex items-center justify-center text-xs font-black">2</span>
              <span>Select Payment Preference (Mock Step)</span>
            </h2>

            <div class="p-3 bg-[#FAF7F2] border border-[#E7E5E4] rounded-xl text-xs text-[#57534E] flex items-start space-x-2">
              <span class="text-base leading-none">ℹ️</span>
              <div>
                <strong class="text-[#1C1917]">No payment is collected.</strong> This confirms which payment method you prefer when the product launches. No card numbers or UPI IDs are requested.
              </div>
            </div>

            <!-- Generic Plain Buttons Only (No Razorpay/Paytm/PhonePe logos) -->
            <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <button type="button" onclick="selectPayMethod('upi')" id="pay-btn-upi" class="py-3.5 px-4 rounded-2xl border-2 border-[#C2410C] bg-[#FFF7ED] text-[#C2410C] font-black text-center transition flex flex-col items-center justify-center space-y-1">
                <span class="text-base">📱</span>
                <span class="text-xs font-bold">UPI</span>
                <span class="text-[10px] text-[#78716C]">Instant &amp; Easy</span>
              </button>

              <button type="button" onclick="selectPayMethod('card')" id="pay-btn-card" class="py-3.5 px-4 rounded-2xl border-2 border-[#E7E5E4] bg-[#FAF7F2] text-[#57534E] text-center transition flex flex-col items-center justify-center space-y-1 hover:border-[#D6D3D1]">
                <span class="text-base">💳</span>
                <span class="text-xs font-bold">Credit / Debit Card</span>
                <span class="text-[10px] text-[#78716C]">All Banks</span>
              </button>

              <button type="button" onclick="selectPayMethod('cod')" id="pay-btn-cod" class="py-3.5 px-4 rounded-2xl border-2 border-[#E7E5E4] bg-[#FAF7F2] text-[#57534E] text-center transition flex flex-col items-center justify-center space-y-1 hover:border-[#D6D3D1]">
                <span class="text-base">💵</span>
                <span class="text-xs font-bold">Cash on Delivery</span>
                <span class="text-[10px] text-[#78716C]">Pay on arrival</span>
              </button>
            </div>

            <div class="pt-2 text-[11px] text-[#78716C] leading-snug">
              🛡️ <strong>Privacy Notice:</strong> By placing your reservation, you consent to our collecting your contact details strictly to communicate production milestones, launch availability, and dispatch updates under the Digital Personal Data Protection (DPDP) Act. We never sell or share your data.
            </div>
          </div>
        </div>

        <!-- Summary & Pay CTA -->
        <div class="lg:col-span-5">
          <div class="sticky top-20 bg-white rounded-3xl p-6 border border-[#E7E5E4] shadow-md space-y-4">
            <h3 class="font-extrabold text-base text-[#1C1917] border-b border-[#E7E5E4] pb-3 font-heading">
              Order Summary
            </h3>

            <div class="space-y-3 text-xs">
              <div class="flex justify-between items-start">
                <div>
                  <strong id="chk-item-name" class="text-[#1C1917] block text-sm font-heading">Single Tube (150g)</strong>
                  <span id="chk-qty" class="text-[#57534E]">Quantity: 1</span>
                </div>
                <span id="chk-total" class="font-black text-sm text-[#1C1917] font-heading">₹99</span>
              </div>

              <div class="flex justify-between text-[#57534E] pt-2 border-t border-[#F5F5F4]">
                <span>Delivery Fee</span>
                <span class="text-[#15803D] font-bold">FREE (Early Bird)</span>
              </div>

              <div class="flex justify-between items-center pt-3 border-t-2 border-[#1C1917] text-base font-black text-[#1C1917]">
                <span>Total Payable:</span>
                <span id="chk-grand-total" class="text-xl font-black text-[#C2410C] font-heading">₹99</span>
              </div>
            </div>

            <button type="submit" id="btn-pay-action" class="w-full bg-[#C2410C] hover:bg-[#9A3412] text-white font-black text-base py-4 rounded-2xl shadow-lg hover:shadow-xl transition transform active:scale-98 flex items-center justify-center space-x-2 font-heading">
              <span id="pay-action-text">Pay ₹99</span>
              <span>→</span>
            </button>

            <div class="text-center">
              <span class="text-[11px] text-[#78716C] block">
                Zero risk demand validation • No charge is applied
              </span>
            </div>
          </div>
        </div>
      </form>
    </main>

    <script>
      let selectedMethod = 'upi';
      let cartData = { pack: 'single', flavour: 'mint-coriander', quantity: 1, unitPrice: 99, totalPrice: 99 };
      let pincodeDeliverable = false;

      function checkPincode(pin) {
        const clean = (pin || '').trim().replace(/\\D/g, '').slice(0, 6);
        const box = document.getElementById('pincode-status-box');
        if (clean.length === 6) {
          const isOk = window.CT_APP.config.launchPincodes.includes(clean);
          pincodeDeliverable = isOk;
          box.classList.remove('hidden');
          if (isOk) {
            box.innerHTML = '<div class="p-2.5 bg-[#DCFCE7] border border-[#86EFAC] rounded-xl text-xs font-bold text-[#15803D]">✓ We deliver here in our Phase 1 launch batch!</div>';
            window.CT_APP.track('pincode_checked', { pincode: clean, isDeliverable: true });
          } else {
            box.innerHTML = '<div class="p-3 bg-[#FEF3C7] border border-[#FDE68A] rounded-xl text-xs text-[#78350F] space-y-2"><div class="font-bold">📍 Not in our launch area yet.</div><p class="text-[11px] text-[#57534E]">Click below to register this pincode for launch prioritization.</p><button type="button" onclick="joinPincodeWaitlist(\\'' + clean + '\\')" class="bg-[#78350F] text-white text-xs font-bold px-3 py-1.5 rounded-lg shadow-sm">Join Waitlist for ' + clean + '</button></div>';
            window.CT_APP.track('pincode_checked', { pincode: clean, isDeliverable: false });
          }
        } else {
          box.classList.add('hidden');
        }
      }

      function joinPincodeWaitlist(pin) {
        window.CT_APP.track('waitlist_optin', {
          pincode: pin,
          email: document.getElementById('cust-email').value,
          phone: document.getElementById('cust-phone').value,
          reason: 'out_of_area_pincode'
        });
        document.getElementById('pincode-status-box').innerHTML = '<div class="p-2.5 bg-[#DCFCE7] border border-[#86EFAC] rounded-xl text-xs font-bold text-[#15803D]">✓ Pincode ' + pin + ' added to launch priority list!</div>';
      }

      function selectPayMethod(m) {
        selectedMethod = m;
        window.CT_APP.track('payment_method_selected', { paymentMethod: m });
        ['upi', 'card', 'cod'].forEach(id => {
          const btn = document.getElementById('pay-btn-' + id);
          if (id === m) {
            btn.className = 'py-3.5 px-4 rounded-2xl border-2 border-[#C2410C] bg-[#FFF7ED] text-[#C2410C] font-black text-center transition flex flex-col items-center justify-center space-y-1';
          } else {
            btn.className = 'py-3.5 px-4 rounded-2xl border-2 border-[#E7E5E4] bg-[#FAF7F2] text-[#57534E] text-center transition flex flex-col items-center justify-center space-y-1 hover:border-[#D6D3D1]';
          }
        });
      }

      function handlePaySubmit(e) {
        e.preventDefault();
        const name = document.getElementById('cust-name').value;
        const phone = document.getElementById('cust-phone').value;
        const email = document.getElementById('cust-email').value;
        const pincode = document.getElementById('cust-pincode').value;
        const address = document.getElementById('cust-address').value;

        window.CT_APP.track('pay_clicked', {
          pack: cartData.pack,
          flavour: cartData.flavour,
          quantity: cartData.quantity,
          totalAmount: cartData.totalPrice,
          paymentMethod: selectedMethod,
          pincode: pincode,
          isDeliverable: pincodeDeliverable,
          customerName: name,
          customerPhone: phone,
          customerEmail: email
        });

        sessionStorage.setItem('ct_order_summary', JSON.stringify({
          pack: cartData.pack,
          flavour: cartData.flavour,
          quantity: cartData.quantity,
          totalPrice: cartData.totalPrice,
          paymentMethod: selectedMethod,
          name: name,
          email: email,
          phone: phone,
          pincode: pincode
        }));

        window.location.href = '/reveal';
      }

      window.addEventListener('load', function() {
        const stored = sessionStorage.getItem('ct_cart');
        if (stored) {
          try {
            cartData = JSON.parse(stored);
          } catch(e) {}
        }
        const p = window.CT_APP.pricing;
        const uPrice = cartData.pack === 'three_pack' ? p.threePackPrice : p.singlePrice;
        cartData.unitPrice = uPrice;
        cartData.totalPrice = uPrice * (cartData.quantity || 1);

        const title = cartData.pack === 'three_pack' ? '3-Flavour Variety Pack (3 x 150g)' : ('Single Tube (150g) • ' + (cartData.flavour || 'Mint'));
        document.getElementById('chk-item-name').textContent = title;
        document.getElementById('chk-qty').textContent = 'Quantity: ' + cartData.quantity;
        document.getElementById('chk-total').textContent = '₹' + cartData.totalPrice;
        document.getElementById('chk-grand-total').textContent = '₹' + cartData.totalPrice;
        document.getElementById('pay-action-text').textContent = 'Pay ₹' + cartData.totalPrice;

        window.CT_APP.track('checkout_started', {
          pack: cartData.pack,
          totalAmount: cartData.totalPrice
        });
      });
    </script>
  `
  );
}

// Route: Reveal Page (Unmistakable Honest Reveal)
function renderRevealPage() {
  const c = productConfig;
  return renderHtmlShell(
    "Demand Verification Complete",
    `
    <header class="bg-white border-b border-[#E7E5E4] py-4 px-4 sm:px-8">
      <div class="max-w-3xl mx-auto flex items-center justify-between">
        <a href="/" class="flex items-center space-x-2">
          <div class="w-8 h-8 rounded-lg bg-[#C2410C] flex items-center justify-center text-white font-black text-sm">C</div>
          <span class="font-extrabold text-lg text-[#1C1917] font-heading">${c.brand.name}</span>
        </a>
        <span class="text-xs font-bold text-[#15803D] bg-[#DCFCE7] px-2.5 py-1 rounded-full">
          ● Demand Verification Complete
        </span>
      </div>
    </header>

    <main class="max-w-2xl mx-auto w-full p-4 sm:p-6 my-6 flex-1">
      <div class="bg-white rounded-3xl p-6 sm:p-8 border-2 border-[#15803D] shadow-xl text-center space-y-4 relative overflow-hidden">
        <div class="w-16 h-16 rounded-full bg-[#DCFCE7] text-[#15803D] flex items-center justify-center text-3xl mx-auto border-4 border-[#86EFAC]">
          ✓
        </div>

        <div class="space-y-1">
          <h1 class="text-2xl sm:text-3xl font-black text-[#1C1917] tracking-tight font-heading">
            You haven't been charged. We're not live yet!
          </h1>
          <p class="text-xs sm:text-sm font-bold text-[#15803D] uppercase tracking-wider">
            No money was deducted • No card details were collected
          </p>
        </div>

        <div class="text-sm text-[#57534E] leading-relaxed max-w-lg mx-auto bg-[#FAF7F2] p-4 rounded-2xl border border-[#E7E5E4]">
          <p>You're one of the first people who wanted this, and that helps us decide to launch!</p>
          <p class="mt-2 text-xs text-[#78716C]">
            We are testing real customer demand before setting up our commercial food-grade tube packaging line in Bengaluru.
          </p>
        </div>

        <div id="survey-form-container">
          <form onsubmit="handleSurveySubmit(event)" class="pt-4 text-left space-y-5 border-t border-[#E7E5E4]">
            <!-- Launch Discount Single Opt-In (Unchecked by default) -->
            <div class="bg-[#FEF3C7] p-4 rounded-2xl border border-[#FDE68A]">
              <label class="flex items-start space-x-3 cursor-pointer">
                <input type="checkbox" id="chk-discount" class="mt-0.5 w-5 h-5 rounded border-[#D97706] text-[#C2410C]">
                <div class="text-xs sm:text-sm">
                  <strong class="text-[#78350F] block">Want an exclusive 20% launch-day discount?</strong>
                  <span class="text-[#92400E] text-xs">
                    Check this box if you'd like us to notify you via WhatsApp / email as soon as our first batch rolls out. (Optional, unchecked by default)
                  </span>
                </div>
              </label>
            </div>

            <!-- Feedback Q1 -->
            <div>
              <label class="block text-xs font-bold text-[#1C1917] mb-1">
                What almost stopped you from buying? <span class="font-normal text-[#78716C]">(Optional)</span>
              </label>
              <textarea id="feedback-text" rows="2" placeholder="e.g. Price, wanted to see ingredients first, flavour preference, bottle size..." class="w-full text-xs sm:text-sm px-3.5 py-2.5 rounded-xl border border-[#D6D3D1] bg-[#FAF7F2] focus:bg-white focus:border-[#C2410C] transition"></textarea>
            </div>

            <!-- Feedback Q2 -->
            <div>
              <label class="block text-xs font-bold text-[#1C1917] mb-2">
                How often would you use it? <span class="font-normal text-[#78716C]">(Optional)</span>
              </label>
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <label class="flex items-center space-x-2.5 p-3 rounded-xl border border-[#E7E5E4] bg-[#FAF7F2] text-xs cursor-pointer hover:border-[#D6D3D1]">
                  <input type="radio" name="freq" value="daily" class="text-[#C2410C]">
                  <span>Daily (with tiffin / desk lunch)</span>
                </label>
                <label class="flex items-center space-x-2.5 p-3 rounded-xl border border-[#E7E5E4] bg-[#FAF7F2] text-xs cursor-pointer hover:border-[#D6D3D1]">
                  <input type="radio" name="freq" value="few_times_a_week" class="text-[#C2410C]">
                  <span>A few times a week</span>
                </label>
                <label class="flex items-center space-x-2.5 p-3 rounded-xl border border-[#E7E5E4] bg-[#FAF7F2] text-xs cursor-pointer hover:border-[#D6D3D1]">
                  <input type="radio" name="freq" value="weekly" class="text-[#C2410C]">
                  <span>Weekly (weekend snacks / chaat)</span>
                </label>
                <label class="flex items-center space-x-2.5 p-3 rounded-xl border border-[#E7E5E4] bg-[#FAF7F2] text-xs cursor-pointer hover:border-[#D6D3D1]">
                  <input type="radio" name="freq" value="rarely" class="text-[#C2410C]">
                  <span>Rarely / Travel only</span>
                </label>
              </div>
            </div>

            <button type="submit" class="w-full bg-[#1C1917] hover:bg-[#292524] text-white font-black text-sm py-3.5 rounded-2xl shadow transition font-heading">
              Send Feedback &amp; Save Preference →
            </button>
          </form>
        </div>

        <div id="survey-ack" class="hidden pt-6 border-t border-[#E7E5E4] space-y-4">
          <div class="p-4 bg-[#DCFCE7] rounded-2xl text-[#15803D] font-bold text-sm">
            🎉 Thank you! Your honest input directly shapes whether this product gets made.
          </div>
          <p class="text-xs text-[#57534E]">
            If we manufacture our first batch, you will be among the very first to know with VIP pricing.
          </p>
          <div class="pt-2">
            <a href="/" class="inline-block text-xs font-bold text-[#C2410C] hover:underline">
              Return to Homepage
            </a>
          </div>
        </div>
      </div>
    </main>

    <footer class="text-center py-6 text-xs text-[#78716C] border-t border-[#E7E5E4]">
      <p>© ${new Date().getFullYear()} ${c.brand.name}. Validation Experiment.</p>
    </footer>

    <script>
      function handleSurveySubmit(e) {
        e.preventDefault();
        const optIn = document.getElementById('chk-discount').checked;
        const feedback = document.getElementById('feedback-text').value;
        const selectedFreq = document.querySelector('input[name="freq"]:checked')?.value || '';

        let orderSummary = {};
        try {
          orderSummary = JSON.parse(sessionStorage.getItem('ct_order_summary') || '{}');
        } catch(e) {}

        window.CT_APP.track('survey_submitted', {
          optInDiscount: optIn,
          feedback: feedback,
          frequency: selectedFreq,
          contact: orderSummary.email || orderSummary.phone || '',
          orderSummary: orderSummary
        });

        if (optIn) {
          window.CT_APP.track('waitlist_optin', {
            email: orderSummary.email,
            phone: orderSummary.phone,
            discountOptIn: true
          });
        }

        document.getElementById('survey-form-container').classList.add('hidden');
        document.getElementById('survey-ack').classList.remove('hidden');
      }
    </script>
  `
  );
}

// Route: Admin Dashboard
function renderAdminPage() {
  const c = productConfig;
  return renderHtmlShell(
    "Admin Analytics Dashboard",
    `
    <div id="admin-app" class="min-h-screen bg-[#FAF7F2]">
      <!-- Login Prompt (Shown when not authenticated) -->
      <div id="login-container" class="min-h-screen flex items-center justify-center p-4">
        <div class="bg-white rounded-3xl p-8 border border-[#E7E5E4] shadow-xl max-w-md w-full space-y-6">
          <div class="text-center space-y-2">
            <div class="w-12 h-12 rounded-2xl bg-[#C2410C] text-white flex items-center justify-center font-black text-xl mx-auto shadow-md">📊</div>
            <h1 class="text-2xl font-black text-[#1C1917] font-heading">Demand Test Admin</h1>
            <p class="text-xs text-[#57534E]">Protected analytics for ${c.brand.name} demand testing.</p>
          </div>

          <form onsubmit="handleAdminLogin(event)" class="space-y-4">
            <div>
              <label class="block text-xs font-bold text-[#1C1917] mb-1">Admin Access Password</label>
              <input type="password" id="admin-pwd" required placeholder="Enter password..." class="w-full text-sm px-4 py-3 rounded-xl border border-[#D6D3D1] bg-[#FAF7F2] focus:bg-white focus:border-[#C2410C] transition">
              <span class="text-[10px] text-[#78716C] mt-1 block">Default password: chutney2026</span>
            </div>

            <div id="login-err" class="hidden p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl font-medium"></div>

            <button type="submit" class="w-full bg-[#C2410C] hover:bg-[#9A3412] text-white font-black text-sm py-3.5 rounded-xl shadow transition font-heading">
              Unlock Dashboard
            </button>
          </form>

          <div class="text-center pt-2">
            <a href="/" class="text-xs text-[#57534E] hover:underline">← Return to Landing Page</a>
          </div>
        </div>
      </div>

      <!-- Dashboard View (Shown after authentication) -->
      <div id="dash-container" class="hidden">
        <header class="bg-white border-b border-[#E7E5E4] py-4 px-4 sm:px-8 sticky top-0 z-30 shadow-sm">
          <div class="max-w-7xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div class="flex items-center space-x-3">
              <div class="w-8 h-8 rounded-lg bg-[#C2410C] flex items-center justify-center text-white font-black text-sm">C</div>
              <div>
                <span class="font-extrabold text-base text-[#1C1917] font-heading">${c.brand.name} Analytics</span>
                <span class="ml-2 text-[10px] uppercase font-bold bg-[#DCFCE7] text-[#15803D] px-2 py-0.5 rounded-full">
                  Pre-Launch Live Funnel
                </span>
              </div>
            </div>

            <div class="flex items-center space-x-3">
              <a href="/api/export?password=chutney2026" id="btn-export-csv" class="bg-[#1C1917] hover:bg-[#292524] text-[#FEF3C7] text-xs font-bold px-4 py-2 rounded-xl shadow-sm transition flex items-center space-x-1.5 font-heading">
                <span>📥</span>
                <span>Export CSV</span>
              </a>
              <button onclick="loadDashboardData()" class="bg-[#FAF7F2] hover:bg-[#E7E5E4] text-[#1C1917] text-xs font-bold px-3 py-2 rounded-xl border border-[#D6D3D1] transition">
                ↻ Refresh
              </button>
              <button onclick="handleLogout()" class="text-xs text-red-600 font-bold hover:underline">
                Logout
              </button>
            </div>
          </div>
        </header>

        <main class="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 space-y-8" id="metrics-content">
          <!-- Dynamic Metrics inserted here -->
        </main>
      </div>
    </div>

    <script>
      let adminToken = sessionStorage.getItem('ct_admin_token') || '';

      function handleAdminLogin(e) {
        e.preventDefault();
        const pwd = document.getElementById('admin-pwd').value;
        fetch('/api/admin', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ password: pwd })
        }).then(res => res.json()).then(data => {
          if (data.authenticated) {
            adminToken = data.token;
            sessionStorage.setItem('ct_admin_token', adminToken);
            document.getElementById('btn-export-csv').href = '/api/export?password=' + encodeURIComponent(pwd);
            showDashboard();
          } else {
            const err = document.getElementById('login-err');
            err.textContent = data.error || 'Invalid password.';
            err.classList.remove('hidden');
          }
        }).catch(err => {
          alert('Network error: ' + err.message);
        });
      }

      function showDashboard() {
        document.getElementById('login-container').classList.add('hidden');
        document.getElementById('dash-container').classList.remove('hidden');
        loadDashboardData();
      }

      function handleLogout() {
        sessionStorage.removeItem('ct_admin_token');
        window.location.reload();
      }

      function loadDashboardData() {
        fetch('/api/admin?token=' + encodeURIComponent(adminToken))
          .then(res => {
            if (!res.ok) throw new Error('Unauthorized');
            return res.json();
          })
          .then(renderDashboard)
          .catch(() => {
            document.getElementById('login-container').classList.remove('hidden');
            document.getElementById('dash-container').classList.add('hidden');
          });
      }

      function renderDashboard(data) {
        const o = data.overview;
        const html = \`
          <!-- Stat Cards -->
          <div class="grid grid-cols-2 lg:grid-cols-5 gap-4">
            <div class="bg-white rounded-2xl p-5 border border-[#E7E5E4] shadow-sm">
              <span class="text-xs text-[#57534E] font-medium block">Unique Visitors</span>
              <span class="text-2xl sm:text-3xl font-black text-[#1C1917] font-heading">\${o.totalVisitors}</span>
              <span class="text-[10px] text-[#78716C] block mt-1">Landed on page</span>
            </div>
            <div class="bg-white rounded-2xl p-5 border border-[#E7E5E4] shadow-sm">
              <span class="text-xs text-[#57534E] font-medium block">Added to Cart</span>
              <span class="text-2xl sm:text-3xl font-black text-[#1C1917] font-heading">\${o.totalAddToCart}</span>
              <span class="text-[10px] text-[#78716C] block mt-1">Clicked cart / buy</span>
            </div>
            <div class="bg-white rounded-2xl p-5 border border-[#E7E5E4] shadow-sm">
              <span class="text-xs text-[#57534E] font-medium block">Started Checkout</span>
              <span class="text-2xl sm:text-3xl font-black text-[#1C1917] font-heading">\${o.totalCheckout}</span>
              <span class="text-[10px] text-[#78716C] block mt-1">Filled delivery info</span>
            </div>
            <div class="bg-white rounded-2xl p-5 border-2 border-[#15803D] shadow-sm bg-[#F0FDF4]">
              <span class="text-xs text-[#15803D] font-bold block">Pay Clicked 🔥</span>
              <span class="text-2xl sm:text-3xl font-black text-[#15803D] font-heading">\${o.totalPayClicked}</span>
              <span class="text-[10px] text-[#166534] block mt-1 font-semibold">True purchase intent</span>
            </div>
            <div class="col-span-2 lg:col-span-1 bg-white rounded-2xl p-5 border border-[#E7E5E4] shadow-sm">
              <span class="text-xs text-[#57534E] font-medium block">Overall Conversion</span>
              <span class="text-2xl sm:text-3xl font-black text-[#C2410C] font-heading">\${o.overallConversionRate}</span>
              <span class="text-[10px] text-[#78716C] block mt-1">Visitors → Pay Clicks</span>
            </div>
          </div>

          <!-- Funnel Visualization -->
          <div class="bg-white rounded-3xl p-6 border border-[#E7E5E4] shadow-sm space-y-6">
            <div class="flex items-center justify-between">
              <div>
                <h2 class="text-lg font-black text-[#1C1917] font-heading">Demand Test Funnel</h2>
                <p class="text-xs text-[#57534E]">Real user progression through the fake-door checkout flow.</p>
              </div>
              <span class="text-xs font-bold text-[#57534E]">Total Events Logged: \${o.totalEvents}</span>
            </div>

            <div class="space-y-4">
              \${data.funnel.map((s, idx) => \`
                <div class="space-y-1.5">
                  <div class="flex items-center justify-between text-xs sm:text-sm">
                    <span class="font-extrabold text-[#1C1917] font-heading">\${s.step}</span>
                    <div class="space-x-3">
                      <span class="font-black text-[#1C1917]">\${s.count} users</span>
                      <span class="font-bold text-[#C2410C]">(\${s.pctOfTotal}%)</span>
                    </div>
                  </div>
                  <div class="w-full h-4 bg-[#FAF7F2] rounded-full overflow-hidden border border-[#E7E5E4]">
                    <div class="h-full rounded-full transition-all duration-500 \${idx === 3 ? 'bg-[#15803D]' : 'bg-[#C2410C]'}" style="width: \${Math.max(s.pctOfTotal, 4)}%"></div>
                  </div>
                </div>
              \`).join('')}
            </div>
          </div>

          <!-- Price Variants & Traffic Sources -->
          <div class="grid grid-cols-1 lg:grid-cols-12 gap-8">
            <div class="lg:col-span-7 bg-white rounded-3xl p-6 border border-[#E7E5E4] shadow-sm space-y-4">
              <h3 class="font-black text-base text-[#1C1917] font-heading">A/B/C Price Variant Breakdown</h3>
              <p class="text-xs text-[#57534E]">Compare willingness-to-pay across introductory (₹99), standard (₹149), and premium (₹199) price points.</p>
              <div class="overflow-x-auto">
                <table class="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr class="border-b border-[#E7E5E4] text-[#57534E] uppercase font-bold text-[10px]">
                      <th class="py-2.5 px-3">Variant</th>
                      <th class="py-2.5 px-3">Price (Single / 3-Pack)</th>
                      <th class="py-2.5 px-3">Visitors</th>
                      <th class="py-2.5 px-3">Pay Clicks</th>
                      <th class="py-2.5 px-3">Conversion</th>
                    </tr>
                  </thead>
                  <tbody class="divide-y divide-[#E7E5E4]">
                    \${data.variantsSummary.map(v => \`
                      <tr class="hover:bg-[#FAF7F2]">
                        <td class="py-3 px-3 font-bold text-[#1C1917]">Variant \${v.variant}</td>
                        <td class="py-3 px-3 font-medium">₹\${v.singlePrice} / ₹\${v.packPrice}</td>
                        <td class="py-3 px-3 text-[#57534E]">\${v.visitors}</td>
                        <td class="py-3 px-3 font-bold text-[#15803D]">\${v.payClicks}</td>
                        <td class="py-3 px-3 font-extrabold text-[#C2410C]">\${v.conversionRate}</td>
                      </tr>
                    \`).join('')}
                  </tbody>
                </table>
              </div>
            </div>

            <div class="lg:col-span-5 bg-white rounded-3xl p-6 border border-[#E7E5E4] shadow-sm space-y-4">
              <h3 class="font-black text-base text-[#1C1917] font-heading">Traffic Sources (?src=)</h3>
              <p class="text-xs text-[#57534E]">Conversion performance by channel (WhatsApp, Instagram, Office Slack, etc.)</p>
              <div class="space-y-2.5">
                \${data.sourcesSummary.length === 0 ? '<div class="text-xs text-[#78716C] py-4 text-center">No source traffic logged yet.</div>' :
                  data.sourcesSummary.map(s => \`
                    <div class="flex items-center justify-between p-3 bg-[#FAF7F2] rounded-xl border border-[#E7E5E4] text-xs">
                      <span class="font-bold text-[#1C1917] capitalize">\${s.source}</span>
                      <div class="space-x-3 text-right">
                        <span class="text-[#57534E]">\${s.visitors} vis</span>
                        <span class="font-bold text-[#15803D]">\${s.payClicks} pays</span>
                        <span class="font-extrabold text-[#C2410C]">(\${s.conversionRate})</span>
                      </div>
                    </div>
                  \`).join('')}
              </div>
            </div>
          </div>

          <!-- Flavours & Packs -->
          <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div class="bg-white rounded-3xl p-6 border border-[#E7E5E4] shadow-sm space-y-4">
              <h3 class="font-black text-base text-[#1C1917] font-heading">Flavour Popularity</h3>
              <div class="space-y-3 text-xs">
                <div class="flex justify-between items-center"><span class="font-bold">🌿 Mint-Coriander (Hari)</span><span class="font-black">\${data.flavourCounts["mint-coriander"]} adds</span></div>
                <div class="flex justify-between items-center"><span class="font-bold">🌶️ Garlic-Chilli (Spicy)</span><span class="font-black">\${data.flavourCounts["garlic-chilli"]} adds</span></div>
                <div class="flex justify-between items-center"><span class="font-bold">✨ Tamarind (Imli Sweet)</span><span class="font-black">\${data.flavourCounts["tamarind"]} adds</span></div>
              </div>
            </div>

            <div class="bg-white rounded-3xl p-6 border border-[#E7E5E4] shadow-sm space-y-4">
              <h3 class="font-black text-base text-[#1C1917] font-heading">Pack Preference &amp; Pincodes</h3>
              <div class="space-y-3 text-xs">
                <div class="flex justify-between items-center"><span class="font-bold">Single Tube (150g)</span><span class="font-black">\${data.packCounts.single} adds</span></div>
                <div class="flex justify-between items-center"><span class="font-bold">3-Flavour Variety Pack</span><span class="font-black text-[#C2410C]">\${data.packCounts.three_pack} adds</span></div>
                <div class="pt-2 border-t border-[#E7E5E4] flex justify-between items-center text-[#57534E]">
                  <span>Pincode Checks:</span>
                  <span>\${data.pincodeStats.deliverable} in-area / \${data.pincodeStats.outOfArea} out-of-area</span>
                </div>
              </div>
            </div>
          </div>

          <!-- Voice of Customer: What Almost Stopped You? -->
          <div class="bg-white rounded-3xl p-6 border border-[#E7E5E4] shadow-sm space-y-4">
            <div class="flex items-center justify-between">
              <div>
                <h3 class="font-black text-base text-[#1C1917] font-heading">Voice of Customer: What Almost Stopped You?</h3>
                <p class="text-xs text-[#57534E]">Direct qualitative answers from visitors at the honest reveal screen.</p>
              </div>
              <span class="text-xs font-bold bg-[#FEF3C7] text-[#78350F] px-3 py-1 rounded-full">\${data.surveyResponses.length} Responses</span>
            </div>

            \${data.surveyResponses.length === 0 ? '<div class="text-center py-8 text-xs text-[#78716C]">No survey feedback answers submitted yet.</div>' : \`
              <div class="divide-y divide-[#E7E5E4] max-h-96 overflow-y-auto">
                \${data.surveyResponses.map(r => \`
                  <div class="py-3 space-y-1">
                    <div class="flex items-center justify-between text-[11px] text-[#78716C]">
                      <span>Visitor: \${r.visitorId}</span>
                      <span>\${new Date(r.timestamp).toLocaleString()}</span>
                    </div>
                    \${r.feedback ? \`<p class="text-xs font-medium text-[#1C1917] bg-[#FAF7F2] p-2.5 rounded-xl border border-[#E7E5E4]">&ldquo;\${r.feedback}&rdquo;</p>\` : ''}
                    <div class="flex items-center gap-2 text-[10px] text-[#57534E]">
                      \${r.frequency ? \`<span class="bg-[#E7E5E4] px-2 py-0.5 rounded font-bold">Frequency: \${r.frequency}</span>\` : ''}
                      \${r.optInDiscount ? \`<span class="bg-[#DCFCE7] text-[#15803D] px-2 py-0.5 rounded font-bold">✓ Opted-in for 20% discount</span>\` : ''}
                      \${r.contact ? \`<span class="text-[#78350F]">Contact: \${r.contact}</span>\` : ''}
                    </div>
                  </div>
                \`).join('')}
              </div>
            \`}
          </div>
        \`;
        document.getElementById('metrics-content').innerHTML = html;
      }

      window.addEventListener('load', function() {
        if (adminToken) {
          showDashboard();
        }
      });
    </script>
  `
  );
}

// Route: Privacy Policy
function renderPrivacyPage() {
  const c = productConfig;
  return renderHtmlShell(
    "Privacy Policy (DPDP Act)",
    `
    <header class="bg-white border-b border-[#E7E5E4] py-4 px-4 sm:px-8">
      <div class="max-w-4xl mx-auto flex items-center justify-between">
        <a href="/" class="flex items-center space-x-2">
          <div class="w-8 h-8 rounded-lg bg-[#C2410C] flex items-center justify-center text-white font-black text-sm">C</div>
          <span class="font-extrabold text-lg text-[#1C1917] font-heading">${c.brand.name}</span>
        </a>
        <a href="/" class="text-xs font-bold text-[#C2410C] hover:underline">← Return to Home</a>
      </div>
    </header>

    <main class="max-w-3xl mx-auto w-full p-6 sm:p-10 my-8 bg-white rounded-3xl border border-[#E7E5E4] shadow-sm space-y-6 flex-1">
      <div>
        <span class="text-xs font-bold text-[#C2410C] uppercase tracking-wider font-heading">Legal &amp; Compliance</span>
        <h1 class="text-2xl sm:text-3xl font-black text-[#1C1917] mt-1 font-heading">Privacy Policy</h1>
        <p class="text-xs text-[#78716C] mt-1">Compliant with the Digital Personal Data Protection Act, 2023 (India)</p>
      </div>

      <div class="space-y-4 text-sm text-[#57534E] leading-relaxed">
        <section class="space-y-2">
          <h2 class="text-base font-extrabold text-[#1C1917] font-heading">1. Purpose of Processing</h2>
          <p>This website is operated as a pre-launch demand validation project to evaluate whether Indian consumers desire home-style chutney in a squeezable tube before commencing manufacturing.</p>
        </section>

        <section class="space-y-2">
          <h2 class="text-base font-extrabold text-[#1C1917] font-heading">2. Data We Collect (Data Minimization)</h2>
          <p>We collect only contact information (Name, WhatsApp/phone, email), delivery pincode, and optional survey answers. <strong>We NEVER collect payment cards, CVVs, or UPI PINs.</strong></p>
        </section>

        <section class="space-y-2">
          <h2 class="text-base font-extrabold text-[#1C1917] font-heading">3. Your Rights as a Data Principal</h2>
          <p>You may request data correction, access, or complete erasure at any time by emailing our Grievance Contact at <a href="mailto:${c.brand.contactEmail}" class="text-[#C2410C] underline font-bold">${c.brand.contactEmail}</a>.</p>
        </section>
      </div>
    </main>

    <footer class="py-6 text-center text-xs text-[#78716C] border-t border-[#E7E5E4]">
      <p>© ${new Date().getFullYear()} ${c.brand.name}. All rights reserved.</p>
    </footer>
  `
  );
}

// Route: Terms Page
function renderTermsPage() {
  const c = productConfig;
  return renderHtmlShell(
    "Terms of Pre-Launch Testing",
    `
    <header class="bg-white border-b border-[#E7E5E4] py-4 px-4 sm:px-8">
      <div class="max-w-4xl mx-auto flex items-center justify-between">
        <a href="/" class="flex items-center space-x-2">
          <div class="w-8 h-8 rounded-lg bg-[#C2410C] flex items-center justify-center text-white font-black text-sm">C</div>
          <span class="font-extrabold text-lg text-[#1C1917] font-heading">${c.brand.name}</span>
        </a>
        <a href="/" class="text-xs font-bold text-[#C2410C] hover:underline">← Return to Home</a>
      </div>
    </header>

    <main class="max-w-3xl mx-auto w-full p-6 sm:p-10 my-8 bg-white rounded-3xl border border-[#E7E5E4] shadow-sm space-y-6 flex-1">
      <div>
        <span class="text-xs font-bold text-[#C2410C] uppercase tracking-wider font-heading">Consumer Notice</span>
        <h1 class="text-2xl sm:text-3xl font-black text-[#1C1917] mt-1 font-heading">Terms of Pre-Launch Testing</h1>
      </div>

      <div class="space-y-4 text-sm text-[#57534E] leading-relaxed">
        <section class="space-y-2">
          <h2 class="text-base font-extrabold text-[#1C1917] font-heading">1. Non-Commercial Nature</h2>
          <p>This is a demand validation prototype ("fake door test"). No binding commercial contract, charge, or payment processing occurs on this website.</p>
        </section>
        <section class="space-y-2">
          <h2 class="text-base font-extrabold text-[#1C1917] font-heading">2. Specifications Subject to TBD</h2>
          <p>All packaging volumes, formulations, and shelf life parameters marked with [TBD] are subject to active laboratory formulation.</p>
        </section>
      </div>
    </main>

    <footer class="py-6 text-center text-xs text-[#78716C] border-t border-[#E7E5E4]">
      <p>© ${new Date().getFullYear()} ${c.brand.name}. All rights reserved.</p>
    </footer>
  `
  );
}

// HTTP Server
const server = http.createServer((req, res) => {
  const parsed = url.parse(req.url, true);
  const pathname = parsed.pathname;

  // Static Assets from public/
  if (pathname.startsWith("/images/")) {
    const filePath = path.join(PUBLIC_DIR, pathname);
    if (fs.existsSync(filePath)) {
      res.writeHead(200, { "Content-Type": "image/svg+xml" });
      return fs.createReadStream(filePath).pipe(res);
    }
    res.writeHead(404);
    return res.end("Not Found");
  }

  // API Route: POST /api/events
  if (pathname === "/api/events" && req.method === "POST") {
    let body = "";
    req.on("data", (chunk) => (body += chunk));
    req.on("end", () => {
      try {
        const payload = JSON.parse(body);
        const events = readEvents();
        events.push(payload);
        writeEvents(events);
        res.writeHead(201, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ success: true, count: events.length }));
      } catch (err) {
        res.writeHead(400, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: err.message }));
      }
    });
    return;
  }

  // API Route: POST /api/admin (Login)
  if (pathname === "/api/admin" && req.method === "POST") {
    let body = "";
    req.on("data", (chunk) => (body += chunk));
    req.on("end", () => {
      try {
        const { password } = JSON.parse(body);
        const correctPassword = process.env.ADMIN_PASSWORD || productConfig.brand.adminPassword || "chutney2026";
        if (password === correctPassword) {
          res.writeHead(200, { "Content-Type": "application/json" });
          res.end(JSON.stringify({ authenticated: true, token: "admin_auth_valid" }));
        } else {
          res.writeHead(401, { "Content-Type": "application/json" });
          res.end(JSON.stringify({ authenticated: false, error: "Incorrect password" }));
        }
      } catch (err) {
        res.writeHead(500, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: err.message }));
      }
    });
    return;
  }

  // API Route: GET /api/admin (Metrics)
  if (pathname === "/api/admin" && req.method === "GET") {
    const token = parsed.query.token;
    const correctPassword = process.env.ADMIN_PASSWORD || productConfig.brand.adminPassword || "chutney2026";
    if (token !== "admin_auth_valid" && parsed.query.password !== correctPassword) {
      res.writeHead(401, { "Content-Type": "application/json" });
      return res.end(JSON.stringify({ error: "Unauthorized" }));
    }
    const events = readEvents();
    const metrics = calculateMetrics(events);
    res.writeHead(200, { "Content-Type": "application/json" });
    return res.end(JSON.stringify(metrics));
  }

  // API Route: GET /api/export (CSV)
  if (pathname === "/api/export") {
    const correctPassword = process.env.ADMIN_PASSWORD || productConfig.brand.adminPassword || "chutney2026";
    const isAuth = parsed.query.token === "admin_auth_valid" || parsed.query.password === correctPassword;
    if (!isAuth) {
      res.writeHead(401, { "Content-Type": "text/plain" });
      return res.end("Unauthorized");
    }
    const events = readEvents();
    const csv = generateCsvString(events);
    res.writeHead(200, {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="chutney-tubes-demand-test-${new Date().toISOString().slice(0, 10)}.csv"`,
    });
    return res.end(csv);
  }

  // Frontend HTML Page Routes
  res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
  if (pathname === "/" || pathname === "/index.html") {
    return res.end(renderLandingPage());
  } else if (pathname === "/checkout") {
    return res.end(renderCheckoutPage());
  } else if (pathname === "/reveal") {
    return res.end(renderRevealPage());
  } else if (pathname === "/admin") {
    return res.end(renderAdminPage());
  } else if (pathname === "/privacy") {
    return res.end(renderPrivacyPage());
  } else if (pathname === "/terms") {
    return res.end(renderTermsPage());
  }

  res.writeHead(404, { "Content-Type": "text/plain" });
  res.end("Not Found");
});

server.listen(PORT, () => {
  console.log(`\n======================================================`);
  console.log(`🚀 ${productConfig.brand.name} Demand Test Server running at:`);
  console.log(`   http://localhost:${PORT}`);
  console.log(`   Admin Dashboard: http://localhost:${PORT}/admin`);
  console.log(`   Admin Password:  ${process.env.ADMIN_PASSWORD || productConfig.brand.adminPassword || "chutney2026"}`);
  console.log(`======================================================\n`);
});
