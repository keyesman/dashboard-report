// =============================================================================
// app/api/tickets/filter-options/route.ts
// API route untuk ambil distinct filter options
// GET /api/tickets/filter-options
// =============================================================================

import { auth }              from "@/lib/auth";
import { getFilterOptions }  from "@/lib/queries/tickets";
import { NextResponse }      from "next/server";

export async function GET() {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const options = await getFilterOptions();
    return NextResponse.json(options);
  } catch (error) {
    console.error("Error fetching filter options:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
