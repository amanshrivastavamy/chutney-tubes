import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";
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
    const { password, email } = await req.json();
    const correctPassword = process.env.ADMIN_PASSWORD || "chutney2026";

    // Supports password or email/password authentication
    if (password === correctPassword) {
      return NextResponse.json({ authenticated: true, token: "admin_auth_valid" });
    }
    return NextResponse.json({ authenticated: false, error: "Incorrect admin credentials" }, { status: 401 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  const auth = req.headers.get("authorization") || req.nextUrl.searchParams.get("token");
  const pwd = req.nextUrl.searchParams.get("password");
  const adminPassword = process.env.ADMIN_PASSWORD || "chutney2026";

  if (auth !== "Bearer admin_auth_valid" && pwd !== adminPassword && auth !== "admin_auth_valid") {
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
