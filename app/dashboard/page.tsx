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
import { Ticket, BarChart2, Settings, TrendingUp, TrendingDown, Minus } from "lucide-react";


// ===========================================================================
// TYPES
// ===========================================================================
interface MonthlyVolumeRow {
  month     : number;
  monthLabel: string;
  total     : number;
}
interface MonthOverMonthResult {
  currentMonth : number;
  currentYear  : number;
  currentTotal : number;
  prevMonth    : number;
  prevYear     : number;
  prevTotal    : number;
  changePercent: number;
  direction    : "up" | "down" | "neutral";
}

// ===========================================================================
// CUSTOM TOOLTIP — Tampilkan total + % perubahan vs bulan sebelumnya
// Fetch prev month data dari API supaya support cross-year comparison
// ===========================================================================
const CustomBarTooltip = ({
  active,
  payload,
  label,
  selectedYear,
  monthlyVolume,
  prevYearVolume, // Data tahun sebelumnya untuk cross-year comparison
}: {
  active?         : boolean;
  payload?        : { value: number }[];
  label?          : string;
  selectedYear    : number;
  monthlyVolume   : { month: number; monthLabel: string; total: number }[];
  prevYearVolume  : { month: number; monthLabel: string; total: number }[];
}) => {
  if (!active || !payload || !payload.length) return null;

  // Cari data bulan ini
  const currentData = monthlyVolume.find((m) => m.monthLabel === label);
  if (!currentData) return null;

  // Tentukan bulan & tahun sebelumnya
  const prevMonth = currentData.month === 1 ? 12 : currentData.month - 1;
  const prevYear  = currentData.month === 1 ? selectedYear - 1 : selectedYear;

  // Ambil data bulan sebelumnya
  // Kalau cross-year (bulan 1), ambil dari prevYearVolume
  // Kalau same year, ambil dari monthlyVolume
  const prevData = currentData.month === 1
    ? prevYearVolume.find((m) => m.month === prevMonth)
    : monthlyVolume.find((m) => m.month === prevMonth);

  const currentTotal = currentData.total;
  const prevTotal    = prevData?.total ?? 0;

  // Hitung % perubahan
  let changePercent = 0;
  if (prevTotal > 0) {
    changePercent = Math.round(((currentTotal - prevTotal) / prevTotal) * 100);
  } else if (currentTotal > 0) {
    changePercent = 100;
  }

  const direction =
    changePercent > 0 ? "up" :
    changePercent < 0 ? "down" : "neutral";

  // Label bulan
  const monthLabels = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  const prevMonthLabel = monthLabels[prevMonth - 1];

  return (
    <div
      style={{
        background  : "var(--bg-card)",
        border      : "1px solid var(--border-default)",
        borderRadius: "8px",
        fontSize    : "12px",
        padding     : "10px 14px",
        boxShadow   : "var(--shadow-medium)",
      }}
    >
      {/* Label bulan */}
      <p style={{
        color       : "#10B981",
        fontWeight  : "600",
        marginBottom: "6px",
      }}>
        {label} {selectedYear}
      </p>

      {/* Total ticket */}
      <p style={{ color: "var(--text-primary)", marginBottom: "6px" }}>
        Total: <strong>{currentTotal.toLocaleString()}</strong> tickets
      </p>

      {/* Divider */}
      <div style={{
        borderTop   : "1px solid var(--border-default)",
        marginBottom: "6px",
      }} />

      {/* % perubahan */}
      <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
        <span style={{ color: "var(--text-secondary)" }}>
          vs {prevMonthLabel} {prevYear}:
        </span>
        <strong style={{
          color: direction === "up"
            ? "#10B981"
            : direction === "down"
            ? "#EF4444"
            : "var(--text-secondary)",
        }}>
          {direction === "up" ? "▲" : direction === "down" ? "▼" : "●"}{" "}
          {direction === "up" ? "+" : ""}{changePercent}%
        </strong>
        <span style={{ color: "var(--text-secondary)", fontSize: "11px" }}>
          ({prevTotal} → {currentTotal})
        </span>
      </div>
    </div>
  );
};


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
  const [momChange, setMomChange] = useState<MonthOverMonthResult | null>(null);
  // State untuk data tahun sebelumnya (untuk cross-year comparison)
  const [prevYearVolume, setPrevYearVolume] = useState<MonthlyVolumeRow[]>([]);


