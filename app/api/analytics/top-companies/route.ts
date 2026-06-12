// =============================================================================
// app/api/analytics/top-companies/route.ts
// GET /api/analytics/top-companies?dateFrom=...&dateTo=...
// Ambil top 10 company berdasarkan jumlah ticket
// =============================================================================

import { auth }             from "@/lib/auth";
import { getTopCompanies }  from "@/lib/queries/analytics";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = req.nextUrl;
  const dateFrom = searchParams.get("dateFrom") ?? "";
  const dateTo   = searchParams.get("dateTo")   ?? "";

  try {
    const data = await getTopCompanies({ dateFrom, dateTo });
    return NextResponse.json(data);
  } catch (error) {
    console.error("Error fetching top companies:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
