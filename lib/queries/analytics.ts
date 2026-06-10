// =============================================================================
// lib/queries/analytics.ts
// Database query functions untuk halaman Analytics
//
// Functions:
// - getDailyVolume   : Ticket masuk per hari (untuk line chart)
// - getAvgMetrics    : AVG FRT & Resolution Time + summary counts
// - getDailyAvgFrt   : AVG FRT per hari (untuk trend chart)
// - getBreakdownBy   : Breakdown ticket by agent/service/type/priority
// =============================================================================

import prisma from "@/lib/prisma";

// ===========================================================================
// TYPES
// ===========================================================================

export interface DateRangeParams {
  dateFrom: string; // Format YYYY-MM-DD
  dateTo  : string; // Format YYYY-MM-DD
}

// Daily volume — untuk line chart ticket masuk vs solved
export interface DailyVolumeRow {
  date         : string; // Format YYYY-MM-DD
  ticketCreated: number;
  ticketSolved : number;
}

// Summary metrics — untuk metric cards
export interface AvgMetrics {
  totalTickets   : number;
  ticketsResolved: number;
  backlog        : number; // totalTickets - ticketsResolved
  avgFrtSeconds  : number;
  avgRtSeconds   : number;
  ticketsWithFrt : number;
}

// Daily AVG FRT — untuk trend line chart
export interface DailyAvgFrtRow {
  date          : string;
  avgFrtMinutes : number;
}

// Breakdown row — untuk bar chart
export interface BreakdownRow {
  label: string;
  total: number;
}

// ===========================================================================
// GET DAILY VOLUME — Ticket masuk & solved per hari
// ===========================================================================
export async function getDailyVolume(
  params: DateRangeParams
): Promise<DailyVolumeRow[]> {
  const { dateFrom, dateTo } = params;

  const dateFrom_ = new Date(dateFrom + "T00:00:00.000Z");
  const dateTo_   = new Date(dateTo   + "T23:59:59.999Z");

  // Ambil semua ticket dalam range
  const tickets = await prisma.conversation.findMany({
    where: {
      createdAt: { gte: dateFrom_, lte: dateTo_ },
    },
    select: {
      createdAt: true,
      status   : true,
    },
  });

  // Group by date di application level
  const volumeMap = new Map<string, { created: number; solved: number }>();

  tickets.forEach((ticket) => {
    // Format date ke YYYY-MM-DD
    const date = ticket.createdAt.toISOString().split("T")[0];

    if (!volumeMap.has(date)) {
      volumeMap.set(date, { created: 0, solved: 0 });
    }

    const entry = volumeMap.get(date)!;
    entry.created++;

    if (ticket.status === "resolved") {
      entry.solved++;
    }
  });

  // Convert map ke array & sort by date
  return Array.from(volumeMap.entries())
    .map(([date, { created, solved }]) => ({
      date,
      ticketCreated: created,
      ticketSolved : solved,
    }))
    .sort((a, b) => a.date.localeCompare(b.date));
}

// ===========================================================================
// GET AVG METRICS — Summary metrics untuk metric cards
// ===========================================================================
export async function getAvgMetrics(
  params: DateRangeParams
): Promise<AvgMetrics> {
  const { dateFrom, dateTo } = params;

  const tickets = await prisma.conversation.findMany({
    where: {
      createdAt: {
        gte: new Date(dateFrom + "T00:00:00.000Z"),
        lte: new Date(dateTo   + "T23:59:59.999Z"),
      },
    },
    select: {
      status               : true,
      frtSeconds           : true,
      resolutionTimeSeconds: true,
    },
  });

  // Hitung metrics di application level
  const totalTickets    = tickets.length;
  const ticketsResolved = tickets.filter((t) => t.status === "resolved").length;
  const backlog         = totalTickets - ticketsResolved;

  // Filter ticket yang punya FRT & resolution time
  const withFrt        = tickets.filter((t) => t.frtSeconds !== null);
  const withResolution = tickets.filter((t) => t.resolutionTimeSeconds !== null);

  // Hitung average
  const avgFrtSeconds = withFrt.length > 0
    ? withFrt.reduce((sum, t) => sum + t.frtSeconds!, 0) / withFrt.length
    : 0;

  const avgRtSeconds = withResolution.length > 0
    ? withResolution.reduce((sum, t) => sum + t.resolutionTimeSeconds!, 0) / withResolution.length
    : 0;

  return {
    totalTickets,
    ticketsResolved,
    backlog,
    avgFrtSeconds : Math.round(avgFrtSeconds),
    avgRtSeconds  : Math.round(avgRtSeconds),
    ticketsWithFrt: withFrt.length,
  };
}

