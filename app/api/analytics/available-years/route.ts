// =============================================================================
// app/api/analytics/available-years/route.ts
// GET /api/analytics/available-years
// Ambil list tahun yang tersedia di database
// =============================================================================

import { auth }               from "@/lib/auth";
import { getAvailableYears }  from "@/lib/queries/analytics";
import { NextResponse }       from "next/server";

export async function GET() {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const years = await getAvailableYears();
    return NextResponse.json(years);
  } catch (error) {
    console.error("Error fetching available years:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
