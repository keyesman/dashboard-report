// =============================================================================
// services/sync-service.ts
// Sync service — orchestrate fetch dari Chatwoot + save ke DB
//
// Flow:
// 1. Fetch semua conversations dari Chatwoot API (by date range)
// 2. Untuk setiap conversation, fetch messages-nya
// 3. Parse data (labels, FRT, resolution time, dll)
// 4. Upsert ke DB (update kalau sudah ada, insert kalau belum)
// 5. Log hasil sync ke tabel sync_log
// =============================================================================

import prisma                                from "@/lib/prisma";
import { getAllConversations, getMessages }  from "./chatwoot";
import { buildConversation }                 from "./chatwoot-parser";


// ===========================================================================
// TYPES
// ===========================================================================
export interface SyncParams {
  dateFrom: string; // Format YYYY-MM-DD
  dateTo  : string; // Format YYYY-MM-DD
  syncType: "manual" | "cron";
}

export interface SyncResult {
  success     : boolean;
  totalSynced : number;
  errorMsg   ?: string;
}

// ===========================================================================
// RUN SYNC — Main function untuk sync data dari Chatwoot ke DB
// ===========================================================================
export async function runSync(params: SyncParams): Promise<SyncResult> {
  const { dateFrom, dateTo, syncType } = params;

  // Buat sync log entry dengan status "running"
  const syncLog = await prisma.syncLog.create({
    data: {
      syncType,
      dateFrom,
      dateTo,
      status   : "running",
      startedAt: new Date(),
    },
  });

  let totalSynced = 0;

  try {
    console.log(`[Sync] Start sync ${dateFrom} → ${dateTo}`);

    // Step 1: Fetch semua conversations dari Chatwoot
    const conversations = await getAllConversations(dateFrom, dateTo);
    console.log(`[Sync] Total conversations fetched: ${conversations.length}`);

    // Step 2: Process setiap conversation
    for (const conv of conversations) {
      try {
        // Fetch messages untuk conversation ini
        const messages = await getMessages(conv.id);
        const data = buildConversation(conv, messages);

        // Upsert ke DB — update kalau sudah ada, insert kalau belum
        await prisma.conversation.upsert({
          where : { ticketId: data.ticketId },
          update: {
            // Update semua field kecuali escalation (jangan overwrite manual input)
            status                : data.status,
            agent                 : data.agent,
            service               : data.service,
            priority              : data.priority,
            escalate              : data.escalate,
            type                  : data.type,
            rawLabels             : data.rawLabels,
            frtSeconds            : data.frtSeconds,
            resolutionTimeSeconds : data.resolutionTimeSeconds,
            resolveCount          : data.resolveCount,
            isReopened            : data.isReopened,
            lastNote              : data.lastNote,
            company               : data.company,
            customer              : data.customer,
            phone                 : data.phone,
            csatRating            : data.csatRating,
            csatFeedback          : data.csatFeedback,
          },
          create: data,
        });

        totalSynced++;
      } catch (convError) {
        // Log error per conversation tapi lanjutkan sync
        console.error(`[Sync] Error processing ticket #${conv.id}:`, convError);
      }
    }

    // Update sync log: success
    await prisma.syncLog.update({
      where: { id: syncLog.id },
      data : {
        status     : "success",
        totalSynced,
        finishedAt : new Date(),
      },
    });

    console.log(`[Sync] Done! Total synced: ${totalSynced}`);
    return { success: true, totalSynced };

  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : "Unknown error";

    // Update sync log: failed
    await prisma.syncLog.update({
      where: { id: syncLog.id },
      data : {
        status    : "failed",
        errorMsg,
        finishedAt: new Date(),
      },
    });

    console.error("[Sync] Sync failed:", errorMsg);
    return { success: false, totalSynced, errorMsg };
  }
}
