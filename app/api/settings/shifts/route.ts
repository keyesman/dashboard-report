// =============================================================================
// app/api/settings/shifts/route.ts
// GET  /api/settings/shifts — Ambil semua shifts
// POST /api/settings/shifts — Tambah shift baru
// =============================================================================

import { auth }                    from "@/lib/auth";
import { getShifts, addShift }     from "@/lib/queries/settings";
import { NextRequest, NextResponse } from "next/server";

export async function GET() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const shifts = await getShifts();
    return NextResponse.json(shifts);
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const role = (session.user as { role?: string })?.role;
  if (!["admin", "leader"].includes(role ?? "")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const body    = await req.json();
    const success = await addShift(body);
    return success
      ? NextResponse.json({ success: true })
      : NextResponse.json({ error: "Failed" }, { status: 500 });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