// ===========================================================================
// GET DAILY AVG FRT — AVG FRT per hari untuk trend chart
// ===========================================================================
export async function getDailyAvgFrt(
  params: DateRangeParams
): Promise<DailyAvgFrtRow[]> {
  const { dateFrom, dateTo } = params;

  // Ambil semua ticket yang punya FRT dalam range
  const tickets = await prisma.conversation.findMany({
    where: {
      createdAt : { gte: new Date(dateFrom + "T00:00:00.000Z"), lte: new Date(dateTo + "T23:59:59.999Z") },
      frtSeconds: { not: null },
    },
    select: {
      createdAt : true,
      frtSeconds: true,
    },
  });

  // Group by date & hitung avg FRT per hari
  const frtMap = new Map<string, number[]>();

  tickets.forEach((ticket) => {
    const date = ticket.createdAt.toISOString().split("T")[0];
    if (!frtMap.has(date)) frtMap.set(date, []);
    frtMap.get(date)!.push(ticket.frtSeconds!);
  });

  return Array.from(frtMap.entries())
    .map(([date, frts]) => ({
      date,
      // Convert detik ke menit, round 2 desimal
      avgFrtMinutes: Math.round((frts.reduce((a, b) => a + b, 0) / frts.length / 60) * 100) / 100,
    }))
    .sort((a, b) => a.date.localeCompare(b.date));
}

// ===========================================================================
// GET BREAKDOWN BY — Ticket count grouped by kolom tertentu
// ===========================================================================
export type BreakdownField = "agent" | "service" | "type" | "priority" | "escalate";

export async function getBreakdownBy(
  params: DateRangeParams,
  field : BreakdownField
): Promise<BreakdownRow[]> {
  const { dateFrom, dateTo } = params;

  // Ambil semua ticket dalam range yang punya nilai di field tersebut
  const tickets = await prisma.conversation.findMany({
    where: {
      createdAt: {
        gte: new Date(dateFrom + "T00:00:00.000Z"),
        lte: new Date(dateTo   + "T23:59:59.999Z"),
      },
      // Pastikan field yang di-group tidak null
      [field]: { not: null },
    },
    select: {
      [field]: true,
    },
  });

  // Group & count di application level
  const countMap = new Map<string, number>();

  tickets.forEach((ticket) => {
    const value = (ticket as Record<string, unknown>)[field] as string;
    if (value) {
      countMap.set(value, (countMap.get(value) ?? 0) + 1);
    }
  });

  // Sort by total descending
  return Array.from(countMap.entries())
    .map(([label, total]) => ({ label, total }))
    .sort((a, b) => b.total - a.total);
}

// ===========================================================================
// GET AVAILABLE YEARS — Ambil list tahun yang ada di DB
// Dipakai untuk filter dropdown tahun di Overview page
// ===========================================================================
export async function getAvailableYears(): Promise<number[]> {
  // Ambil semua distinct tahun dari createdAt conversations
  const tickets = await prisma.conversation.findMany({
    select  : { createdAt: true },
  });

  // Extract tahun dari setiap createdAt, lalu deduplicate
  const years = [
    ...new Set(tickets.map((t) => t.createdAt.getFullYear()))
  ];

  // Sort descending (terbaru dulu)
  return years.sort((a, b) => b - a);
}

// ===========================================================================
// GET MONTHLY VOLUME — Ticket per bulan dalam 1 tahun
// Dipakai untuk bar chart di Overview page
// ===========================================================================
export interface MonthlyVolumeRow {
  month     : number; // 1-12
  monthLabel: string; // "Jan", "Feb", dst
  total     : number; // Jumlah ticket di bulan itu
}

