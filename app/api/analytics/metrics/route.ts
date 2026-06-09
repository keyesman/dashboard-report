// =============================================================================
// app/api/analytics/metrics/route.ts
// API route untuk summary metrics
// GET /api/analytics/metrics?dateFrom=...&dateTo=...
// =============================================================================

import { auth }           from "@/lib/auth";
import { getAvgMetrics }  from "@/lib/queries/analytics";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = req.nextUrl;
  const dateFrom = searchParams.get("dateFrom") ?? "";
  const dateTo   = searchParams.get("dateTo")   ?? "";

  try {
    const metrics = await getAvgMetrics({ dateFrom, dateTo });
    return NextResponse.json(metrics);
  } catch (error) {
    console.error("Error fetching metrics:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
