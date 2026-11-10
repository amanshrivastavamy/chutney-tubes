/**
 * Production-Ready Standalone Server for Chutney Tubes
 * Pure Node.js (or agy-node) runner with zero external dependencies.
 */

const http = require("http");
const fs = require("fs");
const path = require("path");

const { storeConfig, getPostalZone, isValidPincode, formatInr } = require("./src/config/store.js");
const { calculateDashboardMetrics } = require("./src/lib/metrics.js");

const PORT = process.env.PORT || 3000;
const DATA_DIR = path.join(__dirname, "data");
const EVENTS_FILE = path.join(DATA_DIR, "events.json");
const SIGNUPS_FILE = path.join(DATA_DIR, "signups.json");
const REQUESTS_FILE = path.join(DATA_DIR, "requests.json");
const PUBLIC_DIR = path.join(__dirname, "public");

// Ensure data files exist
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
if (!fs.existsSync(EVENTS_FILE)) fs.writeFileSync(EVENTS_FILE, "[]", "utf-8");
if (!fs.existsSync(SIGNUPS_FILE)) fs.writeFileSync(SIGNUPS_FILE, "[]", "utf-8");
if (!fs.existsSync(REQUESTS_FILE)) fs.writeFileSync(REQUESTS_FILE, "[]", "utf-8");

function readJsonFile(fp) {
  try {
    return JSON.parse(fs.readFileSync(fp, "utf-8") || "[]");
  } catch (e) {
    return [];
  }
}

function writeJsonFile(fp, data) {
  try {
    fs.writeFileSync(fp, JSON.stringify(data, null, 2), "utf-8");
  } catch (e) {
    console.error("Write file error:", e);
  }
}

function escapeCsv(val) {
  if (val === undefined || val === null) return '""';
  return `"${String(val).replace(/"/g, '""')}"`;
}

function generateEventsCsv(events) {
  const headers = [
    "Timestamp", "Event", "Visitor_ID", "Session_ID", "Price_Variant",
    "Is_Internal", "UTM_Source", "UTM_Campaign", "Kind", "Flavours",
    "Quantity", "Total_Amount", "Postal_Zone", "Pincode_Prefix",
    "Payment_Method", "Tube_Feeling", "What_Stopped_You", "Usage_Frequency",
  ];
  const rows = events.map((ev) => {
    const p = ev.payload || {};
    const utm = ev.utm || {};
    return [
      escapeCsv(ev.timestamp),
      escapeCsv(ev.event),
      escapeCsv(ev.visitorId),
      escapeCsv(ev.sessionId),
      escapeCsv(ev.variant),
      escapeCsv(ev.isInternal ? "true" : "false"),
      escapeCsv(utm.utm_source),
      escapeCsv(utm.utm_campaign),
      escapeCsv(p.kind),
      escapeCsv(Array.isArray(p.flavours) ? p.flavours.join(";") : p.flavour),
      escapeCsv(p.qty || p.quantity),
      escapeCsv(p.total || p.unitPrice),
      escapeCsv(p.zone),
      escapeCsv(p.pinPrefix),
      escapeCsv(p.method || p.paymentMethod),
      escapeCsv(p.tubeFeeling),
      escapeCsv(p.stoppedText),
      escapeCsv(p.frequency),
    ].join(",");
  });
  return [headers.join(","), ...rows].join("\r\n");
}

function generateSignupsCsv(signups) {
  const headers = ["Timestamp", "Email", "Price_Variant", "Campaign", "Visitor_ID"];
  const rows = signups.map((s) => [
    escapeCsv(s.timestamp),
    escapeCsv(s.email),
    escapeCsv(s.variant),
    escapeCsv(s.utm_campaign),
    escapeCsv(s.visitorId),
  ].join(","));
  return [headers.join(","), ...rows].join("\r\n");
}

// Generate Photorealistic Tube SVG Render for a given flavour
function renderFlavourSvg(f, options = {}) {
  const isLight = f.id === "coconut";
  const textColor = isLight ? "#18241b" : "#ffffff";
  const subTextColor = isLight ? "#451a03" : "#fef3c7";
  const outlineColor = isLight ? "none" : "#18241b";
  const capGrad = isLight
    ? `<stop offset="0%" stop-color="#052e16"/><stop offset="35%" stop-color="#15803d"/><stop offset="50%" stop-color="#ffffff" stop-opacity="0.6"/><stop offset="70%" stop-color="#15803d"/><stop offset="100%" stop-color="#052e16"/>`
    : f.spice === 3
    ? `<stop offset="0%" stop-color="#450a0a"/><stop offset="35%" stop-color="#b91c1c"/><stop offset="50%" stop-color="#ffffff" stop-opacity="0.6"/><stop offset="70%" stop-color="#b91c1c"/><stop offset="100%" stop-color="#450a0a"/>`
    : `<stop offset="0%" stop-color="#b45309"/><stop offset="35%" stop-color="#f59e0b"/><stop offset="50%" stop-color="#ffffff" stop-opacity="0.6"/><stop offset="70%" stop-color="#f59e0b"/><stop offset="100%" stop-color="#92400e"/>`;

  return `
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400" width="100%" height="100%" fill="none">
    <defs>
      <!-- Photorealistic Cylindrical 3D Tube Shading -->
      <linearGradient id="shd_${f.id}" x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%" stop-color="#000000" stop-opacity="0.45" />
        <stop offset="12%" stop-color="#000000" stop-opacity="0.22" />
        <stop offset="28%" stop-color="${f.color}" />
        <stop offset="42%" stop-color="#ffffff" stop-opacity="0.35" />
        <stop offset="48%" stop-color="#ffffff" stop-opacity="0.55" />
        <stop offset="55%" stop-color="#ffffff" stop-opacity="0.2" />
        <stop offset="78%" stop-color="${f.color}" />
        <stop offset="92%" stop-color="#000000" stop-opacity="0.28" />
        <stop offset="100%" stop-color="#000000" stop-opacity="0.48" />
      </linearGradient>
      <linearGradient id="capG_${f.id}" x1="0%" y1="0%" x2="100%" y2="0%">
        ${capGrad}
      </linearGradient>
      <linearGradient id="stl_${f.id}" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#f8fafc" />
        <stop offset="25%" stop-color="#e2e8f0" />
        <stop offset="50%" stop-color="#ffffff" />
        <stop offset="75%" stop-color="#cbd5e1" />
        <stop offset="100%" stop-color="#64748b" />
      </linearGradient>
      <filter id="flvShd_${f.id}" x="-30%" y="-30%" width="160%" height="160%">
        <feDropShadow dx="2" dy="20" stdDeviation="16" flood-color="#18241b" flood-opacity="0.26" />
        <feDropShadow dx="1" dy="6" stdDeviation="5" flood-color="#18241b" flood-opacity="0.18" />
      </filter>
    </defs>

    <ellipse cx="200" cy="365" rx="140" ry="18" fill="#18241b" opacity="0.16" />
    <ellipse cx="190" cy="362" rx="100" ry="12" fill="#18241b" opacity="0.12" />

    <!-- Rotated 3D Food Tube Assembly -->
    <g transform="translate(190, 185) rotate(-12) translate(-55, -165)" filter="url(#flvShd_${f.id})">
      <path d="M 12 38 L 98 38 C 98 175 96 235 90 252 C 85 268 74 276 55 276 C 36 276 25 268 20 252 C 14 235 12 175 12 38 Z" fill="${f.color}" />
      <path d="M 12 38 L 98 38 C 98 175 96 235 90 252 C 85 268 74 276 55 276 C 36 276 25 268 20 252 C 14 235 12 175 12 38 Z" fill="url(#shd_${f.id})" />

      <!-- Specular softbox highlight stripe down the cylinder -->
      <path d="M 48 38 L 54 38 C 54 175 53 235 52 265 L 48 265 C 47 235 48 175 48 38 Z" fill="#ffffff" opacity="0.25" />

      <!-- Zigzag Crimped Top With Stamped Batch Code -->
      <rect x="10" y="16" width="90" height="24" fill="#000000" opacity="0.32" rx="2" />
      <path d="M 13 16 L 17 40 M 23 16 L 27 40 M 33 16 L 37 40 M 43 16 L 47 40 M 53 16 L 57 40 M 63 16 L 67 40 M 73 16 L 77 40 M 83 16 L 87 40 M 93 16 L 97 40" stroke="#ffffff" stroke-width="1.2" opacity="0.4" />
      <rect x="10" y="14" width="90" height="4" fill="#000000" opacity="0.45" />
      <text x="55" y="30" font-family="'Hind', sans-serif" font-size="5" font-weight="700" fill="#fde047" text-anchor="middle" letter-spacing="1.2" opacity="0.85">B.NO CT-26 • 100g</text>

      <!-- Toran Band -->
      <g transform="translate(14, 42)">
        <polygon points="4,0 8,8 0,8" fill="#f2b81d" />
        <polygon points="14,0 18,8 10,8" fill="#f2b81d" />
        <polygon points="24,0 28,8 20,8" fill="#f2b81d" />
        <polygon points="34,0 38,8 30,8" fill="#f2b81d" />
        <polygon points="44,0 48,8 40,8" fill="#f2b81d" />
        <polygon points="54,0 58,8 50,8" fill="#f2b81d" />
        <polygon points="64,0 68,8 60,8" fill="#f2b81d" />
        <polygon points="74,0 78,8 70,8" fill="#f2b81d" />
        <circle cx="4" cy="11" r="1.1" fill="#ffffff" />
        <circle cx="14" cy="11" r="1.1" fill="#ffffff" />
        <circle cx="24" cy="11" r="1.1" fill="#ffffff" />
        <circle cx="34" cy="11" r="1.1" fill="#ffffff" />
        <circle cx="44" cy="11" r="1.1" fill="#ffffff" />
        <circle cx="54" cy="11" r="1.1" fill="#ffffff" />
        <circle cx="64" cy="11" r="1.1" fill="#ffffff" />
        <circle cx="74" cy="11" r="1.1" fill="#ffffff" />
      </g>

      <!-- Haldi-Yellow Brand Sticker -->
      <g transform="translate(55, 94) rotate(-5)">
        <circle cx="0" cy="0" r="26" fill="#f2b81d" stroke="#ffffff" stroke-width="1.8" />
        <circle cx="0" cy="0" r="22" fill="none" stroke="#ffffff" stroke-width="1.3" stroke-dasharray="3 2" />
        <text x="0" y="-4" font-family="'Bricolage Grotesque', sans-serif" font-size="8.5" font-weight="900" fill="#18241b" text-anchor="middle" letter-spacing="0.5">CHUTNEY</text>
        <text x="0" y="8" font-family="'Bricolage Grotesque', sans-serif" font-size="9.5" font-weight="900" fill="#c8361f" text-anchor="middle" letter-spacing="1">TUBES</text>
      </g>

      <!-- Flavour Title -->
      <g transform="translate(55, 146)">
        <text x="0" y="0" font-family="'Bricolage Grotesque', sans-serif" font-size="10" font-weight="900" fill="${textColor}" text-anchor="middle" stroke="${outlineColor}" stroke-width="${isLight ? '0' : '0.6'}" letter-spacing="0.3">${f.name.toUpperCase()}</text>
        <text x="0" y="13" font-family="'Hind', sans-serif" font-size="9.5" font-weight="600" fill="${subTextColor}" text-anchor="middle">${f.hindi} चटनी</text>
        <line x1="-28" y1="18" x2="28" y2="18" stroke="#ffffff" stroke-width="0.9" opacity="0.65" />
      </g>

      <!-- Veg Mark & 100g -->
      <g transform="translate(22, 222)">
        <rect x="0" y="0" width="12" height="12" fill="#ffffff" stroke="#1d6b3a" stroke-width="1.4" rx="2" />
        <circle cx="6" cy="6" r="3.5" fill="#1d6b3a" />
      </g>
      <g transform="translate(86, 232)">
        <text x="0" y="0" font-family="'Hind', sans-serif" font-size="8.5" font-weight="700" fill="${textColor}" text-anchor="end">100 g</text>
      </g>

      <!-- 3D Flip Cap -->
      <g transform="translate(37, 275)">
        <rect x="4" y="0" width="28" height="7" fill="#000000" opacity="0.28" rx="1.5" />
        <path d="M 2 5 Q 18 -1 34 5 L 32 25 C 32 30 28 33 18 33 C 8 33 4 30 4 25 Z" fill="url(#capG_${f.id})" stroke="#ffffff" stroke-width="0.8" />
        <path d="M 8 9 Q 18 5 28 9" stroke="#ffffff" stroke-width="1.6" stroke-linecap="round" fill="none" opacity="0.6" />
        <rect x="13" y="25" width="10" height="4" rx="2" fill="#000000" opacity="0.25" />
      </g>
    </g>

    <!-- Brushed Steel Katori Beside Tube -->
    <g transform="translate(285, 305)" filter="url(#flvShd_${f.id})">
      <ellipse cx="0" cy="38" rx="55" ry="14" fill="#18241b" opacity="0.28" />
      <ellipse cx="0" cy="20" rx="50" ry="18" fill="url(#stl_${f.id})" stroke="#94a3b8" stroke-width="1.2" />
      <path d="M -50 20 C -50 40 50 40 50 20 Z" fill="url(#stl_${f.id})" stroke="#64748b" stroke-width="1.2" />
      <ellipse cx="0" cy="20" rx="47" ry="16" fill="none" stroke="#ffffff" stroke-width="1.2" opacity="0.8" />
      <ellipse cx="0" cy="18" rx="43" ry="14" fill="${f.color}" />
      <path d="M -18 18 Q 0 9 18 16 Q 9 23 -4 21" stroke="#ffffff" stroke-width="2.8" stroke-linecap="round" fill="none" opacity="0.58" />
      <circle cx="-8" cy="14" r="1.6" fill="#18241b" opacity="0.75" />
      <circle cx="10" cy="19" r="1.4" fill="#18241b" opacity="0.75" />
      <circle cx="16" cy="13" r="1.4" fill="#f2b81d" opacity="0.9" />
      <circle cx="-2" cy="22" r="1.2" fill="#fde047" opacity="0.9" />
      <path d="M 2 12 Q 6 8 10 11 Q 7 15 2 12 Z" fill="#4ade80" />
    </g>
  </svg>`;
}

