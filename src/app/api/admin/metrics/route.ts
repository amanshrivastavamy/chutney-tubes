import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { ADMIN_COOKIE_NAME, isValidAdminSession } from "../../../../lib/auth";
const { calculateDashboardMetrics } = require("../../../../lib/metrics.js");

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
