// =============================================================================
// app/api/analytics/breakdown/route.ts
// API route untuk breakdown by field
// GET /api/analytics/breakdown?dateFrom=...&dateTo=...&field=agent
// =============================================================================

import { auth }             from "@/lib/auth";
import { getBreakdownBy, type BreakdownField } from "@/lib/queries/analytics";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = req.nextUrl;
  const dateFrom = searchParams.get("dateFrom") ?? "";
  const dateTo   = searchParams.get("dateTo")   ?? "";
  const field    = (searchParams.get("field") ?? "agent") as BreakdownField;

  // Validasi field
  const validFields = ["agent", "service", "type", "priority", "escalate"];
  if (!validFields.includes(field)) {
    return NextResponse.json({ error: "Invalid field" }, { status: 400 });
  }

  try {
    const data = await getBreakdownBy({ dateFrom, dateTo }, field);
    return NextResponse.json(data);
  } catch (error) {
    console.error("Error fetching breakdown:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
