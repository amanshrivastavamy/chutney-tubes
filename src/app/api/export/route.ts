import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import productConfig from "../../../config/product.config";

const dataFilePath = path.join(process.cwd(), "data", "events.json");

function escapeCsv(val: any): string {
  if (val === undefined || val === null) return '""';
  const str = String(val).replace(/"/g, '""');
  return `"${str}"`;
}

export function generateCsvString(events: any[]): string {
  const headers = [
    "Timestamp",
    "Event",
    "Visitor_ID",
    "Price_Variant",
    "Traffic_Source",
    "Flavour",
    "Pack",
    "Quantity",
    "Total_Amount_INR",
    "Pincode",
    "Is_Deliverable",
    "Payment_Method",
    "Survey_Feedback",
    "Usage_Frequency",
    "Launch_Discount_OptIn",
  ];

  const rows = events.map((ev) => {
    const meta = ev.metadata || {};
    return [
      escapeCsv(ev.timestamp),
      escapeCsv(ev.event),
      escapeCsv(ev.visitorId),
      escapeCsv(ev.variant),
      escapeCsv(ev.source),
      escapeCsv(meta.flavour),
      escapeCsv(meta.pack),
      escapeCsv(meta.quantity),
      escapeCsv(meta.totalAmount),
      escapeCsv(meta.pincode),
      escapeCsv(meta.isDeliverable),
      escapeCsv(meta.paymentMethod),
      escapeCsv(meta.feedback),
      escapeCsv(meta.frequency),
      escapeCsv(meta.optInDiscount),
    ].join(",");
  });

  return [headers.join(","), ...rows].join("\r\n");
}

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization") || req.nextUrl.searchParams.get("token");
  const pwdParam = req.nextUrl.searchParams.get("password");
  const correctPassword = process.env.ADMIN_PASSWORD || productConfig.brand.adminPassword || "chutney2026";

  const isAuth = authHeader === "Bearer admin_auth_valid" || pwdParam === correctPassword;
  if (!isAuth) {
    return NextResponse.json({ error: "Unauthorized access" }, { status: 401 });
  }

  let events: any[] = [];
  try {
    if (fs.existsSync(dataFilePath)) {
      events = JSON.parse(fs.readFileSync(dataFilePath, "utf-8") || "[]");
    }
  } catch (err) {
    events = [];
  }

  const csv = generateCsvString(events);

  return new NextResponse(csv, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="chutney-tubes-demand-test-${new Date().toISOString().slice(0, 10)}.csv"`,
    },
  });
}
