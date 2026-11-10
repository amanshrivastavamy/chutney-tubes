import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";
const { calculateMetrics } = require("../../../lib/metrics");
import productConfig from "../../../config/product.config";

const dataFilePath = path.join(process.cwd(), "data", "events.json");

function readEvents(): any[] {
  try {
    if (!fs.existsSync(dataFilePath)) return [];
    return JSON.parse(fs.readFileSync(dataFilePath, "utf-8") || "[]");
  } catch (err) {
    return [];
  }
}

export async function POST(req: NextRequest) {
  try {
    const { password } = await req.json();
    const correctPassword = process.env.ADMIN_PASSWORD || productConfig.brand.adminPassword || "chutney2026";

    if (password === correctPassword) {
      return NextResponse.json({ authenticated: true, token: "admin_auth_valid" });
    }
    return NextResponse.json({ authenticated: false, error: "Invalid password" }, { status: 401 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization") || req.nextUrl.searchParams.get("token");
  const pwdParam = req.nextUrl.searchParams.get("password");
  const correctPassword = process.env.ADMIN_PASSWORD || productConfig.brand.adminPassword || "chutney2026";

  const isAuth = authHeader === "Bearer admin_auth_valid" || pwdParam === correctPassword;
  if (!isAuth) {
    return NextResponse.json({ error: "Unauthorized access" }, { status: 401 });
  }

  const events = readEvents();
  const metrics = calculateMetrics(events);
  return NextResponse.json(metrics);
}
