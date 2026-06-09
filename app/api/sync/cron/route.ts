// =============================================================================
// app/api/sync/cron/route.ts
// API route untuk auto sync via cron job
//
// GET /api/sync/cron
// Dipanggil oleh scheduler (Vercel Cron / external cron)
//
// Default: sync H-1 (kemarin)
// Protected by CRON_SECRET supaya gak bisa dipanggil sembarangan
// =============================================================================

import { runSync } from "@/services/sync-service";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  // Validasi cron secret — mencegah akses tidak sah
  const cronSecret = req.headers.get("x-cron-secret");

  if (cronSecret !== process.env.CRON_SECRET) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401 }
    );
  }

  // Default sync: H-1 (kemarin)
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const dateStr = yesterday.toISOString().split("T")[0];

  const result = await runSync({
    dateFrom: dateStr,
    dateTo  : dateStr,
    syncType: "cron",
  });

  return NextResponse.json(result);
}
