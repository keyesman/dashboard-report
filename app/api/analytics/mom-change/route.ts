// =============================================================================
// app/api/analytics/mom-change/route.ts
// GET /api/analytics/mom-change?year=2026&month=1
// Hitung % perubahan ticket bulan ini vs bulan sebelumnya
// =============================================================================

import { auth }                    from "@/lib/auth";
import { getMonthOverMonthChange } from "@/lib/queries/analytics";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = req.nextUrl;
  const year  = Number(searchParams.get("year")  ?? new Date().getFullYear());
  const month = Number(searchParams.get("month") ?? new Date().getMonth() + 1);

  try {
    const data = await getMonthOverMonthChange(year, month);
    return NextResponse.json(data);
  } catch (error) {
    console.error("Error fetching MoM change:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
