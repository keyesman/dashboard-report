// =============================================================================
// app/dashboard/page.tsx
// Dashboard Overview — halaman pertama setelah login
//
// Features:
// - Welcome message
// - Quick info cards (Tickets, Analytics, Settings)
// - Bar chart: jumlah ticket per bulan dengan filter tahun
// =============================================================================

"use client";

import { useSession }   from "next-auth/react";
import { useEffect, useState, useCallback } from "react";
import DashboardLayout  from "@/components/layout/dashboard-layout";
import { Card }         from "@/components/ui/card";
import { cn }           from "@/lib/utils";
import { showToast }    from "@/components/ui/toast";
import {
  BarChart, Bar, XAxis, YAxis,
  CartesianGrid, Tooltip,
  ResponsiveContainer, Cell
} from "recharts";
import { Ticket, BarChart2, Settings, TrendingUp } from "lucide-react";

// ===========================================================================
// TYPES
// ===========================================================================
interface MonthlyVolumeRow {
  month     : number;
  monthLabel: string;
  total     : number;
}

// ===========================================================================
// OVERVIEW PAGE COMPONENT
// ===========================================================================
export default function DashboardPage() {
  const { data: session } = useSession();

  // ===========================================================================
  // STATE
  // ===========================================================================
  const [availableYears,  setAvailableYears]  = useState<number[]>([]);
  const [selectedYear,    setSelectedYear]    = useState<number>(
    new Date().getFullYear() // Default: tahun ini
  );
  const [monthlyVolume,   setMonthlyVolume]   = useState<MonthlyVolumeRow[]>([]);
  const [isLoadingChart,  setIsLoadingChart]  = useState(false);

  // ===========================================================================
  // FETCH AVAILABLE YEARS — Dipanggil sekali saat mount
  // ===========================================================================
  const fetchAvailableYears = useCallback(async () => {
    try {
      const res  = await fetch("/api/analytics/available-years");
      const data = await res.json();
      setAvailableYears(data);

      // Set selected year ke tahun terbaru yang ada di DB
      if (data.length > 0) {
        setSelectedYear(data[0]);
      }
    } catch {
      showToast.error("Gagal memuat data tahun.");
    }
  }, []);

  // ===========================================================================
  // FETCH MONTHLY VOLUME — Dipanggil saat selectedYear berubah
  // ===========================================================================
  const fetchMonthlyVolume = useCallback(async (year: number) => {
    setIsLoadingChart(true);
    try {
      const res  = await fetch(`/api/analytics/monthly-volume?year=${year}`);
      const data = await res.json();
      setMonthlyVolume(data);
    } catch {
      showToast.error("Gagal memuat data chart.");
    } finally {
      setIsLoadingChart(false);
    }
  }, []);

  // Fetch years saat pertama mount
  useEffect(() => {
    fetchAvailableYears();
  }, [fetchAvailableYears]);

  // Fetch chart saat selectedYear berubah
  useEffect(() => {
    fetchMonthlyVolume(selectedYear);
  }, [selectedYear, fetchMonthlyVolume]);

  // ===========================================================================
  // RENDER
  // ===========================================================================
  return (
    <DashboardLayout
      title="Overview"
      description="Selamat datang di Chatwoot Dashboard"
    >
      {/* =================================================================
          WELCOME MESSAGE
          ================================================================= */}
      <div className="mb-6">
        <h2 className="font-headline text-2xl font-bold text-[var(--text-primary)]">
          Halo, {session?.user?.name}! 👋
        </h2>
        <p className="font-body text-sm text-[var(--text-secondary)] mt-1">
          Berikut ringkasan dashboard kamu.
        </p>
      </div>

      {/* =================================================================
          QUICK INFO CARDS
          ================================================================= */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        {/* Tickets Card */}
        <Card className="flex items-start gap-4">
          <div className="w-10 h-10 bg-primary-light rounded-md flex items-center justify-center shrink-0">
            <Ticket size={20} className="text-primary" />
          </div>
          <div>
            <p className="font-headline font-semibold text-[var(--text-primary)]">
              Tickets
            </p>
            <p className="font-body text-sm text-[var(--text-secondary)] mt-0.5">
              Lihat dan filter semua ticket dari Chatwoot
            </p>
          </div>
        </Card>

        {/* Analytics Card */}
        <Card className="flex items-start gap-4">
          <div className="w-10 h-10 bg-info/10 rounded-md flex items-center justify-center shrink-0">
            <BarChart2 size={20} className="text-info" />
          </div>
          <div>
            <p className="font-headline font-semibold text-[var(--text-primary)]">
              Analytics
            </p>
            <p className="font-body text-sm text-[var(--text-secondary)] mt-0.5">
              Chart dan metrik performa tim support
            </p>
          </div>
        </Card>

        {/* Settings Card */}
        <Card className="flex items-start gap-4">
          <div className="w-10 h-10 bg-warning/10 rounded-md flex items-center justify-center shrink-0">
            <Settings size={20} className="text-warning" />
          </div>
          <div>
            <p className="font-headline font-semibold text-[var(--text-primary)]">
              Settings
            </p>
            <p className="font-body text-sm text-[var(--text-secondary)] mt-0.5">
              Kelola shift, kategori, dan user
            </p>
          </div>
        </Card>
      </div>

      {/* =================================================================
          CHART — Ticket per Bulan
          ================================================================= */}
      <Card>
        {/* Chart Header — Title + Year Filter */}
        <div className="flex items-center justify-between flex-wrap gap-3 mb-6">
          <div className="flex items-center gap-2">
            <TrendingUp size={16} className="text-primary" />
            <h3 className="font-headline font-semibold text-[var(--text-primary)]">
              Jumlah Ticket per Bulan
            </h3>
          </div>

          {/* Year Filter — Pill buttons */}
          <div className="flex flex-wrap gap-2">
            {availableYears.length === 0 ? (
              // Skeleton loading saat tahun belum loaded
              <div className="flex gap-2">
                {[1, 2].map((i) => (
                  <div
                    key={i}
                    className="w-16 h-7 bg-[var(--surface-muted)] rounded-sm animate-pulse"
                  />
                ))}
              </div>
            ) : (
              availableYears.map((year) => (
                <button
                  key={year}
                  onClick={() => setSelectedYear(year)}
                  className={cn(
                    // Base pill styles
                    "px-3 py-1.5 rounded-sm text-xs font-semibold font-body",
                    "border transition-all duration-150 cursor-pointer",
                    // Active state — mint green
                    selectedYear === year
                      ? "bg-primary-light text-primary border-primary/20"
                      : // Inactive state
                        "bg-[var(--surface-muted)] text-[var(--text-secondary)] border-[var(--border-default)] hover:text-primary hover:bg-primary-light hover:border-primary/20"
                  )}
                >
                  {year}
                </button>
              ))
            )}
          </div>
        </div>

        {/* Chart Content */}
        {isLoadingChart ? (
          // Loading skeleton
          <div className="h-64 bg-[var(--surface-muted)] rounded-md animate-pulse" />
        ) : monthlyVolume.every((m) => m.total === 0) ? (
          // Empty state
          <div className="flex flex-col items-center justify-center h-64 text-[var(--text-secondary)]">
            <BarChart2 size={40} className="opacity-20 mb-3" />
            <p className="font-body text-sm">
              Tidak ada data ticket untuk tahun {selectedYear}
            </p>
          </div>
        ) : (
          // Bar Chart
          <ResponsiveContainer width="100%" height={280}>
            <BarChart
              data={monthlyVolume}
              margin={{ top: 5, right: 20, left: 0, bottom: 5 }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="var(--border-default)"
                vertical={false}
              />
              <XAxis
                dataKey="monthLabel"
                tick={{ fontSize: 12, fill: "var(--text-secondary)" }}
              />
              <YAxis
                tick={{ fontSize: 11, fill: "var(--text-secondary)" }}
                allowDecimals={false}
              />
              <Tooltip
                contentStyle={{
                  background  : "var(--bg-card)",
                  border      : "1px solid var(--border-default)",
                  borderRadius: "8px",
                  fontSize    : "12px",
                  color       : "var(--text-primary)",
                }}
                labelStyle={{
                  color     : "var(--text-primary)",       // Hijau mint untuk label
                  fontWeight: "600",
                }}
                itemStyle={{
                  color: "#10B981", // Text item ikut theme
                }}
                cursor={{ fill: "var(--surface-muted)" }}
                formatter={(value) => [value, "Total Tickets"]}
                labelFormatter={(label) => `${label} ${selectedYear}`}
              />
              <Bar
                dataKey="total"
                radius={[4, 4, 0, 0]}
                maxBarSize={50}
              >
                {/* Highlight bar dengan total tertinggi */}
                {monthlyVolume.map((entry, index) => {
                  const maxTotal = Math.max(...monthlyVolume.map((m) => m.total));
                  return (
                    <Cell
                      key={`cell-${index}`}
                      // Bar tertinggi: warna lebih gelap, lainnya mint biasa
                      fill={entry.total === maxTotal && maxTotal > 0
                        ? "#059669"  // Mint darker — highlight bar tertinggi
                        : "#10B981"  // Mint default
                      }
                    />
                  );
                })}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}

        {/* Summary text di bawah chart */}
        {!isLoadingChart && monthlyVolume.some((m) => m.total > 0) && (
          <div className="mt-4 pt-4 border-t border-[var(--border-default)] flex items-center gap-6">
            {/* Total tahun ini */}
            <div>
              <p className="font-body text-xs text-[var(--text-secondary)]">
                Total {selectedYear}
              </p>
              <p className="font-headline font-bold text-lg text-[var(--text-primary)]">
                {monthlyVolume.reduce((sum, m) => sum + m.total, 0).toLocaleString("id-ID")}
                <span className="font-body text-xs font-normal text-[var(--text-secondary)] ml-1">
                  tickets
                </span>
              </p>
            </div>

            {/* Bulan tertinggi */}
            <div>
              <p className="font-body text-xs text-[var(--text-secondary)]">
                Bulan Tertinggi
              </p>
              <p className="font-headline font-bold text-lg text-primary">
                {monthlyVolume.reduce((max, m) => m.total > max.total ? m : max, monthlyVolume[0])?.monthLabel}
                <span className="font-body text-xs font-normal text-[var(--text-secondary)] ml-1">
                  ({monthlyVolume.reduce((max, m) => m.total > max.total ? m : max, monthlyVolume[0])?.total.toLocaleString("id-ID")} tickets)
                </span>
              </p>
            </div>

            {/* Rata-rata per bulan */}
            <div>
              <p className="font-body text-xs text-[var(--text-secondary)]">
                Rata-rata / Bulan
              </p>
              <p className="font-headline font-bold text-lg text-[var(--text-primary)]">
                {Math.round(
                  monthlyVolume.reduce((sum, m) => sum + m.total, 0) /
                  monthlyVolume.filter((m) => m.total > 0).length || 0
                ).toLocaleString("id-ID")}
                <span className="font-body text-xs font-normal text-[var(--text-secondary)] ml-1">
                  tickets
                </span>
              </p>
            </div>
          </div>
        )}
      </Card>
    </DashboardLayout>
  );
}
