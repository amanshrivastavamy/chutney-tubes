import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";

const dataFilePath = path.join(process.cwd(), "data", "events.json");

function readEvents(): any[] {
  try {
    if (!fs.existsSync(dataFilePath)) return [];
    return JSON.parse(fs.readFileSync(dataFilePath, "utf-8") || "[]");
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
    console.error("Failed to persist event:", err);
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const currentEvents = readEvents();

    if (body.batch && Array.isArray(body.batch)) {
      // PRIVACY ENFORCEMENT: Never store personal details (name, phone, full address)
      const sanitizedBatch = body.batch.map((ev: any) => {
        const payload = ev.payload || {};
        delete payload.customerName;
        delete payload.customerPhone;
        delete payload.customerAddress;
        return {
          ...ev,
          payload,
        };
      });
      currentEvents.push(...sanitizedBatch);
    } else if (body.event) {
      const payload = body.payload || body.metadata || {};
      delete payload.customerName;
      delete payload.customerPhone;
      delete payload.customerAddress;

      currentEvents.push({
        visitorId: body.visitorId || "anon",
        sessionId: body.sessionId || "sess_anon",
        variant: body.variant || "a",
        isInternal: Boolean(body.isInternal),
        utm: body.utm || {},
        timestamp: body.timestamp || new Date().toISOString(),
        event: body.event,
        payload,
      });
    }

    writeEvents(currentEvents);
    return NextResponse.json({ success: true, count: currentEvents.length }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({ count: readEvents().length });
}
