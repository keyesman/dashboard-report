// =============================================================================
// app/api/analytics/monthly-volume/route.ts
// GET /api/analytics/monthly-volume?year=2025&breakdown=service
//
// Support 2 mode:
// - Default           : total ticket per bulan
// - breakdown=service : total per bulan digroup by service (stacked bar)
// =============================================================================

import { auth }                                        from "@/lib/auth";
import { getMonthlyVolume, getMonthlyVolumeByService } from "@/lib/queries/analytics";
import { NextRequest, NextResponse }                   from "next/server";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = req.nextUrl;
  const year      = Number(searchParams.get("year") ?? new Date().getFullYear());
  const breakdown = searchParams.get("breakdown"); // "service" atau null

  try {
    // Kalau breakdown=service → return data per service
    if (breakdown === "service") {
      const data = await getMonthlyVolumeByService(year);
      return NextResponse.json(data);
    }

    // Default → return total per bulan
    const data = await getMonthlyVolume(year);
    return NextResponse.json(data);

  } catch (error) {
    console.error("Error fetching monthly volume:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