// Render HTML Shell
function renderHtmlShell(title, bodyHtml) {
  return `<!DOCTYPE html>
<html lang="en" class="scroll-smooth">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=5.0">
  <title>${title} | ${storeConfig.brand.name}</title>
  <meta name="description" content="${storeConfig.copy.hero.sub}">
  <link rel="icon" type="image/svg+xml" href="/favicon.svg">
  
  <meta property="og:title" content="Chutney Tubes: your favourite chutney, now in a tube">
  <meta property="og:description" content="Hari, imli, schezwan, momo and more, in a squeezable tube. 100% vegetarian.">
  <meta property="og:image" content="/images/og-share.svg">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:image" content="/images/og-share.svg">

  <script src="https://cdn.tailwindcss.com"></script>
  <script>
    tailwind.config = {
      theme: {
        extend: {
          colors: {
            ink: '#18241b',
            paper: '#f4f3ec',
            leaf: '#1d6b3a',
            deepLeaf: '#134a28',
            haldi: '#f2b81d',
            mirch: '#c8361f',
            steel: '#d8dcd4',
          },
          fontFamily: {
            heading: ["'Bricolage Grotesque'", 'sans-serif'],
            body: ["'Hind'", 'sans-serif'],
            sans: ["'Hind'", 'sans-serif'],
          }
        }
      }
    }
  </script>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,700;12..96,800&family=Hind:wght@400;500;600;700&display=swap" rel="stylesheet">
  <style>
    body {
      font-family: 'Hind', system-ui, -apple-system, sans-serif;
      background-color: #f4f3ec;
      color: #18241b;
      -webkit-font-smoothing: antialiased;
    }
    h1, h2, h3, h4, .font-heading {
      font-family: 'Bricolage Grotesque', system-ui, -apple-system, sans-serif;
      font-weight: 800;
    }
    a:focus-visible, button:focus-visible, input:focus-visible, textarea:focus-visible, select:focus-visible {
      outline: 2px solid #18241b;
      outline-offset: 2px;
    }
    @media (prefers-reduced-motion: reduce) {
      *, *::before, *::after {
        animation-duration: 0.01ms !important;
        transition-duration: 0.01ms !important;
        scroll-behavior: auto !important;
      }
    }
  </style>
</head>
<body class="min-h-screen flex flex-col justify-between selection:bg-[#f2b81d] selection:text-[#18241b]">
  ${bodyHtml}
</body>
</html>`;
}

