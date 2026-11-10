// Client & Server Event Tracking Engine for Pre-launch Validation

export type EventType =
  | "page_view"
  | "scroll_50"
  | "flavour_selected"
  | "add_to_cart"
  | "checkout_started"
  | "pincode_checked"
  | "payment_method_selected"
  | "pay_clicked"
  | "waitlist_optin"
  | "survey_submitted";

export interface EventPayload {
  event: EventType;
  timestamp: string;
  visitorId: string;
  variant: "A" | "B" | "C";
  source: string;
  metadata?: Record<string, any>;
}

const VISITOR_KEY = "ct_visitor_id";
const VARIANT_KEY = "ct_price_variant";
const SOURCE_KEY = "ct_traffic_source";
const LOCAL_EVENTS_KEY = "ct_events_log";

/**
 * Generates an anonymous, persistent UUID-like visitor ID.
 */
export function getAnonymousVisitorId(): string {
  if (typeof window === "undefined") return "server_ssr";

  try {
    let id = localStorage.getItem(VISITOR_KEY);
    if (!id) {
      id = "vis_" + Date.now().toString(36) + "_" + Math.random().toString(36).substring(2, 9);
      localStorage.setItem(VISITOR_KEY, id);
    }
    return id;
  } catch (e) {
    return "anon_fallback";
  }
}

/**
 * Resolves price variant:
 * 1. URL search param ?variant=A|B|C (forces override)
 * 2. Sticky localStorage variant
 * 3. Random assignment (A, B, or C)
 */
export function resolvePriceVariant(searchParams?: URLSearchParams | null): "A" | "B" | "C" {
  if (typeof window === "undefined") return "A";

  try {
    const params = searchParams || new URLSearchParams(window.location.search);
    const paramVariant = params.get("variant")?.trim().toUpperCase();

    if (paramVariant === "A" || paramVariant === "B" || paramVariant === "C") {
      localStorage.setItem(VARIANT_KEY, paramVariant);
      return paramVariant;
    }

    const saved = localStorage.getItem(VARIANT_KEY)?.trim().toUpperCase();
    if (saved === "A" || saved === "B" || saved === "C") {
      return saved;
    }

    // Random assign with equal distribution
    const options: Array<"A" | "B" | "C"> = ["A", "B", "C"];
    const chosen = options[Math.floor(Math.random() * options.length)];
    localStorage.setItem(VARIANT_KEY, chosen);
    return chosen;
  } catch (e) {
    return "A";
  }
}

/**
 * Resolves traffic source:
 * 1. ?src= URL parameter (e.g. whatsapp, instagram, office-slack)
 * 2. Stored localStorage source
 * 3. Document referrer or 'direct'
 */
export function resolveTrafficSource(searchParams?: URLSearchParams | null): string {
  if (typeof window === "undefined") return "direct";

  try {
    const params = searchParams || new URLSearchParams(window.location.search);
    const paramSrc = params.get("src")?.trim().toLowerCase();

    if (paramSrc) {
      localStorage.setItem(SOURCE_KEY, paramSrc);
      return paramSrc;
    }

    const saved = localStorage.getItem(SOURCE_KEY);
    if (saved) return saved;

    if (document.referrer) {
      try {
        const refHost = new URL(document.referrer).hostname.replace(/^www\./, "");
        if (refHost.includes("instagram")) return "instagram";
        if (refHost.includes("whatsapp")) return "whatsapp";
        if (refHost.includes("linkedin")) return "linkedin";
        if (refHost.includes("facebook")) return "facebook";
        if (refHost.includes("twitter") || refHost.includes("x.com")) return "twitter";
        return refHost;
      } catch (err) {
        // ignore
      }
    }

    localStorage.setItem(SOURCE_KEY, "direct");
    return "direct";
  } catch (e) {
    return "direct";
  }
}

/**
 * Core event logging function.
 * Transports to:
 * 1. POST /api/events
 * 2. Firebase Firestore (if client sdk is active)
 * 3. Client localStorage buffer
 */
export async function trackEvent(
  event: EventType,
  metadata: Record<string, any> = {}
): Promise<EventPayload> {
  const visitorId = getAnonymousVisitorId();
  const variant = resolvePriceVariant();
  const source = resolveTrafficSource();
  const timestamp = new Date().toISOString();

  const payload: EventPayload = {
    event,
    timestamp,
    visitorId,
    variant,
    source,
    metadata,
  };

  // Buffer in local storage
  if (typeof window !== "undefined") {
    try {
      const stored = JSON.parse(localStorage.getItem(LOCAL_EVENTS_KEY) || "[]");
      stored.push(payload);
      if (stored.length > 200) stored.shift(); // keep last 200 locally
      localStorage.setItem(LOCAL_EVENTS_KEY, JSON.stringify(stored));
    } catch (e) {
      // storage quota / private mode
    }

    // Try posting to internal /api/events endpoint
    try {
      fetch("/api/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        keepalive: true, // ensures payload sends even on page unload
      }).catch(() => {
        // Silent catch for offline or non-blocking experience
      });
    } catch (e) {
      // fetch error ignored
    }
  }

  return payload;
}

/**
 * Setup 50% scroll listener on window
 */
export function setupScrollTracking(): () => void {
  if (typeof window === "undefined") return () => {};

  let tracked = false;
  const onScroll = () => {
    if (tracked) return;
    const scrollHeight = document.documentElement.scrollHeight - window.innerHeight;
    if (scrollHeight <= 0) return;
    const progress = window.scrollY / scrollHeight;
    if (progress >= 0.5) {
      tracked = true;
      trackEvent("scroll_50", { scrollPercent: Math.round(progress * 100) });
      window.removeEventListener("scroll", onScroll);
    }
  };

  window.addEventListener("scroll", onScroll, { passive: true });
  return () => window.removeEventListener("scroll", onScroll);
}
