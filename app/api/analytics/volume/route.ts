// =============================================================================
// app/api/analytics/volume/route.ts
// API route untuk daily ticket volume
// GET /api/analytics/volume?dateFrom=...&dateTo=...
// =============================================================================

import { auth }            from "@/lib/auth";
import { getDailyVolume }  from "@/lib/queries/analytics";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = req.nextUrl;
  const dateFrom = searchParams.get("dateFrom") ?? "";
  const dateTo   = searchParams.get("dateTo")   ?? "";

  try {
    const data = await getDailyVolume({ dateFrom, dateTo });
    return NextResponse.json(data);
  } catch (error) {
    console.error("Error fetching volume:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
