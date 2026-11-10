import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";

const eventsFile = path.join(process.cwd(), "data", "events.json");
const signupsFile = path.join(process.cwd(), "data", "signups.json");

function safeRead(fp: string): any[] {
  try {
    if (!fs.existsSync(fp)) return [];
    return JSON.parse(fs.readFileSync(fp, "utf-8") || "[]");
  } catch (e) {
    return [];
  }
}

function escapeCsv(val: any): string {
  if (val === undefined || val === null) return '""';
  const str = String(val).replace(/"/g, '""');
  return `"${str}"`;
}

export function generateEventsCsv(events: any[]): string {
  const headers = [
    "Timestamp",
    "Event",
    "Visitor_ID",
    "Session_ID",
    "Price_Variant",
    "Is_Internal",
    "UTM_Source",
    "UTM_Campaign",
    "Kind",
    "Flavours",
    "Quantity",
    "Total_Amount",
    "Postal_Zone",
    "Pincode_Prefix",
    "Payment_Method",
    "Tube_Feeling",
    "What_Stopped_You",
    "Usage_Frequency",
  ];

  const rows = events.map((ev) => {
    const p = ev.payload || {};
    const utm = ev.utm || {};
    return [
      escapeCsv(ev.timestamp),
      escapeCsv(ev.event),
      escapeCsv(ev.visitorId),
      escapeCsv(ev.sessionId),
      escapeCsv(ev.variant),
      escapeCsv(ev.isInternal ? "true" : "false"),
      escapeCsv(utm.utm_source),
      escapeCsv(utm.utm_campaign),
      escapeCsv(p.kind),
      escapeCsv(Array.isArray(p.flavours) ? p.flavours.join(";") : p.flavour),
      escapeCsv(p.qty || p.quantity),
      escapeCsv(p.total || p.unitPrice),
      escapeCsv(p.zone),
      escapeCsv(p.pinPrefix),
      escapeCsv(p.method || p.paymentMethod),
      escapeCsv(p.tubeFeeling),
      escapeCsv(p.stoppedText),
      escapeCsv(p.frequency),
    ].join(",");
  });

  return [headers.join(","), ...rows].join("\r\n");
}

export function generateSignupsCsv(signups: any[]): string {
  const headers = ["Timestamp", "Email", "Price_Variant", "Campaign", "Visitor_ID"];
  const rows = signups.map((s) => [
    escapeCsv(s.timestamp),
    escapeCsv(s.email),
    escapeCsv(s.variant),
    escapeCsv(s.utm_campaign),
    escapeCsv(s.visitorId),
  ].join(","));

  return [headers.join(","), ...rows].join("\r\n");
}

export async function GET(req: NextRequest) {
  const auth = req.headers.get("authorization") || req.nextUrl.searchParams.get("token");
  const pwd = req.nextUrl.searchParams.get("password");
  const adminPassword = process.env.ADMIN_PASSWORD || "chutney2026";

  if (auth !== "Bearer admin_auth_valid" && pwd !== adminPassword && auth !== "admin_auth_valid") {
    return NextResponse.json({ error: "Unauthorized access" }, { status: 401 });
  }

  const exportType = req.nextUrl.searchParams.get("type"); // "signups" or "events"
  const dateStr = new Date().toISOString().slice(0, 10);

  if (exportType === "signups") {
    const signups = safeRead(signupsFile);
    const csv = generateSignupsCsv(signups);
    return new NextResponse(csv, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="chutney-tubes-launch-signups-${dateStr}.csv"`,
      },
    });
  }

  const events = safeRead(eventsFile);
  const csv = generateEventsCsv(events);
  return new NextResponse(csv, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="chutney-tubes-demand-events-${dateStr}.csv"`,
    },
  });
}
