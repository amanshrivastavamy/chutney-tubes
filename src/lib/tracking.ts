// Production Event & Demand Tracking System

export type EventName =
  | "page_view"
  | "scroll_50"
  | "spice_filter_used"
  | "product_viewed"
  | "add_to_cart"
  | "notify_click"
  | "checkout_started"
  | "details_submitted"
  | "payment_method_selected"
  | "pay_clicked"
  | "survey_submitted"
  | "launch_optin"
  | "chutney_requested";

export interface UtmParams {
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  utm_content?: string;
  referrer?: string;
}

export interface EventDocument {
  visitorId: string;
  sessionId: string;
  variant: "a" | "b" | "c";
  isInternal: boolean;
  utm: UtmParams;
  timestamp: string;
  event: EventName;
  payload: Record<string, any>;
}

const VISITOR_ID_KEY = "ct_visitor_id";
const SESSION_ID_KEY = "ct_session_id";
const VARIANT_KEY = "ct_price_variant";
const UTM_KEY = "ct_utm_params";
const INTERNAL_KEY = "ct_is_internal";

function getCookie(name: string): string | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(new RegExp("(^| )" + name + "=([^;]+)"));
  return match ? decodeURIComponent(match[2]) : null;
}

function setCookie(name: string, value: string, days = 365) {
  if (typeof document === "undefined") return;
  const expires = new Date(Date.now() + days * 864e5).toUTCString();
  document.cookie = `${name}=${encodeURIComponent(value)}; expires=${expires}; path=/; SameSite=Lax`;
}

/**
 * Returns or generates a persistent anonymous visitor UUID
 */
export function getVisitorId(): string {
  if (typeof window === "undefined") return "server_ssr";

  let id = getCookie(VISITOR_ID_KEY) || localStorage.getItem(VISITOR_ID_KEY);
  if (!id) {
    id = "vis_" + Date.now().toString(36) + "_" + Math.random().toString(36).substring(2, 10);
    setCookie(VISITOR_ID_KEY, id);
    localStorage.setItem(VISITOR_ID_KEY, id);
  }
  return id;
}

/**
 * Session ID (refreshed per tab/session)
 */
export function getSessionId(): string {
  if (typeof window === "undefined") return "sess_ssr";

  let sess = sessionStorage.getItem(SESSION_ID_KEY);
  if (!sess) {
    sess = "sess_" + Date.now().toString(36) + "_" + Math.random().toString(36).substring(2, 8);
    sessionStorage.setItem(SESSION_ID_KEY, sess);
  }
  return sess;
}

export function resolveVariant(searchParams?: URLSearchParams | null): "a" | "b" | "c" {
  if (typeof window === "undefined") return "a";

  try {
    const params = searchParams || new URLSearchParams(window.location.search);
    const paramV = params.get("variant")?.trim().toLowerCase();

    if (paramV === "a" || paramV === "b" || paramV === "c") {
      setCookie(VARIANT_KEY, paramV);
      localStorage.setItem(VARIANT_KEY, paramV);
      return paramV;
    }

    const saved = (getCookie(VARIANT_KEY) || localStorage.getItem(VARIANT_KEY))?.toLowerCase();
    if (saved === "a" || saved === "b" || saved === "c") {
      return saved;
    }

    return "a";
  } catch (e) {
    return "a";
  }
}

/**
 * Checks for hidden /?admin=1 to flag internal visits
 */
export function checkInternalVisit(searchParams?: URLSearchParams | null): boolean {
  if (typeof window === "undefined") return false;

  const params = searchParams || new URLSearchParams(window.location.search);
  if (params.get("admin") === "1") {
    localStorage.setItem(INTERNAL_KEY, "true");
    setCookie(INTERNAL_KEY, "true");
    return true;
  }

  return localStorage.getItem(INTERNAL_KEY) === "true" || getCookie(INTERNAL_KEY) === "true";
}

/**
 * Captures UTM parameters & referrer on first visit
 */
export function getUtmParams(searchParams?: URLSearchParams | null): UtmParams {
  if (typeof window === "undefined") return {};

  try {
    const saved = localStorage.getItem(UTM_KEY);
    if (saved) return JSON.parse(saved);

    const params = searchParams || new URLSearchParams(window.location.search);
    const utm: UtmParams = {
      utm_source: params.get("utm_source") || params.get("src") || undefined,
      utm_medium: params.get("utm_medium") || undefined,
      utm_campaign: params.get("utm_campaign") || undefined,
      utm_content: params.get("utm_content") || undefined,
      referrer: document.referrer || undefined,
    };

    localStorage.setItem(UTM_KEY, JSON.stringify(utm));
    return utm;
  } catch (e) {
    return {};
  }
}

// Queue for buffering / debouncing network writes
let eventQueue: EventDocument[] = [];
let queueTimeout: any = null;

function flushQueue() {
  if (eventQueue.length === 0) return;
  const batch = [...eventQueue];
  eventQueue = [];

  fetch("/api/events", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ batch }),
    keepalive: true,
  }).catch(() => {});
}

/**
 * Primary track function.
 */
export function track(eventName: EventName, payload: Record<string, any> = {}) {
  if (typeof window === "undefined") return;

  const doc: EventDocument = {
    visitorId: getVisitorId(),
    sessionId: getSessionId(),
    variant: resolveVariant(),
    isInternal: checkInternalVisit(),
    utm: getUtmParams(),
    timestamp: new Date().toISOString(),
    event: eventName,
    payload,
  };

  eventQueue.push(doc);

  if (queueTimeout) clearTimeout(queueTimeout);
  queueTimeout = setTimeout(flushQueue, 300);
}

/**
 * Record a launch-day sign-up in "signups" collection
 */
export function recordLaunchSignup(email: string) {
  if (!email || !email.includes("@")) return;

  const utm = getUtmParams();
  const data = {
    email: email.trim().toLowerCase(),
    timestamp: new Date().toISOString(),
    variant: resolveVariant(),
    utm_campaign: utm.utm_campaign || utm.utm_source || "direct",
    visitorId: getVisitorId(),
  };

  fetch("/api/signups", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
    keepalive: true,
  }).catch(() => {});

  track("launch_optin", { email: email.trim().toLowerCase() });
}

/**
 * Record a requested chutney in "requests" collection
 */
export function recordChutneyRequest(name: string, region: string) {
  if (!name || name.trim().length === 0) return;

  const data = {
    name: name.trim(),
    region: (region || "").trim(),
    timestamp: new Date().toISOString(),
    visitorId: getVisitorId(),
  };

  fetch("/api/requests", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
    keepalive: true,
  }).catch(() => {});

  track("chutney_requested", { name: name.trim(), region: (region || "").trim() });
}

// Aliases for compatibility
export const trackEvent = (eventName: string, payload: Record<string, any> = {}) => {
  track(eventName as any, payload);
};

export const resolvePriceVariant = (): "a" | "b" | "c" => {
  return resolveVariant();
};

export const resolveTrafficSource = (): string => {
  const utm = getUtmParams();
  return utm.utm_source || "direct";
};
