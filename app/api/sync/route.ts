// =============================================================================
// app/api/sync/route.ts
// API route untuk trigger sync manual dari dashboard
//
// POST /api/sync
// Body: { dateFrom: "YYYY-MM-DD", dateTo: "YYYY-MM-DD" }
//
// Hanya bisa diakses oleh user yang sudah login (admin/leader)
// =============================================================================

import { auth }     from "@/lib/auth";
import { runSync }  from "@/services/sync-service";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  // Cek auth — hanya user yang sudah login
  const session = await auth();

  if (!session) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401 }
    );
  }

  // Hanya admin & leader yang bisa trigger sync
  const role = (session.user as { role?: string })?.role;
  if (!["admin", "leader"].includes(role ?? "")) {
    return NextResponse.json(
      { error: "Forbidden — hanya admin & leader yang bisa sync" },
      { status: 403 }
    );
  }

  try {
    const body     = await req.json();
    const dateFrom = body?.dateFrom as string;
    const dateTo   = body?.dateTo   as string;

    // Validasi input
    if (!dateFrom || !dateTo) {
      return NextResponse.json(
        { error: "dateFrom dan dateTo wajib diisi" },
        { status: 400 }
      );
    }

    // Jalankan sync
    const result = await runSync({
      dateFrom,
      dateTo,
      syncType: "manual",
    });

    return NextResponse.json(result);

  } catch (error) {
    console.error("Sync error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
