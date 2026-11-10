import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";

const signupsFilePath = path.join(process.cwd(), "data", "signups.json");

function readSignups(): any[] {
  try {
    if (!fs.existsSync(signupsFilePath)) return [];
    return JSON.parse(fs.readFileSync(signupsFilePath, "utf-8") || "[]");
  } catch (err) {
    return [];
  }
}

function writeSignups(data: any[]) {
  try {
    const dir = path.dirname(signupsFilePath);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(signupsFilePath, JSON.stringify(data, null, 2), "utf-8");
  } catch (err) {
    console.error("Failed to write signups:", err);
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    if (!body || !body.email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    const signups = readSignups();
    signups.push({
      email: body.email.trim().toLowerCase(),
      timestamp: body.timestamp || new Date().toISOString(),
      variant: body.variant || "a",
      utm_campaign: body.utm_campaign || "direct",
      visitorId: body.visitorId || "anon",
    });
    writeSignups(signups);

    return NextResponse.json({ success: true, count: signups.length }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json(readSignups());
}
