import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";

const requestsFilePath = path.join(process.cwd(), "data", "requests.json");

function readRequests(): any[] {
  try {
    if (!fs.existsSync(requestsFilePath)) return [];
    return JSON.parse(fs.readFileSync(requestsFilePath, "utf-8") || "[]");
  } catch (err) {
    return [];
  }
}

function writeRequests(data: any[]) {
  try {
    const dir = path.dirname(requestsFilePath);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(requestsFilePath, JSON.stringify(data, null, 2), "utf-8");
  } catch (err) {
    console.error("Failed to write requests:", err);
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    if (!body || !body.name) {
      return NextResponse.json({ error: "Chutney name is required" }, { status: 400 });
    }

    const requests = readRequests();
    requests.push({
      name: body.name.trim(),
      region: (body.region || "").trim(),
      timestamp: body.timestamp || new Date().toISOString(),
      visitorId: body.visitorId || "anon",
    });
    writeRequests(requests);

    return NextResponse.json({ success: true, count: requests.length }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json(readRequests());
}
