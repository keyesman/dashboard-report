// =============================================================================
// app/api/analytics/monthly-volume/route.ts
// GET /api/analytics/monthly-volume?year=2025
// Ambil jumlah ticket per bulan dalam 1 tahun
// =============================================================================

import { auth }              from "@/lib/auth";
import { getMonthlyVolume }  from "@/lib/queries/analytics";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = req.nextUrl;
  const year = Number(searchParams.get("year") ?? new Date().getFullYear());

  try {
    const data = await getMonthlyVolume(year);
    return NextResponse.json(data);
  } catch (error) {
    console.error("Error fetching monthly volume:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
