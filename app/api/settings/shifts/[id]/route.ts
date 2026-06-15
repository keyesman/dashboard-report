// =============================================================================
// app/api/settings/shifts/[id]/route.ts
// DELETE /api/settings/shifts/:id — Hapus shift
// =============================================================================

import { auth }        from "@/lib/auth";
import { deleteShift } from "@/lib/queries/settings";
import { NextRequest, NextResponse } from "next/server";

export async function DELETE(
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
    const { id }  = await params;
    const success = await deleteShift(Number(id));
    return success
      ? NextResponse.json({ success: true })
      : NextResponse.json({ error: "Failed" }, { status: 500 });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
