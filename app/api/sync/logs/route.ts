// =============================================================================
// app/api/sync/logs/route.ts
// GET /api/sync/logs — Ambil riwayat sync dari tabel sync_log
// Hanya bisa diakses oleh admin & leader
// =============================================================================

import { auth }   from "@/lib/auth";
import prisma     from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  // Auth check
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Role check — hanya admin & leader
  const role = (session.user as { role?: string })?.role;
  if (!["admin", "leader"].includes(role ?? "")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    // Ambil 20 log terakhir, diurutkan dari terbaru
    const logs = await prisma.syncLog.findMany({
      orderBy: { startedAt: "desc" },
      take   : 20,
    });

    // Serialize dates ke string
    const serialized = logs.map((log) => ({
      ...log,
      startedAt : log.startedAt.toISOString(),
      finishedAt: log.finishedAt?.toISOString() ?? null,
    }));

    return NextResponse.json(serialized);

  } catch (error) {
    console.error("Error fetching sync logs:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
