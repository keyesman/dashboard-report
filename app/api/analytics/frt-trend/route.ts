// =============================================================================
// app/api/analytics/frt-trend/route.ts
// API route untuk daily AVG FRT trend
// GET /api/analytics/frt-trend?dateFrom=...&dateTo=...
// =============================================================================

import { auth }           from "@/lib/auth";
import { getDailyAvgFrt } from "@/lib/queries/analytics";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = req.nextUrl;
  const dateFrom = searchParams.get("dateFrom") ?? "";
  const dateTo   = searchParams.get("dateTo")   ?? "";

  try {
    const data = await getDailyAvgFrt({ dateFrom, dateTo });
    return NextResponse.json(data);
  } catch (error) {
    console.error("Error fetching FRT trend:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
