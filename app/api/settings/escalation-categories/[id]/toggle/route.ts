// =============================================================================
// app/api/settings/escalation-categories/[id]/toggle/route.ts
// PATCH /api/settings/escalation-categories/:id/toggle
// =============================================================================

import { auth } from "@/lib/auth";
import {
  getEscalationCategories,
  toggleEscalationCategory
} from "@/lib/queries/settings";
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
    const { id }    = await params;
    const categories = await getEscalationCategories();
    const cat        = categories.find((c) => c.id === Number(id));
    if (!cat) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const success = await toggleEscalationCategory(Number(id), cat.isActive);
    return success
      ? NextResponse.json({ success: true })
      : NextResponse.json({ error: "Failed" }, { status: 500 });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