// HTTP Server
const server = http.createServer((req, res) => {
  const host = req.headers.host || `localhost:${PORT}`;
  const parsed = new URL(req.url, `http://${host}`);
  const pathname = parsed.pathname;

  // Favicon & Images
  if (pathname === "/favicon.ico" || pathname === "/favicon.svg") {
    const favPath = path.join(PUBLIC_DIR, "favicon.svg");
    if (fs.existsSync(favPath)) {
      res.writeHead(200, { "Content-Type": "image/svg+xml" });
      return fs.createReadStream(favPath).pipe(res);
    }
    res.writeHead(204);
    return res.end();
  }

  if (pathname.startsWith("/images/")) {
    const filePath = path.join(PUBLIC_DIR, pathname);
    if (fs.existsSync(filePath)) {
      res.writeHead(200, { "Content-Type": "image/svg+xml" });
      return fs.createReadStream(filePath).pipe(res);
    }
    res.writeHead(404, { "Content-Type": "text/plain" });
    return res.end("Not Found");
  }

  // API Route: POST /api/events
  if (pathname === "/api/events" && req.method === "POST") {
    let body = "";
    req.on("data", (chunk) => (body += chunk));
    req.on("end", () => {
      try {
        const parsedBody = JSON.parse(body);
        const events = readJsonFile(EVENTS_FILE);

        if (parsedBody.batch && Array.isArray(parsedBody.batch)) {
          const sanitized = parsedBody.batch.map((ev) => {
            const p = ev.payload || {};
            delete p.customerName;
            delete p.customerPhone;
            delete p.customerAddress;
            return { ...ev, payload: p };
          });
          events.push(...sanitized);
        } else if (parsedBody.event) {
          const p = parsedBody.payload || parsedBody.metadata || {};
          delete p.customerName;
          delete p.customerPhone;
          delete p.customerAddress;
          events.push({
            visitorId: parsedBody.visitorId || "anon",
            sessionId: parsedBody.sessionId || "sess_anon",
            variant: parsedBody.variant || "a",
            isInternal: Boolean(parsedBody.isInternal),
            utm: parsedBody.utm || {},
            timestamp: parsedBody.timestamp || new Date().toISOString(),
            event: parsedBody.event,
            payload: p,
          });
        }

        writeJsonFile(EVENTS_FILE, events);
        res.writeHead(201, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ success: true, count: events.length }));
      } catch (err) {
        res.writeHead(400, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: err.message }));
      }
    });
    return;
  }

  // API Route: POST /api/signups
  if (pathname === "/api/signups" && req.method === "POST") {
    let body = "";
    req.on("data", (c) => (body += c));
    req.on("end", () => {
      try {
        const data = JSON.parse(body);
        if (!data.email) {
          res.writeHead(400, { "Content-Type": "application/json" });
          return res.end(JSON.stringify({ error: "Email is required" }));
        }
        const signups = readJsonFile(SIGNUPS_FILE);
        signups.push({
          email: data.email.trim().toLowerCase(),
          timestamp: data.timestamp || new Date().toISOString(),
          variant: data.variant || "a",
          utm_campaign: data.utm_campaign || "direct",
          visitorId: data.visitorId || "anon",
        });
        writeJsonFile(SIGNUPS_FILE, signups);
        res.writeHead(201, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ success: true, count: signups.length }));
      } catch (err) {
        res.writeHead(500, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: err.message }));
      }
    });
    return;
  }

  // API Route: POST /api/requests
  if (pathname === "/api/requests" && req.method === "POST") {
    let body = "";
    req.on("data", (c) => (body += c));
    req.on("end", () => {
      try {
        const data = JSON.parse(body);
        if (!data.name) {
          res.writeHead(400, { "Content-Type": "application/json" });
          return res.end(JSON.stringify({ error: "Chutney name is required" }));
        }
        const requests = readJsonFile(REQUESTS_FILE);
        requests.push({
          name: data.name.trim(),
          region: (data.region || "").trim(),
          timestamp: data.timestamp || new Date().toISOString(),
          visitorId: data.visitorId || "anon",
        });
        writeJsonFile(REQUESTS_FILE, requests);
        res.writeHead(201, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ success: true, count: requests.length }));
      } catch (err) {
        res.writeHead(500, { "Content-Type": "application/json" });
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
        const correctPassword = process.env.ADMIN_PASSWORD || "chutney2026";
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

  // API Route: GET /api/admin or GET /api/admin/metrics
  if ((pathname === "/api/admin" || pathname === "/api/admin/metrics") && req.method === "GET") {
    const token = parsed.searchParams.get("token");
    const pwd = parsed.searchParams.get("password");
    const correctPassword = process.env.ADMIN_PASSWORD || "chutney2026";
    if (token !== "admin_auth_valid" && pwd !== correctPassword) {
      res.writeHead(401, { "Content-Type": "application/json" });
      return res.end(JSON.stringify({ error: "Unauthorized" }));
    }

    const startDate = parsed.searchParams.get("startDate") || undefined;
    const endDate = parsed.searchParams.get("endDate") || undefined;
    const campaign = parsed.searchParams.get("campaign") || "all";
    const includeInternal = parsed.searchParams.get("includeInternal") === "true";

    const events = readJsonFile(EVENTS_FILE);
    const signups = readJsonFile(SIGNUPS_FILE);
    const requests = readJsonFile(REQUESTS_FILE);

    const metrics = calculateDashboardMetrics(events, signups, requests, {
      startDate,
      endDate,
      campaign,
      includeInternal,
    });
    res.writeHead(200, { "Content-Type": "application/json" });
    return res.end(JSON.stringify(metrics));
  }

  // API Route: GET /api/export (CSV)
  if (pathname === "/api/export") {
    const token = parsed.searchParams.get("token");
    const pwd = parsed.searchParams.get("password");
    const correctPassword = process.env.ADMIN_PASSWORD || "chutney2026";
    const isAuth = token === "admin_auth_valid" || pwd === correctPassword;
    if (!isAuth) {
      res.writeHead(401, { "Content-Type": "text/plain" });
      return res.end("Unauthorized");
    }

    const exportType = parsed.searchParams.get("type");
    const dateStr = new Date().toISOString().slice(0, 10);

    if (exportType === "signups") {
      const signups = readJsonFile(SIGNUPS_FILE);
      const csv = generateSignupsCsv(signups);
      res.writeHead(200, {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="chutney-tubes-launch-signups-${dateStr}.csv"`,
      });
      return res.end(csv);
    }

    const events = readJsonFile(EVENTS_FILE);
    const csv = generateEventsCsv(events);
    res.writeHead(200, {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="chutney-tubes-demand-events-${dateStr}.csv"`,
    });
    return res.end(csv);
  }

  // Static Policy Pages
  if (pathname === "/shipping") {
    res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
    return res.end(
      renderHtmlShell(
        "Shipping Policy",
        `
      <header class="bg-[#134a28] text-white py-4 px-4 sm:px-8">
        <div class="max-w-4xl mx-auto flex items-center justify-between">
          <a href="/" class="font-heading font-extrabold text-xl text-[#f2b81d]">${storeConfig.brand.name}</a>
          <a href="/" class="text-xs font-bold text-[#f4f3ec] hover:text-[#f2b81d]">← Back to Shop</a>
        </div>
      </header>
      <main class="max-w-3xl mx-auto w-full p-6 sm:p-10 my-8 bg-white rounded-3xl border border-[#d8dcd4] space-y-4">
        <h1 class="font-heading font-black text-2xl text-[#18241b]">Shipping Policy</h1>
        <p class="text-sm">Every order is packed and dispatched within <strong>1–2 working days</strong>. Usually arrives in <strong>3–7 working days</strong> depending on pincode.</p>
        <p class="text-sm">Any delivery charges are shown clearly before payment. Tracking updates sent by SMS or email.</p>
      </main>
      <footer class="py-6 text-center text-xs text-[#57534e] border-t border-[#d8dcd4]"><p>${storeConfig.brand.copyright}</p></footer>
    `
      )
    );
  }

  if (pathname === "/refunds") {
    res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
    return res.end(
      renderHtmlShell(
        "Refunds & Cancellations",
        `
      <header class="bg-[#134a28] text-white py-4 px-4 sm:px-8">
        <div class="max-w-4xl mx-auto flex items-center justify-between">
          <a href="/" class="font-heading font-extrabold text-xl text-[#f2b81d]">${storeConfig.brand.name}</a>
          <a href="/" class="text-xs font-bold text-[#f4f3ec] hover:text-[#f2b81d]">← Back to Shop</a>
        </div>
      </header>
      <main class="max-w-3xl mx-auto w-full p-6 sm:p-10 my-8 bg-white rounded-3xl border border-[#d8dcd4] space-y-4">
        <h1 class="font-heading font-black text-2xl text-[#18241b]">Refunds &amp; Cancellations</h1>
        <p class="text-sm">Cancel any time before shipping for a full refund. Damaged, leaking or wrong tubes replaced or refunded if reported within 48 hours with a photo.</p>
        <p class="text-sm">Opened food cannot be returned for other reasons. Approved refunds processed in 5–7 working days.</p>
      </main>
      <footer class="py-6 text-center text-xs text-[#57534e] border-t border-[#d8dcd4]"><p>${storeConfig.brand.copyright}</p></footer>
    `
      )
    );
  }

  if (pathname === "/privacy") {
    res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
    return res.end(
      renderHtmlShell(
        "Privacy Policy",
        `
      <header class="bg-[#134a28] text-white py-4 px-4 sm:px-8">
        <div class="max-w-4xl mx-auto flex items-center justify-between">
          <a href="/" class="font-heading font-extrabold text-xl text-[#f2b81d]">${storeConfig.brand.name}</a>
          <a href="/" class="text-xs font-bold text-[#f4f3ec] hover:text-[#f2b81d]">← Back to Shop</a>
        </div>
      </header>
      <main class="max-w-3xl mx-auto w-full p-6 sm:p-10 my-8 bg-white rounded-3xl border border-[#d8dcd4] space-y-4">
        <h1 class="font-heading font-black text-2xl text-[#18241b]">Privacy Policy (DPDP Act)</h1>
        <p class="text-sm">We collect only name, 10-digit mobile, email, pincode and address to process orders. Launch emails sent only with opt-in.</p>
        <p class="text-sm font-bold">We never sell data. No card numbers or UPI PINs are ever requested or stored.</p>
        <p class="text-sm">Request complete erasure any time by emailing <a href="mailto:${storeConfig.brand.contactEmail}" class="underline font-bold">${storeConfig.brand.contactEmail}</a>.</p>
      </main>
      <footer class="py-6 text-center text-xs text-[#57534e] border-t border-[#d8dcd4]"><p>${storeConfig.brand.copyright}</p></footer>
    `
      )
    );
  }

  if (pathname === "/terms") {
    res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
    return res.end(
      renderHtmlShell(
        "Terms of Service",
        `
      <header class="bg-[#134a28] text-white py-4 px-4 sm:px-8">
        <div class="max-w-4xl mx-auto flex items-center justify-between">
          <a href="/" class="font-heading font-extrabold text-xl text-[#f2b81d]">${storeConfig.brand.name}</a>
          <a href="/" class="text-xs font-bold text-[#f4f3ec] hover:text-[#f2b81d]">← Back to Shop</a>
        </div>
      </header>
      <main class="max-w-3xl mx-auto w-full p-6 sm:p-10 my-8 bg-white rounded-3xl border border-[#d8dcd4] space-y-4">
        <h1 class="font-heading font-black text-2xl text-[#18241b]">Terms of Service</h1>
        <p class="text-sm">All prices shown in INR inclusive of all taxes. Product images are illustrations; final packaging may differ slightly.</p>
        <p class="text-sm">Spice levels are a guide. Please check the pack for allergens before consumption.</p>
      </main>
      <footer class="py-6 text-center text-xs text-[#57534e] border-t border-[#d8dcd4]"><p>${storeConfig.brand.copyright}</p></footer>
    `
      )
    );
  }

  // Admin Dashboard (/admin)
  if (pathname === "/admin") {
    res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
    return res.end(renderAdminDashboardHtml());
  }

  // Default: Main Landing Page
  if (pathname === "/" || pathname === "/index.html" || pathname === "/checkout" || pathname === "/reveal") {
    res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
    return res.end(renderMainStoreHtml());
  }

  res.writeHead(404, { "Content-Type": "text/plain" });
  res.end("Not Found");
});

// Render Main Store HTML
function renderMainStoreHtml() {
  const c = storeConfig;
  return renderHtmlShell(
    "Your favourite chutney, now in a tube",
    `
    <!-- Announcement Bar -->
    <div class="bg-[#18241b] text-[#f4f3ec] text-xs sm:text-sm font-medium py-2 px-4 text-center tracking-wide">
      <span>${c.copy.announcement}</span>
      <span id="variant-pill" class="ml-2 bg-[#134a28] text-[#f2b81d] text-[10px] uppercase font-bold px-2 py-0.5 rounded">Variant ...</span>
    </div>

    <!-- Sticky Header -->
    <header class="sticky top-0 z-40 bg-[#134a28] text-white px-4 sm:px-8 py-3.5 border-b border-[#18241b] shadow-md flex items-center justify-between">
      <div class="flex items-center space-x-2.5">
        <div class="w-8 h-8 rounded-lg bg-[#f2b81d] flex items-center justify-center p-1 shadow-sm">
          <svg viewBox="0 0 32 32" class="w-6 h-6" fill="none">
            <rect x="6" y="2" width="20" height="4" fill="#ca8a04" rx="1" />
            <path d="M 6 6 L 26 6 C 26 22 25 26 23 28 C 21 30 19 31 16 31 C 13 31 11 30 9 28 C 7 26 6 22 6 6 Z" fill="#18241b" />
            <circle cx="16" cy="18" r="4" fill="#c8361f" />
          </svg>
        </div>
        <span class="font-heading font-extrabold text-xl sm:text-2xl tracking-tight text-[#f2b81d]">
          ${c.brand.name}
        </span>
      </div>

      <nav class="hidden md:flex items-center space-x-7 text-sm font-semibold text-[#f4f3ec]">
        <a href="#chutneys" class="hover:text-[#f2b81d] transition">Chutneys</a>
        <a href="#packs" class="hover:text-[#f2b81d] transition">Packs</a>
        <a href="#faq" class="hover:text-[#f2b81d] transition">FAQ</a>
      </nav>

      <button type="button" onclick="toggleCartDrawer(true)" class="bg-[#f2b81d] hover:bg-[#e2a80d] text-[#18241b] font-heading font-black text-xs sm:text-sm px-4 py-2 rounded-full shadow-md flex items-center space-x-2 transition transform active:scale-95">
        <span>Cart</span>
        <span id="header-cart-count" class="w-5 h-5 rounded-full bg-[#18241b] text-white flex items-center justify-center text-xs font-bold">0</span>
      </button>
    </header>

    <!-- Hero Section -->
    <section class="bg-[#1d6b3a] text-white pt-10 pb-16 px-4 sm:px-8 border-b border-[#134a28] overflow-hidden">
      <div class="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
        <div class="lg:col-span-7 space-y-5 text-left">
          <p class="text-xs uppercase tracking-widest font-heading font-black text-[#f2b81d]">
            ${c.copy.hero.smallCaps}
          </p>
          <h1 class="font-heading font-extrabold text-4xl sm:text-5xl lg:text-6xl text-white leading-[1.12] tracking-tight">
            ${c.copy.hero.headlinePart1}
            <span class="text-[#f2b81d]">${c.copy.hero.headlineHighlight}</span>
          </h1>
          <p class="text-base sm:text-xl text-[#f4f3ec] leading-relaxed max-w-xl font-normal">
            ${c.copy.hero.sub}
          </p>
          <div class="pt-3 flex flex-wrap items-center gap-3">
            <a href="#chutneys" class="bg-[#f2b81d] hover:bg-[#e2a80d] text-[#18241b] font-heading font-black text-sm sm:text-base px-7 py-3.5 rounded-xl shadow-lg transition">
              ${c.copy.hero.exploreCta}
            </a>
            <a href="#packs" class="border-2 border-white/80 hover:border-white text-white font-heading font-black text-sm sm:text-base px-6 py-3 rounded-xl transition hover:bg-white/10">
              ${c.copy.hero.packsCta}
            </a>
          </div>
        </div>

        <div class="lg:col-span-5 flex justify-center lg:justify-end">
          <div class="w-full max-w-md sm:max-w-lg">
            <img src="/images/hero-fanned-tubes.svg" alt="Chutney Tubes fanned trio" class="w-full h-auto object-contain drop-shadow-2xl">
          </div>
        </div>
      </div>
    </section>

    <!-- Trust Strip -->
    <section class="bg-white border-b border-[#d8dcd4] py-6 px-4 sm:px-8">
      <div class="max-w-6xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
        ${c.copy.trustStrip
          .map(
            (item) => `
          <div class="flex flex-col items-center justify-center p-2 space-y-1">
            <div class="w-8 h-8 rounded-full bg-[#f4f3ec] text-[#1d6b3a] flex items-center justify-center font-black text-base">✓</div>
            <span class="font-heading font-extrabold text-xs sm:text-sm text-[#18241b]">${item.title}</span>
            <span class="text-[11px] text-[#57534e] hidden sm:block">${item.desc}</span>
          </div>`
          )
          .join("")}
      </div>
    </section>

    <!-- Catalogue Section -->
    <section id="chutneys" class="py-14 px-4 sm:px-8 max-w-6xl mx-auto w-full">
      <div class="text-center max-w-2xl mx-auto mb-8 space-y-2">
        <h2 class="font-heading font-black text-3xl sm:text-4xl text-[#18241b]">${c.copy.catalogue.h2}</h2>
        <p class="text-sm sm:text-base text-[#57534e]">${c.copy.catalogue.lede}</p>

        <!-- Spice Filter Chips -->
        <div class="flex flex-wrap items-center justify-center gap-2 pt-4">
          <button type="button" onclick="filterSpice(null)" id="btn-flt-all" class="px-4 py-1.5 rounded-full text-xs font-bold transition bg-[#18241b] text-white">All (12)</button>
          <button type="button" onclick="filterSpice(1)" id="btn-flt-1" class="px-4 py-1.5 rounded-full text-xs font-bold transition bg-white text-[#18241b] border border-[#d8dcd4]">Mild</button>
          <button type="button" onclick="filterSpice(2)" id="btn-flt-2" class="px-4 py-1.5 rounded-full text-xs font-bold transition bg-white text-[#18241b] border border-[#d8dcd4]">Medium</button>
          <button type="button" onclick="filterSpice(3)" id="btn-flt-3" class="px-4 py-1.5 rounded-full text-xs font-bold transition bg-white text-[#18241b] border border-[#d8dcd4]">Hot 🔥</button>
        </div>
      </div>

      <!-- 12 Product Cards Grid -->
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6" id="products-grid">
        ${c.flavours
          .map(
            (f) => `
          <div class="product-card bg-white rounded-3xl p-5 border border-[#d8dcd4] shadow-sm hover:shadow-md transition flex flex-col justify-between" data-spice="${f.spice}">
            <div>
              <div onclick="openFlavourDetail('${f.id}')" class="w-full h-56 rounded-2xl p-2 cursor-pointer relative overflow-hidden flex items-center justify-center transition" style="background-color: ${f.color}15">
                ${renderFlavourSvg(f)}
              </div>
              <div class="flex items-center justify-between mt-3 mb-1">
                <span class="text-[10px] font-bold uppercase tracking-wider text-[#57534e]">${f.local}</span>
                <div class="w-3.5 h-3.5 border border-[#1d6b3a] rounded-sm p-0.5 flex items-center justify-center">
                  <div class="w-1.5 h-1.5 rounded-full bg-[#1d6b3a]"></div>
                </div>
              </div>
              <h3 onclick="openFlavourDetail('${f.id}')" class="font-heading font-black text-base sm:text-lg text-[#18241b] cursor-pointer hover:text-[#1d6b3a] transition">${f.name}</h3>
              <div class="flex items-center space-x-2 my-1 text-xs text-[#57534e]">
                <span>100 g tube</span>
                <span>•</span>
                <span class="text-[11px] font-semibold text-[#18241b]">${f.spice === 1 ? "Mild" : f.spice === 2 ? "Medium" : "Hot 🔥"}</span>
              </div>
              <p class="text-xs text-[#57534e] line-clamp-2 my-2 leading-relaxed">${f.desc}</p>
            </div>
            <div class="pt-3 border-t border-[#f4f3ec] flex items-center justify-between mt-2">
              <div>
                <span class="font-heading font-extrabold text-lg text-[#18241b] single-price-display">₹99</span>
                <span class="block text-[10px] text-[#57534e]">MRP incl. of all taxes</span>
              </div>
              <button type="button" onclick="addSingleToCart('${f.id}')" class="bg-[#1d6b3a] hover:bg-[#134a28] text-white font-heading font-bold text-xs px-4 py-2.5 rounded-xl shadow-sm transition">
                Add
              </button>
            </div>
          </div>`
          )
          .join("")}
      </div>

      <!-- Request Chutney Box -->
      <div class="mt-12 bg-white rounded-3xl p-6 sm:p-8 border border-[#d8dcd4] shadow-sm max-w-2xl mx-auto text-center space-y-4">
        <h3 class="font-heading font-black text-xl text-[#18241b]">${c.copy.catalogue.requestBoxHeading}</h3>
        <p class="text-xs sm:text-sm text-[#57534e]">${c.copy.catalogue.requestBoxLede}</p>
        <form onsubmit="handleRequestSubmit(event)" class="flex flex-col sm:flex-row gap-3 justify-center">
          <input type="text" id="req-name" required placeholder="e.g. Gongura, Raw Papaya, Dry Garlic..." class="text-xs sm:text-sm px-4 py-2.5 rounded-xl border border-[#d8dcd4] bg-[#f4f3ec] flex-1">
          <input type="text" id="req-region" placeholder="State (e.g. Andhra, Gujarat)" class="text-xs sm:text-sm px-4 py-2.5 rounded-xl border border-[#d8dcd4] bg-[#f4f3ec] sm:w-44">
          <button type="submit" id="btn-req-send" class="bg-[#18241b] hover:bg-[#134a28] text-white font-heading font-bold text-xs px-6 py-2.5 rounded-xl shadow">Send</button>
        </form>
      </div>
    </section>

    <!-- Pick. Squeeze. Enjoy. -->
    <section class="py-14 bg-white border-y border-[#d8dcd4] px-4 sm:px-8">
      <div class="max-w-5xl mx-auto">
        <div class="text-center max-w-xl mx-auto mb-10">
          <h2 class="font-heading font-black text-2xl sm:text-3xl text-[#18241b]">${c.copy.steps.heading}</h2>
          <p class="text-xs sm:text-sm text-[#57534e] mt-1">${c.copy.steps.sub}</p>
        </div>
        <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
          ${c.copy.steps.items
            .map(
              (s) => `
            <div class="bg-[#f4f3ec] rounded-2xl p-6 border border-[#d8dcd4] text-center flex flex-col items-center space-y-3">
              <div class="w-12 h-12 rounded-full bg-[#134a28] text-[#f2b81d] flex items-center justify-center font-heading font-black text-lg">${s.num}</div>
              <h3 class="font-heading font-bold text-lg text-[#18241b]">${s.title}</h3>
              <p class="text-xs sm:text-sm text-[#57534e] leading-relaxed">${s.desc}</p>
            </div>`
            )
            .join("")}
        </div>
      </div>
    </section>

    <!-- Why a Tube? (Dark Section) -->
    <section class="py-16 bg-[#18241b] text-white px-4 sm:px-8">
      <div class="max-w-4xl mx-auto">
        <div class="text-center max-w-xl mx-auto mb-10 space-y-1">
          <h2 class="font-heading font-black text-2xl sm:text-3xl text-[#f2b81d]">${c.copy.comparison.heading}</h2>
          <p class="text-xs sm:text-sm text-[#d8dcd4]">${c.copy.comparison.sub}</p>
        </div>
        <div class="overflow-hidden bg-[#134a28] rounded-2xl border border-white/10 shadow-lg">
          <table class="w-full text-left text-xs sm:text-sm border-collapse">
            <thead>
              <tr class="border-b border-white/10 text-white/70 uppercase text-[10px] font-heading font-bold">
                <th class="py-3 px-4">Feature</th>
                <th class="py-3 px-4 text-[#f2b81d]">Tube ✨</th>
                <th class="py-3 px-4">Jar</th>
                <th class="py-3 px-4">Sachet</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-white/10">
              ${c.copy.comparison.rows
                .map(
                  (r) => `
                <tr class="hover:bg-white/5 transition">
                  <td class="py-3 px-4 font-semibold text-white">${r.factor}</td>
                  <td class="py-3 px-4 font-bold text-[#f2b81d]">✓ ${r.tube}</td>
                  <td class="py-3 px-4 text-white/70">${r.jar}</td>
                  <td class="py-3 px-4 text-white/70">${r.sachet}</td>
                </tr>`
                )
                .join("")}
            </tbody>
          </table>
        </div>
      </div>
    </section>

    <!-- Where People Use It -->
    <section class="py-14 px-4 sm:px-8 max-w-6xl mx-auto w-full">
      <div class="text-center max-w-xl mx-auto mb-10">
        <h2 class="font-heading font-black text-2xl sm:text-3xl text-[#18241b]">Where people use it</h2>
        <p class="text-xs sm:text-sm text-[#57534e] mt-1">Made for real Indian daily food routines.</p>
      </div>
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        ${c.copy.wherePeopleUseIt
          .map(
            (tile) => `
          <div class="bg-white rounded-2xl p-5 border border-[#d8dcd4] shadow-sm space-y-2">
            <h3 class="font-heading font-bold text-base text-[#18241b] flex items-center space-x-1.5">
              <span class="text-[#1d6b3a]">●</span><span>${tile.title}</span>
            </h3>
            <p class="text-xs text-[#57534e] leading-relaxed">${tile.text}</p>
          </div>`
          )
          .join("")}
      </div>
    </section>

    <!-- Packs Section -->
    <section id="packs" class="py-14 bg-white border-t border-[#d8dcd4] px-4 sm:px-8">
      <div class="max-w-5xl mx-auto">
        <div class="text-center max-w-xl mx-auto mb-10">
          <span class="text-xs font-heading font-extrabold text-[#1d6b3a] uppercase tracking-wider">Bundles &amp; Value</span>
          <h2 class="font-heading font-black text-2xl sm:text-3xl text-[#18241b] mt-1">Choose Your Pack</h2>
        </div>
        <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
          <!-- Single -->
          <div class="bg-[#f4f3ec] rounded-3xl p-6 border border-[#d8dcd4] flex flex-col justify-between space-y-4">
            <div>
              <span class="text-[11px] font-bold uppercase tracking-wider text-[#57534e]">Everyday</span>
              <h3 class="font-heading font-black text-xl text-[#18241b] mt-1">Single Tube</h3>
              <p class="text-xs text-[#57534e] mt-1">Choose any one favourite flavour.</p>
              <div class="mt-4">
                <span id="pack-single-cost" class="font-heading font-black text-2xl text-[#18241b]">₹99</span>
                <span class="block text-[10px] text-[#57534e]">MRP incl. of all taxes</span>
              </div>
            </div>
            <a href="#chutneys" class="w-full text-center bg-white hover:bg-[#d8dcd4] text-[#18241b] font-heading font-bold text-xs py-3 rounded-xl border border-[#d8dcd4]">Choose a chutney</a>
          </div>

          <!-- Combo -->
          <div class="bg-[#f4f3ec] rounded-3xl p-6 border border-[#d8dcd4] flex flex-col justify-between space-y-4">
            <div>
              <span class="text-[11px] font-bold uppercase tracking-wider text-[#c8361f]">Classic Pair</span>
              <h3 class="font-heading font-black text-xl text-[#18241b] mt-1">Chaat Combo</h3>
              <p class="text-xs text-[#57534e] mt-1">Chatpati Hari + Khatti Meethi Imli.</p>
              <div class="mt-4">
                <span id="pack-combo-cost" class="font-heading font-black text-2xl text-[#18241b]">₹179</span>
                <span class="block text-[10px] text-[#57534e]">MRP incl. of all taxes</span>
              </div>
            </div>
            <button type="button" onclick="addComboToCart()" class="w-full bg-[#1d6b3a] hover:bg-[#134a28] text-white font-heading font-bold text-xs py-3 rounded-xl shadow">Add the combo</button>
          </div>

          <!-- Pick 3 -->
          <div class="bg-[#134a28] text-white rounded-3xl p-6 border-2 border-[#f2b81d] shadow-xl flex flex-col justify-between space-y-4 relative overflow-hidden">
            <div class="absolute top-4 right-4 bg-[#f2b81d] text-[#18241b] text-[10px] uppercase font-heading font-black px-2.5 py-0.5 rounded-full">Best value</div>
            <div>
              <span class="text-[11px] font-bold uppercase tracking-wider text-[#f2b81d]">Custom Box</span>
              <h3 class="font-heading font-black text-xl text-white mt-1">Pick Any 3</h3>
              <p class="text-xs text-[#f4f3ec] mt-1">Pick your 3 favourite flavours in a custom box.</p>
              <div class="mt-4">
                <span id="pack-pick3-cost" class="font-heading font-black text-2xl text-[#f2b81d]">₹269</span>
                <span class="block text-[10px] text-white/70">MRP incl. of all taxes</span>
              </div>
            </div>
            <button type="button" onclick="openPick3Dialog()" class="w-full bg-[#f2b81d] hover:bg-[#e2a80d] text-[#18241b] font-heading font-black text-xs py-3 rounded-xl shadow">Pick your 3</button>
          </div>
        </div>
      </div>
    </section>

    <!-- FAQ -->
    <section id="faq" class="py-14 px-4 sm:px-8 max-w-3xl mx-auto w-full">
      <div class="text-center mb-8">
        <h2 class="font-heading font-black text-2xl sm:text-3xl text-[#18241b]">Frequently Asked Questions</h2>
      </div>
      <div class="space-y-3">
        ${c.copy.faq
          .map(
            (item, idx) => `
          <details class="group bg-white rounded-2xl border border-[#d8dcd4] p-4 transition">
            <summary class="font-heading font-bold text-sm sm:text-base text-[#18241b] cursor-pointer flex justify-between items-center list-none">
              <span>${item.q}</span>
              <span class="text-[#1d6b3a] font-black text-lg group-open:rotate-45 transition-transform">+</span>
            </summary>
            <p class="mt-3 text-xs sm:text-sm text-[#57534e] leading-relaxed border-t border-[#f4f3ec] pt-3">${item.a}</p>
          </details>`
          )
          .join("")}
      </div>
    </section>

    <!-- Footer -->
    <footer class="bg-[#134a28] text-[#f4f3ec] py-12 px-4 sm:px-8 border-t border-[#18241b]">
      <div class="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-12 gap-8">
        <div class="md:col-span-6 space-y-3">
          <span class="font-heading font-black text-2xl text-[#f2b81d]">${c.brand.name}</span>
          <p class="text-sm font-medium text-white">${c.brand.tagline}</p>
          <p class="text-xs text-[#d8dcd4] leading-relaxed max-w-sm">${c.brand.subheadline}</p>
        </div>
        <div class="md:col-span-3 space-y-2">
          <h4 class="font-heading font-bold text-xs uppercase tracking-wider text-[#f2b81d]">Shop</h4>
          <ul class="space-y-1.5 text-xs text-[#f4f3ec]">
            <li><a href="#chutneys" class="hover:underline">All 12 Chutneys</a></li>
            <li><a href="#packs" class="hover:underline">Packs &amp; Bundles</a></li>
            <li><a href="#faq" class="hover:underline">FAQ</a></li>
          </ul>
        </div>
        <div class="md:col-span-3 space-y-2">
          <h4 class="font-heading font-bold text-xs uppercase tracking-wider text-[#f2b81d]">Policies</h4>
          <ul class="space-y-1.5 text-xs text-[#f4f3ec]">
            <li><a href="/shipping" class="hover:underline">Shipping Policy</a></li>
            <li><a href="/refunds" class="hover:underline">Refunds &amp; Cancellations</a></li>
            <li><a href="/privacy" class="hover:underline">Privacy Policy (DPDP Act)</a></li>
            <li><a href="/terms" class="hover:underline">Terms of Service</a></li>
            <li><a href="/admin" class="hover:underline text-[#f2b81d] font-bold">Admin Portal →</a></li>
          </ul>
        </div>
      </div>
      <div class="max-w-6xl mx-auto mt-8 pt-6 border-t border-white/10 text-center text-xs text-white/60">
        <p>${c.brand.copyright}. Pre-launch consumer demand validation.</p>
      </div>
    </footer>

    <!-- Floating WhatsApp -->
    <a href="https://wa.me/${c.brand.whatsAppNumber}" target="_blank" rel="noopener noreferrer" class="fixed bottom-5 right-5 z-40 bg-[#25D366] text-white rounded-full p-3.5 shadow-2xl hover:scale-105 transition flex items-center space-x-2">
      <span class="text-xs font-bold font-heading pr-1">WhatsApp us</span>
    </a>

    <!-- CART DRAWER -->
    <div id="cart-drawer-overlay" class="hidden fixed inset-0 z-50 flex justify-end">
      <div onclick="toggleCartDrawer(false)" class="fixed inset-0 bg-black/50 backdrop-blur-sm"></div>
      <div class="relative w-full max-w-md bg-white h-full shadow-2xl flex flex-col justify-between p-6 z-10">
        <div>
          <div class="flex items-center justify-between border-b border-[#d8dcd4] pb-4">
            <h3 class="font-heading font-black text-xl text-[#18241b]">Your Cart</h3>
            <button onclick="toggleCartDrawer(false)" class="w-8 h-8 rounded-full bg-[#f4f3ec] text-[#18241b] font-black text-sm">✕</button>
          </div>
          <div id="cart-items-list" class="divide-y divide-[#f4f3ec] max-h-[60vh] overflow-y-auto py-2"></div>
        </div>
        <div id="cart-footer" class="border-t border-[#d8dcd4] pt-4 space-y-3">
          <div class="flex justify-between items-center text-sm font-bold">
            <span>Total (MRP incl. of taxes):</span>
            <span id="cart-drawer-total" class="font-heading font-black text-xl text-[#18241b]">₹0</span>
          </div>
          <button type="button" onclick="openCheckoutModal()" class="w-full bg-[#1d6b3a] hover:bg-[#134a28] text-white font-heading font-black text-sm py-3.5 rounded-xl shadow-lg transition">Checkout</button>
        </div>
      </div>
    </div>

    <!-- PICK 3 MODAL -->
    <div id="pick3-modal" class="hidden fixed inset-0 z-50 flex items-center justify-center p-4">
      <div onclick="closePick3Dialog()" class="fixed inset-0 bg-black/60 backdrop-blur-sm"></div>
      <div class="relative bg-white rounded-3xl p-6 sm:p-8 max-w-lg w-full z-10 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
        <div class="flex justify-between items-center border-b border-[#d8dcd4] pb-3">
          <div>
            <h3 class="font-heading font-black text-xl text-[#18241b]">Pick Any 3 Flavours</h3>
            <p id="pick3-count" class="text-xs text-[#57534e]">Selected 0 of 3</p>
          </div>
          <button onclick="closePick3Dialog()" class="w-8 h-8 rounded-full bg-[#f4f3ec] font-black text-sm">✕</button>
        </div>
        <div class="grid grid-cols-2 gap-3 max-h-64 overflow-y-auto pr-1">
          ${c.flavours
            .map(
              (f) => `
            <div id="pick3-card-${f.id}" onclick="selectPick3Flavour('${f.id}')" class="p-3 rounded-2xl border-2 border-[#d8dcd4] bg-[#f4f3ec] cursor-pointer hover:border-[#18241b] transition">
              <span class="text-[10px] font-bold text-[#c8361f] block">${f.local}</span>
              <h4 class="font-heading font-bold text-xs text-[#18241b] leading-tight">${f.name}</h4>
            </div>`
            )
            .join("")}
        </div>
        <button type="button" id="btn-pick3-confirm" disabled onclick="confirmPick3Selection()" class="w-full bg-[#f2b81d] hover:bg-[#e2a80d] text-[#18241b] font-heading font-black text-sm py-3.5 rounded-xl shadow-lg transition disabled:opacity-40">
          Confirm 3-Pack · <span id="pick3-btn-price">₹269</span>
        </button>
      </div>
    </div>

    <!-- CHECKOUT MODAL -->
    <div id="checkout-modal" class="hidden fixed inset-0 z-50 flex items-center justify-center p-4">
      <div class="fixed inset-0 bg-black/70 backdrop-blur-sm"></div>
      <div class="relative bg-white rounded-3xl p-6 sm:p-8 max-w-xl w-full z-10 shadow-2xl max-h-[92vh] overflow-y-auto">
        <div class="flex justify-between items-center border-b border-[#d8dcd4] pb-3 mb-4">
          <span id="chk-stage-title" class="font-heading font-black text-lg text-[#134a28]">Checkout</span>
          <button id="chk-close-btn" onclick="closeCheckoutModal()" class="w-7 h-7 rounded-full bg-[#f4f3ec] font-black text-xs">✕</button>
        </div>

        <!-- Stage 1: Delivery Details -->
        <div id="chk-step-1" class="space-y-4">
          <h3 class="font-heading font-bold text-base text-[#18241b]">1. Delivery Details</h3>
          <div>
            <label class="block text-xs font-bold mb-1">Full Name *</label>
            <input type="text" id="chk-name" required placeholder="Priya Sharma" class="w-full text-xs sm:text-sm px-3.5 py-2.5 rounded-xl border border-[#d8dcd4] bg-[#f4f3ec]">
          </div>
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label class="block text-xs font-bold mb-1">10-digit Mobile (starts 6-9) *</label>
              <input type="tel" id="chk-phone" required maxlength="10" placeholder="9876543210" class="w-full text-xs sm:text-sm px-3.5 py-2.5 rounded-xl border border-[#d8dcd4] bg-[#f4f3ec]">
            </div>
            <div>
              <label class="block text-xs font-bold mb-1">Email Address *</label>
              <input type="email" id="chk-email" required placeholder="priya@gmail.com" class="w-full text-xs sm:text-sm px-3.5 py-2.5 rounded-xl border border-[#d8dcd4] bg-[#f4f3ec]">
            </div>
          </div>
          <div>
            <label class="block text-xs font-bold mb-1">6-digit Delivery Pincode *</label>
            <input type="text" id="chk-pincode" required maxlength="6" oninput="validatePin(this.value)" placeholder="e.g. 560001, 110001, 400001" class="w-full text-xs sm:text-sm px-3.5 py-2.5 rounded-xl border border-[#d8dcd4] bg-[#f4f3ec] font-mono">
            <div id="pin-feedback" class="hidden mt-2 p-2 rounded-xl text-xs font-bold"></div>
          </div>
          <div>
            <label class="block text-xs font-bold mb-1">Complete Address *</label>
            <textarea id="chk-address" required rows="2" placeholder="Floor 4, Desk 12, Koramangala..." class="w-full text-xs sm:text-sm px-3.5 py-2.5 rounded-xl border border-[#d8dcd4] bg-[#f4f3ec]"></textarea>
          </div>
          <div class="text-[11px] text-[#57534e]">We use your details only to process your order. <a href="/privacy" target="_blank" class="underline font-bold">Privacy policy</a>.</div>
          <button type="button" onclick="submitDeliveryDetails()" id="btn-to-pay" disabled class="w-full bg-[#1d6b3a] hover:bg-[#134a28] text-white font-heading font-black text-sm py-3.5 rounded-xl shadow-lg transition disabled:opacity-40">
            Continue to Payment →
          </button>
        </div>

        <!-- Stage 2: Payment Choice (MOCK ONLY) -->
        <div id="chk-step-2" class="hidden space-y-5">
          <h3 class="font-heading font-bold text-base text-[#18241b]">2. Payment Method (Simulated Test)</h3>
          <div class="bg-[#f4f3ec] p-3 rounded-xl text-xs space-y-1">
            <div class="flex justify-between"><span>Delivery:</span><span class="font-bold text-[#1d6b3a]">Free</span></div>
            <div class="flex justify-between border-t border-[#d8dcd4] pt-1 text-sm font-heading font-extrabold">
              <span>Total Payable:</span><span id="chk-step2-total" class="text-[#134a28]">₹0</span>
            </div>
          </div>
          <div class="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            <button type="button" onclick="setPayMethod('upi')" id="p-opt-upi" class="p-3.5 rounded-xl border-2 border-[#d8dcd4] bg-[#f4f3ec] flex flex-col items-center">
              <span class="text-xs font-bold font-heading">UPI</span><span class="text-[10px] text-[#57534e]">Any UPI app</span>
            </button>
            <button type="button" onclick="setPayMethod('card')" id="p-opt-card" class="p-3.5 rounded-xl border-2 border-[#d8dcd4] bg-[#f4f3ec] flex flex-col items-center">
              <span class="text-xs font-bold font-heading">Debit or card</span><span class="text-[10px] text-[#57534e]">Visa, Mastercard</span>
            </button>
            <button type="button" onclick="setPayMethod('cod')" id="p-opt-cod" class="p-3.5 rounded-xl border-2 border-[#d8dcd4] bg-[#f4f3ec] flex flex-col items-center">
              <span class="text-xs font-bold font-heading">Cash on delivery</span><span class="text-[10px] text-[#57534e]">Pay on arrival</span>
            </button>
          </div>
          <button type="button" id="btn-pay-now" disabled onclick="submitPayClick()" class="w-full bg-[#18241b] hover:bg-[#134a28] text-white font-heading font-black text-sm py-4 rounded-xl shadow-lg transition disabled:opacity-40">
            Pay ₹0
          </button>
        </div>

        <!-- Stage 3: Honest Reveal Screen -->
        <div id="chk-step-3" class="hidden space-y-5">
          <div class="bg-[#f2b81d] text-[#18241b] text-xs font-heading font-black px-3 py-1 rounded-full inline-block">
            You haven't been charged
          </div>
          <div class="space-y-1">
            <h3 class="font-heading font-black text-2xl text-[#18241b]">Thank you. You're one of the first.</h3>
            <p class="text-xs sm:text-sm text-[#57534e] leading-relaxed">
              Chutney Tubes isn't on sale yet. This was a test checkout to learn whether people want chutney in a tube before we start making it. No money was taken, and we didn't save your phone number or address.
            </p>
          </div>
          <form onsubmit="submitRevealSurvey(event)" id="reveal-survey-form" class="space-y-4 pt-2 border-t border-[#d8dcd4]">
            <div>
              <label class="block text-xs font-bold font-heading mb-2">How do you feel about chutney in a tube?</label>
              <div class="space-y-1.5 text-xs">
                <label class="flex items-center space-x-2 p-2 rounded-lg bg-[#f4f3ec] cursor-pointer"><input type="radio" name="feeling" value="Love it, easier than a jar" required> <span>Love it, easier than a jar</span></label>
                <label class="flex items-center space-x-2 p-2 rounded-lg bg-[#f4f3ec] cursor-pointer"><input type="radio" name="feeling" value="Fine with it"> <span>Fine with it</span></label>
                <label class="flex items-center space-x-2 p-2 rounded-lg bg-[#f4f3ec] cursor-pointer"><input type="radio" name="feeling" value="Not sure yet"> <span>Not sure yet</span></label>
                <label class="flex items-center space-x-2 p-2 rounded-lg bg-[#f4f3ec] cursor-pointer"><input type="radio" name="feeling" value="I'd rather have a jar or sachet"> <span>I'd rather have a jar or sachet</span></label>
              </div>
            </div>
            <div>
              <label class="block text-xs font-bold font-heading mb-1">What almost stopped you from buying? (optional)</label>
              <textarea id="rev-stopped" rows="2" class="w-full text-xs px-3.5 py-2 rounded-xl border border-[#d8dcd4] bg-[#f4f3ec]" placeholder="Price, wanted to see ingredients first..."></textarea>
            </div>
            <div>
              <label class="block text-xs font-bold font-heading mb-2">How often would you use it?</label>
              <div class="grid grid-cols-2 gap-2 text-xs">
                <label class="flex items-center space-x-2 p-2 rounded-lg bg-[#f4f3ec]"><input type="radio" name="rev-freq" value="Daily" required> <span>Daily</span></label>
                <label class="flex items-center space-x-2 p-2 rounded-lg bg-[#f4f3ec]"><input type="radio" name="rev-freq" value="A few times a week"> <span>A few times a week</span></label>
                <label class="flex items-center space-x-2 p-2 rounded-lg bg-[#f4f3ec]"><input type="radio" name="rev-freq" value="Weekly"> <span>Weekly</span></label>
                <label class="flex items-center space-x-2 p-2 rounded-lg bg-[#f4f3ec]"><input type="radio" name="rev-freq" value="Rarely"> <span>Rarely</span></label>
              </div>
            </div>
            <div class="bg-[#f4f3ec] p-3.5 rounded-xl border border-[#d8dcd4]">
              <label class="flex items-start space-x-2.5 cursor-pointer">
                <input type="checkbox" id="rev-optin" onchange="toggleOptinEmail(this.checked)" class="mt-0.5">
                <span class="text-xs font-bold">Email me once when Chutney Tubes launches, with a launch-day discount.</span>
              </label>
              <div id="rev-email-box" class="hidden mt-2 pt-2 border-t border-[#d8dcd4]">
                <input type="email" id="rev-email-val" placeholder="Your email address" class="w-full text-xs px-3 py-1.5 rounded-lg border border-[#d8dcd4]">
              </div>
            </div>
            <button type="submit" class="w-full bg-[#18241b] hover:bg-[#134a28] text-white font-heading font-black text-xs py-3.5 rounded-xl shadow-lg">Send and close</button>
          </form>
          <div id="reveal-done-msg" class="hidden text-center py-6 space-y-3">
            <p class="font-heading font-bold text-sm text-[#1d6b3a]">✓ Thank you! Your response will help us decide whether to launch.</p>
            <button onclick="closeCheckoutModal()" class="bg-[#18241b] text-white font-heading font-bold text-xs px-6 py-2.5 rounded-xl">Close</button>
          </div>
        </div>
      </div>
    </div>

    <!-- CLIENT CONTROLLER SCRIPT -->
    <script>
      const storeConfig = ${JSON.stringify(storeConfig)};
      let cart = [];
      let variant = 'a';
      let selectedPick3 = [];
      let chosenPayMethod = '';
      let verifiedZone = '';
      let verifiedPinPrefix = '';
      let isInternal = false;

      // 1. Visitor & Variant Initialization
      (function() {
        // Visitor ID
        let vid = localStorage.getItem('ct_visitor_id');
        if (!vid) {
          vid = 'vis_' + Date.now().toString(36) + '_' + Math.random().toString(36).substring(2, 9);
          localStorage.setItem('ct_visitor_id', vid);
        }

        // Variant Resolution (?variant= > sticky > random)
        const params = new URLSearchParams(window.location.search);
        let paramV = params.get('variant');
        if (paramV && ['a', 'b', 'c'].includes(paramV.toLowerCase())) {
          variant = paramV.toLowerCase();
          localStorage.setItem('ct_price_variant', variant);
        } else {
          variant = localStorage.getItem('ct_price_variant') || '';
          if (!['a', 'b', 'c'].includes(variant)) {
            const opts = ['a', 'b', 'c'];
            variant = opts[Math.floor(Math.random() * opts.length)];
            localStorage.setItem('ct_price_variant', variant);
          }
        }

        // Internal flag detection
        if (params.get('admin') === '1') {
          isInternal = true;
          localStorage.setItem('ct_is_internal', 'true');
        } else {
          isInternal = localStorage.getItem('ct_is_internal') === 'true';
        }

        // Restore Cart
        try {
          const savedCart = localStorage.getItem('ct_cart_items');
          if (savedCart) cart = JSON.parse(savedCart);
        } catch(e) {}
      })();

      function getPricing() {
        return storeConfig.pricing.variants[variant] || storeConfig.pricing.variants.a;
      }

      function updatePricingUI() {
        const p = getPricing();
        document.getElementById('variant-pill').textContent = 'Variant ' + variant.toUpperCase();
        document.querySelectorAll('.single-price-display').forEach(el => el.textContent = '₹' + p.single);
        document.getElementById('pack-single-cost').textContent = '₹' + p.single;
        document.getElementById('pack-combo-cost').textContent = '₹' + p.combo;
        document.getElementById('pack-pick3-cost').textContent = '₹' + p.pick3;
        document.getElementById('pick3-btn-price').textContent = '₹' + p.pick3;
        renderCart();
      }

      function logEvent(name, payload = {}) {
        const doc = {
          visitorId: localStorage.getItem('ct_visitor_id') || 'anon',
          sessionId: 'sess_' + Date.now().toString(36),
          variant: variant,
          isInternal: isInternal,
          utm: {
            utm_source: new URLSearchParams(window.location.search).get('src') || new URLSearchParams(window.location.search).get('utm_source') || undefined,
            utm_campaign: new URLSearchParams(window.location.search).get('utm_campaign') || undefined,
          },
          timestamp: new Date().toISOString(),
          event: name,
          payload: payload
        };
        fetch('/api/events', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(doc),
          keepalive: true
        }).catch(() => {});
      }

      // Filter Spice Chips
      function filterSpice(spice) {
        ['all', '1', '2', '3'].forEach(k => {
          const btn = document.getElementById('btn-flt-' + k);
          btn.className = (k === (spice === null ? 'all' : String(spice)))
            ? 'px-4 py-1.5 rounded-full text-xs font-bold transition bg-[#18241b] text-white'
            : 'px-4 py-1.5 rounded-full text-xs font-bold transition bg-white text-[#18241b] border border-[#d8dcd4]';
        });
        document.querySelectorAll('.product-card').forEach(card => {
          if (spice === null || card.getAttribute('data-spice') === String(spice)) {
            card.classList.remove('hidden');
          } else {
            card.classList.add('hidden');
          }
        });
        logEvent('spice_filter_used', { spice: spice === null ? 'all' : spice });
      }

      // Cart Operations
      function toggleCartDrawer(open) {
        document.getElementById('cart-drawer-overlay').classList.toggle('hidden', !open);
        renderCart();
      }

      function addSingleToCart(flavourId) {
        const p = getPricing();
        const f = storeConfig.flavours.find(x => x.id === flavourId);
        const title = f ? f.name : flavourId;
        const existing = cart.find(x => x.kind === 'single' && x.flavours[0] === flavourId);
        if (existing) {
          existing.quantity++;
        } else {
          cart.push({ id: 'c_' + Date.now().toString(36), kind: 'single', title: title, flavours: [flavourId], quantity: 1, unitPrice: p.single });
        }
        saveCart();
        logEvent('add_to_cart', { kind: 'single', flavours: [flavourId], qty: 1 });
        toggleCartDrawer(true);
      }

      function addComboToCart() {
        const p = getPricing();
        const existing = cart.find(x => x.kind === 'combo');
        if (existing) {
          existing.quantity++;
        } else {
          cart.push({ id: 'c_' + Date.now().toString(36), kind: 'combo', title: 'Chaat Combo (Hari + Imli)', flavours: ['green', 'imli'], quantity: 1, unitPrice: p.combo });
        }
        saveCart();
        logEvent('add_to_cart', { kind: 'combo', flavours: ['green', 'imli'], qty: 1 });
        toggleCartDrawer(true);
      }

      function openPick3Dialog() {
        selectedPick3 = [];
        storeConfig.flavours.forEach(f => {
          const el = document.getElementById('pick3-card-' + f.id);
          if (el) el.className = 'p-3 rounded-2xl border-2 border-[#d8dcd4] bg-[#f4f3ec] cursor-pointer hover:border-[#18241b] transition';
        });
        document.getElementById('pick3-count').textContent = 'Selected 0 of 3';
        document.getElementById('btn-pick3-confirm').disabled = true;
        document.getElementById('pick3-modal').classList.remove('hidden');
        logEvent('sampler_opened', { pack: 'pick3' });
      }

      function closePick3Dialog() {
        document.getElementById('pick3-modal').classList.add('hidden');
      }

      function selectPick3Flavour(id) {
        const idx = selectedPick3.indexOf(id);
        const card = document.getElementById('pick3-card-' + id);
        if (idx > -1) {
          selectedPick3.splice(idx, 1);
          card.className = 'p-3 rounded-2xl border-2 border-[#d8dcd4] bg-[#f4f3ec] cursor-pointer hover:border-[#18241b] transition';
        } else {
          if (selectedPick3.length < 3) {
            selectedPick3.push(id);
            card.className = 'p-3 rounded-2xl border-2 border-[#1d6b3a] bg-[#1d6b3a]/15 cursor-pointer font-bold transition';
          }
        }
        document.getElementById('pick3-count').textContent = 'Selected ' + selectedPick3.length + ' of 3';
        document.getElementById('btn-pick3-confirm').disabled = (selectedPick3.length !== 3);
      }

      function confirmPick3Selection() {
        if (selectedPick3.length !== 3) return;
        const p = getPricing();
        const names = selectedPick3.map(id => storeConfig.flavours.find(x => x.id === id)?.local || id).join(', ');
        cart.push({ id: 'c_' + Date.now().toString(36), kind: 'pick3', title: 'Pick Any 3 (' + names + ')', flavours: [...selectedPick3], quantity: 1, unitPrice: p.pick3 });
        saveCart();
        logEvent('add_to_cart', { kind: 'pick3', flavours: selectedPick3, qty: 1 });
        closePick3Dialog();
        toggleCartDrawer(true);
      }

      function updateCartQty(id, delta) {
        const item = cart.find(x => x.id === id);
        if (item) {
          item.quantity += delta;
          if (item.quantity <= 0) cart = cart.filter(x => x.id !== id);
        }
        saveCart();
      }

      function saveCart() {
        localStorage.setItem('ct_cart_items', JSON.stringify(cart));
        renderCart();
      }

      function renderCart() {
        const list = document.getElementById('cart-items-list');
        const countBadge = document.getElementById('header-cart-count');
        const totalEl = document.getElementById('cart-drawer-total');
        const footer = document.getElementById('cart-footer');

        const totalQty = cart.reduce((s, x) => s + x.quantity, 0);
        const totalCost = cart.reduce((s, x) => s + (x.unitPrice * x.quantity), 0);

        countBadge.textContent = totalQty;
        totalEl.textContent = '₹' + totalCost.toLocaleString('en-IN');

        if (cart.length === 0) {
          list.innerHTML = '<div class="py-12 text-center text-xs text-[#57534e]">Your cart is empty.</div>';
          footer.classList.add('hidden');
          return;
        }

        footer.classList.remove('hidden');
        list.innerHTML = cart.map(item => \`
          <div class="py-3 flex items-center justify-between">
            <div class="max-w-[220px]">
              <h4 class="font-heading font-bold text-xs text-[#18241b]">\${item.title}</h4>
              <span class="text-[11px] text-[#57534e]">₹\${item.unitPrice} each</span>
            </div>
            <div class="flex items-center space-x-2 border border-[#d8dcd4] rounded-lg bg-[#f4f3ec] px-1">
              <button onclick="updateCartQty('\${item.id}', -1)" class="px-2 py-0.5 text-xs font-black">-</button>
              <span class="text-xs font-bold">\${item.quantity}</span>
              <button onclick="updateCartQty('\${item.id}', 1)" class="px-2 py-0.5 text-xs font-black">+</button>
            </div>
            <span class="font-heading font-extrabold text-sm">₹\${(item.unitPrice * item.quantity).toLocaleString('en-IN')}</span>
          </div>
        \`).join('');
      }

      // Checkout Flow
      function openCheckoutModal() {
        toggleCartDrawer(false);
        document.getElementById('checkout-modal').classList.remove('hidden');
        document.getElementById('chk-step-1').classList.remove('hidden');
        document.getElementById('chk-step-2').classList.add('hidden');
        document.getElementById('chk-step-3').classList.add('hidden');
        logEvent('checkout_started', { cart: cart });
      }

      function closeCheckoutModal() {
        document.getElementById('checkout-modal').classList.add('hidden');
      }

      function validatePin(pin) {
        const clean = (pin || '').trim().replace(/\\D/g, '').slice(0, 6);
        const fb = document.getElementById('pin-feedback');
        const btn = document.getElementById('btn-to-pay');
        const phone = document.getElementById('chk-phone').value;

        if (clean.length === 6) {
          const first = clean.charAt(0);
          if (first >= '1' && first <= '8') {
            verifiedZone = storeConfig.postalZones[first] || 'India Zone';
            verifiedPinPrefix = clean.slice(0, 3);
            fb.className = 'mt-2 p-2 rounded-xl text-xs font-bold bg-[#1d6b3a]/10 text-[#1d6b3a] border border-[#1d6b3a]';
            fb.textContent = '✓ We deliver to this pincode. (' + verifiedZone + ')';
            fb.classList.remove('hidden');
            btn.disabled = !(phone.length === 10);
            return;
          }
        }
        fb.className = 'mt-2 p-2 rounded-xl text-xs font-bold bg-red-50 text-[#c8361f] border border-red-200';
        fb.textContent = 'Please enter a valid 6-digit Indian pincode (starts 1-8).';
        fb.classList.remove('hidden');
        btn.disabled = true;
      }

      function submitDeliveryDetails() {
        const pin = document.getElementById('chk-pincode').value;
        const phone = document.getElementById('chk-phone').value;
        if (!/^[6-9]\\d{9}$/.test(phone)) {
          alert('Please enter a valid 10-digit Indian mobile starting with 6, 7, 8 or 9.');
          return;
        }
        logEvent('details_submitted', { pinPrefix: verifiedPinPrefix, zone: verifiedZone });
        document.getElementById('chk-step-1').classList.add('hidden');
        document.getElementById('chk-step-2').classList.remove('hidden');

        const totalCost = cart.reduce((s, x) => s + (x.unitPrice * x.quantity), 0);
        document.getElementById('chk-step2-total').textContent = '₹' + totalCost.toLocaleString('en-IN');
        document.getElementById('btn-pay-now').textContent = 'Pay ₹' + totalCost.toLocaleString('en-IN');
      }

      function setPayMethod(m) {
        chosenPayMethod = m;
        ['upi', 'card', 'cod'].forEach(opt => {
          const el = document.getElementById('p-opt-' + opt);
          el.className = (opt === m)
            ? 'p-3.5 rounded-xl border-2 border-[#1d6b3a] bg-[#1d6b3a]/15 flex flex-col items-center font-bold'
            : 'p-3.5 rounded-xl border-2 border-[#d8dcd4] bg-[#f4f3ec] flex flex-col items-center';
        });
        const totalCost = cart.reduce((s, x) => s + (x.unitPrice * x.quantity), 0);
        document.getElementById('btn-pay-now').disabled = false;
        document.getElementById('btn-pay-now').textContent = m === 'cod' ? 'Place order · ₹' + totalCost : 'Pay ₹' + totalCost;
        logEvent('payment_method_selected', { method: m });
      }

      function submitPayClick() {
        const totalCost = cart.reduce((s, x) => s + (x.unitPrice * x.quantity), 0);
        logEvent('pay_clicked', {
          total: totalCost,
          items: cart,
          method: chosenPayMethod,
          pinPrefix: verifiedPinPrefix,
          zone: verifiedZone,
          variant: variant
        });
        document.getElementById('chk-step-2').classList.add('hidden');
        document.getElementById('chk-step-3').classList.remove('hidden');
        document.getElementById('rev-email-val').value = document.getElementById('chk-email').value || '';
      }

      function toggleOptinEmail(checked) {
        document.getElementById('rev-email-box').classList.toggle('hidden', !checked);
      }

      function submitRevealSurvey(e) {
        e.preventDefault();
        const feeling = document.querySelector('input[name="feeling"]:checked')?.value || '';
        const stopped = document.getElementById('rev-stopped').value;
        const freq = document.querySelector('input[name="rev-freq"]:checked')?.value || '';
        const optin = document.getElementById('rev-optin').checked;
        const optinEmail = document.getElementById('rev-email-val').value;

        logEvent('survey_submitted', {
          tubeFeeling: feeling,
          stoppedText: stopped,
          frequency: freq,
          optedIn: optin
        });

        if (optin && optinEmail) {
          fetch('/api/signups', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: optinEmail, variant: variant })
          }).catch(() => {});
        }

        // PRIVACY ENFORCEMENT: Clear cart and inputs from memory
        cart = [];
        localStorage.removeItem('ct_cart_items');
        document.getElementById('reveal-survey-form').classList.add('hidden');
        document.getElementById('reveal-done-msg').classList.remove('hidden');
      }

      function handleRequestSubmit(e) {
        e.preventDefault();
        const name = document.getElementById('req-name').value;
        const reg = document.getElementById('req-region').value;
        fetch('/api/requests', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: name, region: reg })
        }).catch(() => {});
        logEvent('chutney_requested', { name: name, region: reg });
        document.getElementById('btn-req-send').textContent = 'Sent!';
        setTimeout(() => {
          document.getElementById('req-name').value = '';
          document.getElementById('req-region').value = '';
          document.getElementById('btn-req-send').textContent = 'Send';
        }, 3000);
      }

      function openFlavourDetail(id) {
        const f = storeConfig.flavours.find(x => x.id === id);
        if (f) logEvent('product_viewed', { flavour: id });
      }

      // 50% scroll tracking
      let scroll50Logged = false;
      window.addEventListener('scroll', function() {
        if (scroll50Logged) return;
        const total = document.documentElement.scrollHeight - window.innerHeight;
        if (total > 0 && (window.scrollY / total) >= 0.5) {
          scroll50Logged = true;
          logEvent('scroll_50');
        }
      }, { passive: true });

      window.addEventListener('load', function() {
        updatePricingUI();
        logEvent('page_view', { path: '/' });
      });
    </script>
  `
  );
}

// Render Admin Dashboard HTML
function renderAdminDashboardHtml() {
  const c = storeConfig;
  return renderHtmlShell(
    "Admin Dashboard",
    `
    <header class="bg-[#134a28] text-white py-4 px-4 sm:px-8 sticky top-0 z-30 shadow-md">
      <div class="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div class="flex items-center space-x-3">
          <span class="font-heading font-black text-xl text-[#f2b81d]">${c.brand.name}</span>
          <span class="text-[10px] uppercase font-bold bg-[#f2b81d] text-[#18241b] px-2.5 py-0.5 rounded-full font-heading">
            Live Demand Dashboard
          </span>
        </div>
        <div class="flex flex-wrap items-center gap-2 text-xs">
          <a href="/api/export?token=admin_auth_valid" download class="bg-[#18241b] hover:bg-black text-[#f2b81d] font-heading font-bold px-3.5 py-2 rounded-xl transition">
            📥 Export Events CSV
          </a>
          <a href="/api/export?token=admin_auth_valid&type=signups" download class="bg-[#f2b81d] hover:bg-[#e2a80d] text-[#18241b] font-heading font-bold px-3.5 py-2 rounded-xl transition">
            ✉️ Export Sign-ups CSV
          </a>
          <button onclick="loadMetrics()" class="bg-white/10 hover:bg-white/20 text-white font-bold px-3 py-2 rounded-xl">↻ Refresh</button>
        </div>
      </div>
    </header>

    <!-- Filters -->
    <section class="bg-white border-b border-[#d8dcd4] py-3.5 px-4 sm:px-8">
      <div class="max-w-7xl mx-auto flex flex-wrap items-center gap-4 text-xs font-bold text-[#18241b]">
        <div class="flex items-center space-x-2"><span class="text-[#57534e]">Campaign:</span>
          <select id="flt-camp" onchange="loadMetrics()" class="px-3 py-1.5 rounded-lg border border-[#d8dcd4] bg-[#f4f3ec] text-xs">
            <option value="all">All Campaigns</option>
          </select>
        </div>
        <label class="flex items-center space-x-2 cursor-pointer bg-[#f4f3ec] px-3 py-1.5 rounded-lg border border-[#d8dcd4] ml-auto">
          <input type="checkbox" id="flt-internal" onchange="loadMetrics()" class="rounded text-[#1d6b3a]">
          <span>Include internal visits (/?admin=1)</span>
        </label>
      </div>
    </section>

    <!-- Main Metrics Area -->
    <main class="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 space-y-8" id="metrics-view">
      <div class="text-center py-16 text-sm text-[#57534e]">Loading analytics...</div>
    </main>

    <script>
      function loadMetrics() {
        const camp = document.getElementById('flt-camp').value || 'all';
        const internal = document.getElementById('flt-internal').checked;
        fetch('/api/admin/metrics?token=admin_auth_valid&campaign=' + encodeURIComponent(camp) + '&includeInternal=' + internal)
          .then(res => res.json())
          .then(data => renderMetrics(data))
          .catch(e => console.error(e));
      }

      function renderMetrics(d) {
        const k = d.kpis;
        const html = \`
          <!-- KPI Cards -->
          <div class="grid grid-cols-2 lg:grid-cols-5 gap-4">
            <div class="bg-white rounded-2xl p-5 border border-[#d8dcd4] shadow-sm">
              <span class="text-xs font-bold text-[#57534e] block">Total Visitors</span>
              <span class="font-heading font-black text-3xl text-[#18241b]">\${k.visitors}</span>
            </div>
            <div class="bg-white rounded-2xl p-5 border border-[#d8dcd4] shadow-sm">
              <span class="text-xs font-bold text-[#57534e] block">Added to Cart %</span>
              <span class="font-heading font-black text-3xl text-[#1d6b3a]">\${k.addedToCartPct}</span>
            </div>
            <div class="bg-white rounded-2xl p-5 border border-[#d8dcd4] shadow-sm">
              <span class="text-xs font-bold text-[#57534e] block">Started Checkout %</span>
              <span class="font-heading font-black text-3xl text-[#18241b]">\${k.startedCheckoutPct}</span>
            </div>
            <div class="bg-[#134a28] text-white rounded-2xl p-5 border-2 border-[#f2b81d] shadow-md">
              <span class="text-xs font-bold text-[#f2b81d] block">Pressed Pay % 🔥</span>
              <span class="font-heading font-black text-3xl text-white">\${k.pressedPayPct}</span>
            </div>
            <div class="col-span-2 lg:col-span-1 bg-white rounded-2xl p-5 border border-[#d8dcd4] shadow-sm">
              <span class="text-xs font-bold text-[#57534e] block">Launch Sign-ups</span>
              <span class="font-heading font-black text-3xl text-[#c8361f]">\${k.launchSignups}</span>
            </div>
          </div>

          <!-- Funnel Progress -->
          <div class="bg-white rounded-3xl p-6 border border-[#d8dcd4] shadow-sm space-y-4">
            <h3 class="font-heading font-black text-lg text-[#18241b]">Funnel Progression &amp; Drop-off</h3>
            <div class="space-y-3">
              \${d.funnel.map((s, i) => \`
                <div>
                  <div class="flex justify-between text-xs font-bold mb-1">
                    <span>\${s.step}: \${s.count} users (\${s.pctOfTotal}%)</span>
                    <span class="text-[#c8361f]">\${i > 0 ? 'Drop: ' + s.dropoffPct + '%' : ''}</span>
                  </div>
                  <div class="w-full h-3 bg-[#f4f3ec] rounded-full overflow-hidden border border-[#d8dcd4]">
                    <div class="h-full bg-[#1d6b3a]" style="width: \${Math.max(s.pctOfTotal, 2)}%"></div>
                  </div>
                </div>
              \`).join('')}
            </div>
          </div>

          <!-- Price Variant Breakdown -->
          <div class="bg-white rounded-3xl p-6 border border-[#d8dcd4] shadow-sm space-y-4">
            <h3 class="font-heading font-black text-base text-[#18241b]">A/B/C Price Variant Breakdown</h3>
            <table class="w-full text-left text-xs border-collapse">
              <thead>
                <tr class="border-b border-[#d8dcd4] text-[#57534e] font-heading font-bold text-[10px] uppercase">
                  <th class="p-2">Variant</th><th class="p-2">Prices</th><th class="p-2">Visitors</th>
                  <th class="p-2">Pay Clicked</th><th class="p-2 font-black text-[#134a28]">Pay Rate %</th><th class="p-2">AOV</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-[#d8dcd4]">
                \${d.variantTable.map(v => \`
                  <tr class="\${v.variant === d.bestVariant ? 'bg-[#f2b81d]/15 font-bold' : ''}">
                    <td class="p-2 font-heading font-bold">Variant \${v.variant} \${v.variant === d.bestVariant ? '⭐' : ''}</td>
                    <td class="p-2 text-[#57534e]">\${v.priceInfo}</td>
                    <td class="p-2">\${v.visitors}</td>
                    <td class="p-2 font-bold text-[#1d6b3a]">\${v.pay}</td>
                    <td class="p-2 font-heading font-black text-[#134a28]">\${v.payRate}</td>
                    <td class="p-2">\${v.aov}</td>
                  </tr>
                \`).join('')}
              </tbody>
            </table>
          </div>

          <!-- Flavour Demand -->
          <div class="bg-white rounded-3xl p-6 border border-[#d8dcd4] shadow-sm space-y-4">
            <h3 class="font-heading font-black text-base text-[#18241b]">Flavour Demand (Tubes Where Pay Clicked)</h3>
            <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 text-xs">
              \${d.sortedFlavours.map(f => \`
                <div class="p-3 bg-[#f4f3ec] rounded-xl border border-[#d8dcd4]">
                  <span class="text-[10px] text-[#57534e] block">\${f.local}</span>
                  <strong class="font-heading text-sm text-[#18241b] block leading-tight">\${f.name}</strong>
                  <div class="mt-2 text-[#1d6b3a] font-heading font-black text-base">\${f.orderedTubes} tubes</div>
                </div>
              \`).join('')}
            </div>
          </div>
        \`;
        document.getElementById('metrics-view').innerHTML = html;
      }

      window.addEventListener('load', loadMetrics);
    </script>
  `
  );
}

server.listen(PORT, () => {
  console.log(`\n======================================================`);
  console.log(`🚀 ${storeConfig.brand.name} Production Server running at:`);
  console.log(`   http://localhost:${PORT}`);
  console.log(`   Admin Dashboard: http://localhost:${PORT}/admin`);
  console.log(`======================================================\n`);
});
