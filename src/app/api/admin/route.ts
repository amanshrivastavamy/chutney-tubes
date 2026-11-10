import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { ADMIN_COOKIE_NAME, getExpectedSessionToken, isValidAdminSession } from "../../../lib/auth";
const { calculateDashboardMetrics } = require("../../../lib/metrics.js");

const eventsFile = path.join(process.cwd(), "data", "events.json");
const signupsFile = path.join(process.cwd(), "data", "signups.json");
const requestsFile = path.join(process.cwd(), "data", "requests.json");

function safeRead(fp: string): any[] {
  try {
    if (!fs.existsSync(fp)) return [];
    return JSON.parse(fs.readFileSync(fp, "utf-8") || "[]");
  } catch (e) {
    return [];
  }
}

export async function POST(req: NextRequest) {
  try {
    const adminPassword = process.env.ADMIN_PASSWORD;
    if (!adminPassword || adminPassword.trim().length === 0) {
      return NextResponse.json(
        { authenticated: false, error: "Admin not configured" },
        { status: 503 }
      );
    }

    const { password, action } = await req.json();

    if (action === "logout") {
      const res = NextResponse.json({ success: true, authenticated: false });
      res.cookies.delete(ADMIN_COOKIE_NAME);
      return res;
    }

    if (password === adminPassword) {
      const token = getExpectedSessionToken()!;
      const res = NextResponse.json({ success: true, authenticated: true });
      res.cookies.set(ADMIN_COOKIE_NAME, token, {
        httpOnly: true,
        secure: true,
        sameSite: "strict",
        path: "/",
        maxAge: 86400 * 7,
      });
      return res;
    }

    return NextResponse.json(
      { authenticated: false, error: "Incorrect admin credentials" },
      { status: 401 }
    );
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE() {
  const res = NextResponse.json({ success: true, authenticated: false });
  res.cookies.delete(ADMIN_COOKIE_NAME);
  return res;
}

export async function GET(req: NextRequest) {
  const sessionCookie = req.cookies.get(ADMIN_COOKIE_NAME)?.value;

  if (!isValidAdminSession(sessionCookie)) {
    return NextResponse.json({ error: "Unauthorized access" }, { status: 401 });
  }

  const startDate = req.nextUrl.searchParams.get("startDate") || undefined;
  const endDate = req.nextUrl.searchParams.get("endDate") || undefined;
  const campaign = req.nextUrl.searchParams.get("campaign") || "all";
  const includeInternal = req.nextUrl.searchParams.get("includeInternal") === "true";

  const events = safeRead(eventsFile);
  const signups = safeRead(signupsFile);
  const requests = safeRead(requestsFile);

  const metrics = calculateDashboardMetrics(events, signups, requests, {
    startDate,
    endDate,
    campaign,
    includeInternal,
  });

  return NextResponse.json(metrics);
}
