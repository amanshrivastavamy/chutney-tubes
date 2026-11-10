import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";

const dataFilePath = path.join(process.cwd(), "data", "events.json");

function readEvents(): any[] {
  try {
    if (!fs.existsSync(dataFilePath)) return [];
    const content = fs.readFileSync(dataFilePath, "utf-8");
    return JSON.parse(content || "[]");
  } catch (err) {
    return [];
  }
}

function writeEvents(events: any[]) {
  try {
    const dir = path.dirname(dataFilePath);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(dataFilePath, JSON.stringify(events, null, 2), "utf-8");
  } catch (err) {
    console.error("Failed to persist event to disk:", err);
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    if (!body || !body.event) {
      return NextResponse.json({ error: "Missing event name" }, { status: 400 });
    }

    const payload = {
      event: body.event,
      timestamp: body.timestamp || new Date().toISOString(),
      visitorId: body.visitorId || "anon",
      variant: body.variant || "A",
      source: body.source || "direct",
      metadata: body.metadata || {},
    };

    const events = readEvents();
    events.push(payload);
    writeEvents(events);

    return NextResponse.json({ success: true, count: events.length }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({ status: "ok", count: readEvents().length });
}
