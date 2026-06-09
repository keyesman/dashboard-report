// =============================================================================
// app/api/tickets/route.ts
// API route untuk fetch tickets dengan filter
// GET /api/tickets?dateFrom=...&dateTo=...&agent=...&status=...
// =============================================================================

import { auth }        from "@/lib/auth";
import { getTickets }  from "@/lib/queries/tickets";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  // Auth check
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = req.nextUrl;

  const filters = {
    dateFrom: searchParams.get("dateFrom") ?? new Date().toISOString().split("T")[0],
    dateTo  : searchParams.get("dateTo")   ?? new Date().toISOString().split("T")[0],
    agent   : searchParams.get("agent")    ?? undefined,
    service : searchParams.get("service")  ?? undefined,
    priority: searchParams.get("priority") ?? undefined,
    escalate: searchParams.get("escalate") ?? undefined,
    status  : searchParams.get("status")   ?? undefined,
  };

  try {
    const tickets = await getTickets(filters);
    // Serialize dates ke string
    const serialized = tickets.map((t) => ({
      ...t,
      createdAt: t.createdAt.toISOString(),
    }));
    return NextResponse.json(serialized);
  } catch (error) {
    console.error("Error fetching tickets:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
