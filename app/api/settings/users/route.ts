// =============================================================================
// app/api/settings/users/route.ts
// GET  /api/settings/users — Ambil semua users
// POST /api/settings/users — Tambah user baru
// =============================================================================

import { auth }               from "@/lib/auth";
import { getUsers, addUser }  from "@/lib/queries/settings";
import { NextRequest, NextResponse } from "next/server";

export async function GET() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const role = (session.user as { role?: string })?.role;
  if (role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const users = await getUsers();
    const serialized = users.map((u) => ({
      ...u,
      lastLoginAt: u.lastLoginAt?.toISOString() ?? null,
      createdAt  : u.createdAt.toISOString(),
    }));
    return NextResponse.json(serialized);
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
    const body    = await req.json();
    const success = await addUser(body);
    return success
      ? NextResponse.json({ success: true })
      : NextResponse.json({ error: "Failed — email might exist" }, { status: 409 });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
