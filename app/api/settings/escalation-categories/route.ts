// =============================================================================
// app/api/settings/escalation-categories/route.ts
// GET  /api/settings/escalation-categories — Ambil semua categories
// POST /api/settings/escalation-categories — Tambah category baru
// =============================================================================

import { auth } from "@/lib/auth";
import {
  getEscalationCategories,
  addEscalationCategory
} from "@/lib/queries/settings";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const activeOnly = req.nextUrl.searchParams.get("activeOnly") === "true";

  try {
    const categories = await getEscalationCategories(activeOnly);
    return NextResponse.json(categories);
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const role = (session.user as { role?: string })?.role;
  if (role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const { name } = await req.json();
    const success  = await addEscalationCategory(name);
    return success
      ? NextResponse.json({ success: true })
      : NextResponse.json({ error: "Failed — maybe duplicate" }, { status: 409 });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
