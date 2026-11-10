import crypto from "crypto";

export const ADMIN_COOKIE_NAME = "ct_admin_session";

export function getExpectedSessionToken(): string | null {
  const pwd = process.env.ADMIN_PASSWORD;
  if (!pwd || pwd.trim().length === 0) return null;
  return crypto.createHash("sha256").update(pwd.trim() + "_chutney_tubes_auth_2026").digest("hex");
}

export function createAdminSessionToken(): string | null {
  return getExpectedSessionToken();
}

export function isValidAdminSession(token: string | null | undefined): boolean {
  const expected = getExpectedSessionToken();
  if (!expected || !token) return false;
  return token === expected;
}

// Support CommonJS require in Node.js scripts and tests
if (typeof module !== "undefined" && module.exports) {
  module.exports = {
    ADMIN_COOKIE_NAME,
    getExpectedSessionToken,
    createAdminSessionToken,
    isValidAdminSession,
  };
}
