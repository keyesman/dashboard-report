// =============================================================================
// app/api/tickets/escalation/route.ts
// API route untuk update escalation
// POST /api/tickets/escalation
// Hanya admin & leader
// =============================================================================

import { auth }               from "@/lib/auth";
import { updateEscalation }   from "@/lib/queries/tickets";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Role check
  const role = (session.user as { role?: string })?.role;
  if (!["admin", "leader"].includes(role ?? "")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const body = await req.json();
    const { ticketId, escalationNote, escalationCategory } = body;

    if (!ticketId) {
      return NextResponse.json({ error: "ticketId wajib diisi" }, { status: 400 });
    }

    const userId = Number((session.user as { id?: string })?.id);

    const success = await updateEscalation({
      ticketId,
      escalationNote    : escalationNote    ?? "",
      escalationCategory: escalationCategory ?? "",
      updatedBy         : userId,
    });

    if (success) {
      return NextResponse.json({ success: true });
    } else {
      return NextResponse.json({ error: "Gagal update escalation" }, { status: 500 });
    }
  } catch (error) {
    console.error("Error updating escalation:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
