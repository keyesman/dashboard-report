// =============================================================================
// app/api/settings/shifts/[id]/toggle/route.ts
// PATCH /api/settings/shifts/:id/toggle — Toggle aktif/nonaktif shift
// =============================================================================

import { auth }                      from "@/lib/auth";
import { getShifts, toggleShift }    from "@/lib/queries/settings";
import { NextRequest, NextResponse } from "next/server";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const role = (session.user as { role?: string })?.role;
  if (!["admin", "leader"].includes(role ?? "")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const { id } = await params;
    const shifts  = await getShifts();
    //const shift   = shifts.find((s) => s.id === Number(id));
    const shift   = shifts.find((s: { id: number; isActive: boolean }) => s.id === Number(id));
    if (!shift) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const success = await toggleShift(Number(id), shift.isActive);
    return success
      ? NextResponse.json({ success: true })
      : NextResponse.json({ error: "Failed" }, { status: 500 });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