export async function getMonthlyVolume(year: number): Promise<MonthlyVolumeRow[]> {
  // Ambil semua ticket dalam tahun yang dipilih
  const tickets = await prisma.conversation.findMany({
    where: {
      createdAt: {
        gte: new Date(`${year}-01-01T00:00:00.000Z`),
        lte: new Date(`${year}-12-31T23:59:59.999Z`),
      },
    },
    select: { createdAt: true },
  });

  // Label bulan dalam Bahasa Indonesia
  const monthLabels = [
    "Jan", "Feb", "Mar", "Apr", "Mei", "Jun",
    "Jul", "Ags", "Sep", "Okt", "Nov", "Des",
  ];

  // Inisialisasi semua 12 bulan dengan total 0
  const monthMap = new Map<number, number>();
  for (let i = 1; i <= 12; i++) {
    monthMap.set(i, 0);
  }

  // Hitung ticket per bulan
  tickets.forEach((ticket) => {
    // getMonth() return 0-11, tambah 1 supaya jadi 1-12
    const month = ticket.createdAt.getMonth() + 1;
    monthMap.set(month, (monthMap.get(month) ?? 0) + 1);
  });

  // Convert ke array dengan label bulan
  return Array.from(monthMap.entries()).map(([month, total]) => ({
    month,
    monthLabel: monthLabels[month - 1],
    total,
  }));
}

// ===========================================================================
// GET MONTH OVER MONTH CHANGE — Hitung % perubahan bulan ini vs bulan lalu
// Handle cross-year comparison (Jan 2026 vs Des 2025)
// ===========================================================================
export interface MonthOverMonthResult {
  currentMonth : number; // Bulan ini (1-12)
  currentYear  : number; // Tahun ini
  currentTotal : number; // Total ticket bulan ini
  prevMonth    : number; // Bulan lalu (1-12)
  prevYear     : number; // Tahun lalu (bisa beda tahun)
  prevTotal    : number; // Total ticket bulan lalu
  changePercent: number; // % perubahan (positif = naik, negatif = turun)
  direction    : "up" | "down" | "neutral"; // Arah perubahan
}

export async function getMonthOverMonthChange(
  year : number,
  month: number
): Promise<MonthOverMonthResult> {
  // Hitung bulan & tahun sebelumnya
  // Kalau bulan 1 (Januari), bulan sebelumnya Desember tahun lalu
  const prevMonth = month === 1 ? 12 : month - 1;
  const prevYear  = month === 1 ? year - 1 : year;

  // Fetch ticket bulan ini & bulan lalu secara parallel
  const [currentTickets, prevTickets] = await Promise.all([
    prisma.conversation.count({
      where: {
        createdAt: {
          gte: new Date(`${year}-${String(month).padStart(2, "0")}-01T00:00:00.000Z`),
          lte: new Date(`${year}-${String(month).padStart(2, "0")}-31T23:59:59.999Z`),
        },
      },
    }),
    prisma.conversation.count({
      where: {
        createdAt: {
          gte: new Date(`${prevYear}-${String(prevMonth).padStart(2, "0")}-01T00:00:00.000Z`),
          lte: new Date(`${prevYear}-${String(prevMonth).padStart(2, "0")}-31T23:59:59.999Z`),
        },
      },
    }),
  ]);

  // Hitung % perubahan
  // Kalau bulan lalu 0 dan bulan ini ada data → 100% kenaikan
  let changePercent = 0;
  if (prevTickets > 0) {
    changePercent = Math.round(
      ((currentTickets - prevTickets) / prevTickets) * 100
    );
  } else if (currentTickets > 0) {
    changePercent = 100;
  }

  // Tentukan arah perubahan
  const direction =
    changePercent > 0 ? "up" :
    changePercent < 0 ? "down" : "neutral";

  return {
    currentMonth : month,
    currentYear  : year,
    currentTotal : currentTickets,
    prevMonth,
    prevYear,
    prevTotal    : prevTickets,
    changePercent,
    direction,
  };
}
