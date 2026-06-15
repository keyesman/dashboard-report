// =============================================================================
// app/api/settings/users/[id]/toggle/route.ts
// PATCH /api/settings/users/:id/toggle — Toggle aktif/nonaktif user
// =============================================================================

import { auth }                   from "@/lib/auth";
import { getUsers, toggleUser }   from "@/lib/queries/settings";
import { NextRequest, NextResponse } from "next/server";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const role = (session.user as { role?: string })?.role;
  if (role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const { id } = await params;
    const users   = await getUsers();
    const user    = users.find((u: { id: Number; isActive: boolean }) => u.id === Number(id));
    if (!user) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const success = await toggleUser(Number(id), user.isActive);
    return success
      ? NextResponse.json({ success: true })
      : NextResponse.json({ error: "Failed" }, { status: 500 });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