// ===========================================================================
// FETCH MOM CHANGE — Hitung % perubahan bulan terpilih vs bulan sebelumnya
// Default: bulan ini
// ===========================================================================
const fetchMomChange = useCallback(async (year: number) => {
  try {
    // Gunakan bulan ini sebagai referensi
    const month = new Date().getMonth() + 1;
    const res   = await fetch(
      `/api/analytics/mom-change?year=${year}&month=${month}`
    );
    const data  = await res.json();
    setMomChange(data);
  } catch {
    console.error("Failed to fetch MoM change");
  }
}, []);


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
      // Fetch tahun ini + tahun sebelumnya secara parallel
      const [currentRes, prevRes] = await Promise.all([
        fetch(`/api/analytics/monthly-volume?year=${year}`),
        fetch(`/api/analytics/monthly-volume?year=${year - 1}`),
      ]);
  
      const [currentData, prevData] = await Promise.all([
        currentRes.json(),
        prevRes.json(),
      ]);
  
      setMonthlyVolume(currentData);
      setPrevYearVolume(prevData); // Simpan data tahun sebelumnya
    } catch {
      showToast.error("Failed to load chart data.");
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
    fetchMomChange(selectedYear); // Tambah ini
  }, [selectedYear, fetchMonthlyVolume, fetchMomChange]);
  

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
      <div className="hidden grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
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
                content={
                  <CustomBarTooltip
                    selectedYear={selectedYear}
                    monthlyVolume={monthlyVolume}
                    prevYearVolume={prevYearVolume}
                  />
                }
                cursor={{ fill: "var(--surface-muted)", opacity: 0.5 }}
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
  <div className="mt-4 pt-4 border-t border-[var(--border-default)] flex items-center gap-6 flex-wrap">

    {/* Total tahun ini */}
    <div>
      <p className="font-body text-xs text-[var(--text-secondary)]">
        Total {selectedYear}
      </p>
      <p className="font-headline font-bold text-lg text-[var(--text-primary)]">
        {monthlyVolume.reduce((sum, m) => sum + m.total, 0).toLocaleString()}
        <span className="font-body text-xs font-normal text-[var(--text-secondary)] ml-1">
          tickets
        </span>
      </p>
    </div>

    {/* Highest Month */}
    <div>
      <p className="font-body text-xs text-[var(--text-secondary)]">
        Highest Month
      </p>
      <p className="font-headline font-bold text-lg text-primary">
        {monthlyVolume.reduce((max, m) => m.total > max.total ? m : max, monthlyVolume[0])?.monthLabel}
        <span className="font-body text-xs font-normal text-[var(--text-secondary)] ml-1">
          ({monthlyVolume.reduce((max, m) => m.total > max.total ? m : max, monthlyVolume[0])?.total.toLocaleString()} tickets)
        </span>
      </p>
    </div>

    {/* Avg per Month */}
    <div>
      <p className="font-body text-xs text-[var(--text-secondary)]">
        Avg / Month
      </p>
      <p className="font-headline font-bold text-lg text-[var(--text-primary)]">
        {Math.round(
          monthlyVolume.reduce((sum, m) => sum + m.total, 0) /
          (monthlyVolume.filter((m) => m.total > 0).length || 1)
        ).toLocaleString()}
        <span className="font-body text-xs font-normal text-[var(--text-secondary)] ml-1">
          tickets
        </span>
      </p>
    </div>

    {/* Month over Month Change */}
    {momChange && (
      <div>
        <p className="font-body text-xs text-[var(--text-secondary)]">
          {/* Label bulan referensi */}
          vs{" "}
          {["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"][momChange.prevMonth - 1]}
          {" "}{momChange.prevYear}
        </p>
        <div className="flex items-center gap-1.5 mt-0.5">
          {/* Icon arah perubahan */}
          {momChange.direction === "up" && (
            <TrendingUp size={16} className="text-success" />
          )}
          {momChange.direction === "down" && (
            <TrendingDown size={16} className="text-error" />
          )}
          {momChange.direction === "neutral" && (
            <Minus size={16} className="text-[var(--text-secondary)]" />
          )}

          {/* % perubahan */}
          <p className={cn(
            "font-headline font-bold text-lg",
            momChange.direction === "up"      ? "text-success" :
            momChange.direction === "down"    ? "text-error"   :
            "text-[var(--text-secondary)]"
          )}>
            {momChange.direction === "up" ? "+" : ""}
            {momChange.changePercent}%
          </p>

          {/* Detail angka */}
          <p className="font-body text-xs text-[var(--text-secondary)]">
            ({momChange.prevTotal} → {momChange.currentTotal})
          </p>
        </div>
      </div>
    )}

  </div>
)}

      </Card>
    </DashboardLayout>
  );
}
