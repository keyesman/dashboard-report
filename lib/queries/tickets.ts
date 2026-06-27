// =============================================================================
// lib/queries/tickets.ts
// Database query functions untuk halaman Tickets
//
// Functions:
// - getTickets        : Ambil list ticket dengan filter & pagination
// - getFilterOptions  : Ambil distinct values untuk dropdown filter
// - updateEscalation  : Update escalation note & category
// =============================================================================

import prisma from "@/lib/prisma";

// ===========================================================================
// TYPES
// ===========================================================================

// Filter params untuk query tickets
export interface TicketFilters {
  dateFrom  : string;       // Format YYYY-MM-DD
  dateTo    : string;       // Format YYYY-MM-DD
  agent    ?: string;       // Filter by agent name
  service  ?: string;       // Filter by service
  priority ?: string;       // Filter by priority (P1-P4)
  escalate ?: string;       // Filter by escalate (L1/L2)
  status   ?: string;       // Filter by status
}

// Structure ticket yang dikembalikan ke UI
export interface TicketRow {
  id                   : number;
  ticketId             : number;
  createdAt            : Date;
  status               : string;
  agent                : string | null;
  service              : string | null;
  priority             : string | null;
  escalate             : string | null;
  type                 : string | null;
  frtSeconds           : number | null;
  resolutionTimeSeconds: number | null;
  resolveCount         : number;
  isReopened           : boolean;
  lastNote             : string | null;
  company              : string | null;
  customer             : string | null;
  phone                : string | null;
  escalationNote       : string | null;
  escalationCategory   : string | null;
  rawLabels            : string | null;
  csatRating           : number | null; 
  csatFeedback         : string | null; 
  subject              : string | null;  
  rootCause            : string | null;  
  resolution           : string | null;  
}

// ===========================================================================
// GET TICKETS — Ambil list ticket dengan filter
// ===========================================================================
export async function getTickets(filters: TicketFilters): Promise<TicketRow[]> {
  const {
    dateFrom,
    dateTo,
    agent,
    service,
    priority,
    escalate,
    status,
  } = filters;

  const tickets = await prisma.conversation.findMany({
    where: {
      // Filter wajib: date range berdasarkan createdAt
      createdAt: {
        gte: new Date(dateFrom + "T00:00:00.000Z"),
        lte: new Date(dateTo   + "T23:59:59.999Z"),
      },
      // Filter opsional — hanya di-apply kalau ada valuenya
      ...(agent    && { agent    }),
      ...(service  && { service  }),
      ...(priority && { priority }),
      ...(escalate && { escalate }),
      ...(status   && { status   }),
    },
    orderBy: {
      // Urutkan dari yang terbaru
      createdAt: "desc",
    },
  });

  return tickets;
}

// ===========================================================================
// GET FILTER OPTIONS — Ambil distinct values untuk dropdown filter
// Diambil dari data yang ada di DB (bukan hardcode)
// ===========================================================================
export interface FilterOptions {
  agents    : string[];
  services  : string[];
  priorities: string[];
  escalates : string[];
  statuses  : string[];
}

export async function getFilterOptions(): Promise<FilterOptions> {
  // Jalankan semua query secara parallel untuk efisiensi
  const [agents, services, priorities, escalates, statuses] = await Promise.all([
    // Distinct agents
    prisma.conversation.findMany({
      where   : { agent: { not: null } },
      select  : { agent: true },
      distinct: ["agent"],
      orderBy : { agent: "asc" },
    }),

    // Distinct services
    prisma.conversation.findMany({
      where   : { service: { not: null } },
      select  : { service: true },
      distinct: ["service"],
      orderBy : { service: "asc" },
    }),

    // Distinct priorities
    prisma.conversation.findMany({
      where   : { priority: { not: null } },
      select  : { priority: true },
      distinct: ["priority"],
      orderBy : { priority: "asc" },
    }),

    // Distinct escalates
    prisma.conversation.findMany({
      where   : { escalate: { not: null } },
      select  : { escalate: true },
      distinct: ["escalate"],
      orderBy : { escalate: "asc" },
    }),

    // Distinct statuses
    prisma.conversation.findMany({
      select  : { status: true },
      distinct: ["status"],
      orderBy : { status: "asc" },
    }),
  ]);

  return {
    agents    : agents.map((a) => a.agent!),
    services  : services.map((s) => s.service!),
    priorities: priorities.map((p) => p.priority!),
    escalates : escalates.map((e) => e.escalate!),
    statuses  : statuses.map((s) => s.status),
  };
}

// ===========================================================================
// UPDATE ESCALATION — Simpan escalation note & category
// Hanya bisa dilakukan oleh admin & leader
// ===========================================================================
export interface UpdateEscalationParams {
  ticketId          : number;
  escalationNote    : string;
  escalationCategory: string;
  updatedBy         : number; // user_id yang melakukan update
}

export async function updateEscalation(
  params: UpdateEscalationParams
): Promise<boolean> {
  try {
    await prisma.conversation.update({
      where: { ticketId: params.ticketId },
      data : {
        escalationNote      : params.escalationNote,
        escalationCategory  : params.escalationCategory,
        escalationUpdatedBy : params.updatedBy,
        escalationUpdatedAt : new Date(),
      },
    });
    return true;
  } catch (error) {
    console.error("Error updating escalation:", error);
    return false;
  }
}
