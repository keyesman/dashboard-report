// =============================================================================
// app/dashboard/analytics/page.tsx
// Halaman Analytics — chart & metrik performa tim
//
// Features:
// - Chart: Ticket Volume per Month (bar chart hijau + tooltip breakdown service)
// - Summary metric cards (total, resolved, backlog, AVG FRT, AVG RT)
// - Bar chart: Tickets per Day
// - Line chart: AVG FRT trend per hari
// - Bar chart: Breakdown by agent/service/type/priority/escalate
// - Dark mode support
// =============================================================================

"use client";

import { useState, useCallback, useEffect } from "react";
import DashboardLayout from "@/components/layout/dashboard-layout";
import { MetricCard } from "@/components/ui/metric-card";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { showToast } from "@/components/ui/toast";
import {
  LineChart, Line, BarChart, Bar,
  XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell,
  ReferenceLine
} from "recharts";
import {
  Ticket, CheckCircle, Clock,
  AlertCircle, BarChart2, RefreshCw,
  TrendingUp, TrendingDown, Minus
} from "lucide-react";
import { cn } from "@/lib/utils";
import { getDailyAvgFrt } from "@/lib/queries/analytics";

// ===========================================================================
// TYPES
// ===========================================================================
interface AvgMetrics {
  totalTickets   : number;
  ticketsResolved: number;
  backlog        : number;
  avgFrtSeconds  : number;
  avgRtSeconds   : number;
  ticketsWithFrt : number;
}

interface DailyVolumeRow {
  date         : string;
  ticketCreated: number;
  ticketSolved : number;
}

interface DailyAvgFrtRow {
  date         : string;
  avgFrtMinutes: number;
}

interface BreakdownRow {
  label: string;
  total: number;
}

interface MonthlyVolumeRow {
  month     : number;
  monthLabel: string;
  total     : number;
}

interface MonthlyVolumeByServiceRow {
  month     : number;
  monthLabel: string;
  services  : Record<string, number>;
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

interface TopCompanyRow {
  rank   : number;
  company: string;
  total  : number;
}


// ===========================================================================
// HELPER — Convert seconds ke HH:MM:SS
// ===========================================================================
function secondsToHHMMSS(seconds: number): string {
  if (!seconds) return "00:00:00";
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

// ===========================================================================
// SERVICE COLORS — Warna dot per service di tooltip
// ===========================================================================
const SERVICE_COLORS = [
  "#10B981", "#38BDF8", "#F59E0B", "#8B5CF6", "#EF4444",
  "#06B6D4", "#F97316", "#84CC16", "#EC4899", "#6366F1",
];

function getServiceColor(index: number): string {
  return SERVICE_COLORS[index % SERVICE_COLORS.length];
}

// ===========================================================================
// CUSTOM PIE TOOLTIP — Tampilkan nama + total saat hover
// Persentase sudah tampil langsung di chart (via label)
// ===========================================================================
const CustomPieTooltip = ({
  active,
  payload,
}: {
  active?  : boolean;
  payload? : { name: string; value: number }[];
}) => {
  if (!active || !payload || !payload.length) return null;

  return (
    <div style={{
      background  : "var(--bg-card)",
      border      : "1px solid var(--border-default)",
      borderRadius: "8px",
      fontSize    : "12px",
      padding     : "8px 12px",
      boxShadow   : "var(--shadow-medium)",
    }}>
      <p style={{ color: "var(--text-primary)", fontWeight: "600" }}>
        {payload[0].name}
      </p>
      <p style={{ color: "var(--text-secondary)", marginTop: "2px" }}>
        Total: <strong style={{ color: "var(--text-primary)" }}>
          {payload[0].value.toLocaleString()}
        </strong> tickets
      </p>
    </div>
  );
};


// ===========================================================================
// CUSTOM MONTHLY TOOLTIP
// Tampilkan total ticket + breakdown per service saat hover ke bar
// ===========================================================================
const FRT_TARGET_MINUTES = 15;

 // tampilkan avg frt per day vs target frt
 const CustomFrtTooltip = ({
  active,
  payload,
  label,
}: {
  active?  : boolean;
  payload? : Array<{ value: number; name: string }>;
  label?   : string;
}) => {
  if (!active || !payload || !payload.length) return null;

  // Ambil nilai actual AVG FRT dari payload
  const actual = payload[0]?.value as number;
  const lastActual = actual > 60 ? actual/60 : actual;

  // Hitung selisih dari target (positif = di atas = buruk, negatif = di bawah = bagus)
  const diff          = actual - FRT_TARGET_MINUTES;
  const changePercent = Math.round((diff / FRT_TARGET_MINUTES) * 100);

  // Tentukan arah & warna
  const isAbove = diff > 0;
  const isEqual = diff === 0;
  const color   = isEqual ? "var(--text-secondary)" : isAbove ? "#EF4444" : "#10B981";

  return (
    <div style={{
      background  : "var(--bg-card)",
      border      : "1px solid var(--border-default)",
      borderRadius: "8px",
      fontSize    : "12px",
      padding     : "10px 14px",
      boxShadow   : "var(--shadow-medium)",
      minWidth    : "180px",
    }}>
      {/* Tanggal */}
      <p style={{ color: "#F59E0B", fontWeight: "600", marginBottom: "8px" }}>
        {label}
      </p>

      {/* AVG FRT aktual */}
      <p style={{ color: "var(--text-primary)", marginBottom: "6px" }}>
        AVG FRT: <strong>{lastActual.toFixed(2)}{actual > 60 ? " hours" : " minutes"}</strong>
      </p>

      {/* Garis pemisah */}
      <div style={{
        paddingBottom: "6px",
        marginBottom : "6px",
        borderBottom : "1px solid var(--border-default)",
      }} />

      {/* % selisih dari target — hijau kalau di bawah, merah kalau di atas */}
      <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
        <span style={{ color, fontWeight: "700", fontSize: "13px" }}>
          {isEqual ? "●" : isAbove ? "▲" : "▼"}{" "}
          {isAbove ? "+" : ""}{changePercent}%
        </span>
        <span style={{ color, fontSize: "13px" }}>
          {isEqual
            ? "achieved"
            : isAbove
            ? "not achieved"
            : "achieved"}
        </span>
      </div>
    </div>
  );
};

const CustomMonthlyTooltip = ({
  active,
  payload,
  label,
  selectedYear,
  serviceDataMap,
  monthlyVolume,
  prevYearVolume,
}: {
  active?        : boolean;
  payload?       : { value: number }[];
  label?         : string;
  selectedYear   : number;
  serviceDataMap : Record<string, Record<string, number>>;
  monthlyVolume  : MonthlyVolumeRow[];
  prevYearVolume : MonthlyVolumeRow[];
}) => {
  if (!active || !payload || !payload.length) return null;

  const total    = payload[0]?.value ?? 0;
  const services = serviceDataMap[label ?? ""] ?? {};

  // Cari data bulan ini & bulan sebelumnya untuk hitung % perubahan
  const currentData = monthlyVolume.find((m) => m.monthLabel === label);
  const prevMonth   = currentData?.month === 1 ? 12 : (currentData?.month ?? 1) - 1;
  const prevYear    = currentData?.month === 1 ? selectedYear - 1 : selectedYear;

  // Kalau cross-year (Jan vs Des tahun lalu) → ambil dari prevYearVolume
  const prevData    = currentData?.month === 1
    ? prevYearVolume.find((m) => m.month === prevMonth)
    : monthlyVolume.find((m) => m.month === prevMonth);

  const prevTotal     = prevData?.total ?? 0;
  let   changePercent = 0;
  if (prevTotal > 0) {
    changePercent = Math.round(((total - prevTotal) / prevTotal) * 100);
  } else if (total > 0) {
    changePercent = 100;
  }

  const direction =
    changePercent > 0 ? "up" :
    changePercent < 0 ? "down" : "neutral";

  const monthLabels = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

  // Sort service dari terbesar
  const sortedServices = Object.entries(services)
    .filter(([, count]) => count > 0)
    .sort(([, a], [, b]) => b - a);

  return (
    <div style={{
      background  : "var(--bg-card)",
      border      : "1px solid var(--border-default)",
      borderRadius: "8px",
      fontSize    : "12px",
      padding     : "10px 14px",
      boxShadow   : "var(--shadow-medium)",
      minWidth    : "180px",
    }}>
      {/* Header */}
      <p style={{ color: "#10B981", fontWeight: "600", marginBottom: "8px" }}>
        {label} {selectedYear}
      </p>

      {/* Total + % perubahan dalam 1 baris */}
      <div style={{
        display      : "flex",
        alignItems   : "center",
        gap          : "8px",
        marginBottom : "8px",
        paddingBottom: "8px",
        borderBottom : "1px solid var(--border-default)",
      }}>
        <p style={{ color: "var(--text-primary)" }}>
          Total: <strong>{total.toLocaleString()}</strong> tickets
        </p>

        {/* % perubahan vs bulan sebelumnya */}
        <div style={{ display: "flex", alignItems: "center", gap: "3px" }}>
          <span style={{
            color     : direction === "up" ? "#10B981" : direction === "down" ? "#EF4444" : "var(--text-secondary)",
            fontWeight: "600",
            fontSize  : "11px",
          }}>
            {direction === "up" ? "▲" : direction === "down" ? "▼" : "●"}{" "}
            {direction === "up" ? "+" : ""}{changePercent}%
          </span>
          <span style={{ color: "var(--text-secondary)", fontSize: "10px" }}>
            vs {monthLabels[prevMonth - 1]} {prevYear}
          </span>
        </div>
      </div>

      {/* Breakdown per service */}
      {sortedServices.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
          {sortedServices.map(([service, count], index) => (
            <div key={service} style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <div style={{
                width       : "8px",
                height      : "8px",
                borderRadius: "50%",
                background  : getServiceColor(index),
                flexShrink  : 0,
              }} />
              <span style={{ color: "var(--text-secondary)", flex: 1 }}>{service}</span>
              <span style={{ color: "var(--text-primary)", fontWeight: "600" }}>
                {count.toLocaleString()}
              </span>
              <span style={{ color: "var(--text-secondary)", fontSize: "11px" }}>
                ({Math.round((count / total) * 100)}%)
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};


// ===========================================================================
// ANALYTICS PAGE COMPONENT
// ===========================================================================
export default function AnalyticsPage() {

  // ===========================================================================
  // STATE — Filter date range untuk chart analytics bawah
  // ===========================================================================
  const today    = new Date().toISOString().split("T")[0];
  const monthAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
    .toISOString().split("T")[0];

  const [dateFrom,       setDateFrom]       = useState(monthAgo);
  const [dateTo,         setDateTo]         = useState(today);
  const [isLoading,      setIsLoading]      = useState(false);
  const [hasLoaded,      setHasLoaded]      = useState(false);
  const [breakdownField, setBreakdownField] = useState("agent");

  // ===========================================================================
  // STATE — Monthly Volume Chart
  // ===========================================================================
  const [availableYears,  setAvailableYears]  = useState<number[]>([]);
  const [selectedYear,    setSelectedYear]    = useState<number>(new Date().getFullYear());
  const [monthlyVolume,   setMonthlyVolume]   = useState<MonthlyVolumeRow[]>([]);
  const [prevYearVolume,  setPrevYearVolume]  = useState<MonthlyVolumeRow[]>([]);
  const [serviceDataMap,  setServiceDataMap]  = useState<Record<string, Record<string, number>>>({});
  const [isLoadingChart,  setIsLoadingChart]  = useState(false);
  const [momChange,       setMomChange]       = useState<MonthOverMonthResult | null>(null);

  // ===========================================================================
  // STATE — Analytics data (metric cards + charts per day)
  // ===========================================================================
  const [metrics,   setMetrics]   = useState<AvgMetrics | null>(null);
  const [volume,    setVolume]    = useState<DailyVolumeRow[]>([]);
  const [frtTrend,  setFrtTrend]  = useState<DailyAvgFrtRow[]>([]);
  const [breakdown, setBreakdown] = useState<BreakdownRow[]>([]);

  // Tambah setelah state breakdown
  const [topCompanies, setTopCompanies] = useState<TopCompanyRow[]>([]);


  // ===========================================================================
  // FETCH AVAILABLE YEARS — Dipanggil sekali saat mount
  // ===========================================================================
  const fetchAvailableYears = useCallback(async () => {
    try {
      const res  = await fetch("/api/analytics/available-years");
      const data = await res.json();
      setAvailableYears(data);
      if (data.length > 0) setSelectedYear(data[0]);
    } catch {
      console.error("Failed to fetch available years");
    }
  }, []);


  // ===========================================================================
  // FETCH MONTHLY VOLUME
  // Fetch: total per bulan + tahun sebelumnya (MoM) + breakdown service (tooltip)
  // ===========================================================================
  const fetchMonthlyVolume = useCallback(async (year: number) => {
    setIsLoadingChart(true);
    try {
      const [currentRes, prevRes, serviceRes] = await Promise.all([
        fetch(`/api/analytics/monthly-volume?year=${year}`),
        fetch(`/api/analytics/monthly-volume?year=${year - 1}`),
        fetch(`/api/analytics/monthly-volume?year=${year}&breakdown=service`),
      ]);

      const [currentData, prevData, serviceData] = await Promise.all([
        currentRes.json(),
        prevRes.json(),
        serviceRes.json(),
      ]);

      setMonthlyVolume(currentData);
      setPrevYearVolume(prevData);

      // Build serviceDataMap: { "Jan": { "Swift": 75, "Shopify": 63 }, ... }
      // Dipakai oleh CustomMonthlyTooltip untuk tampilkan breakdown
      const dataMap: Record<string, Record<string, number>> = {};
      serviceData.forEach((row: MonthlyVolumeByServiceRow) => {
        dataMap[row.monthLabel] = row.services;
      });
      setServiceDataMap(dataMap);

    } catch {
      showToast.error("Failed to load monthly chart.");
    } finally {
      setIsLoadingChart(false);
    }
  }, []);

  // ===========================================================================
  // FETCH MOM CHANGE — % perubahan bulan ini vs bulan sebelumnya
  // ===========================================================================
  const fetchMomChange = useCallback(async (year: number) => {
    try {
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
  // FETCH ANALYTICS — Dipanggil saat klik Show Analytics
  // ===========================================================================
  const fetchAnalytics = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = `dateFrom=${dateFrom}&dateTo=${dateTo}`;
  
      // Semua 5 fetch
      const [metricsRes, volumeRes, frtRes, breakdownRes, topCompaniesRes] = await Promise.all([
        fetch(`/api/analytics/metrics?${params}`),
        fetch(`/api/analytics/volume?${params}`),
        fetch(`/api/analytics/frt-trend?${params}`),
        fetch(`/api/analytics/breakdown?${params}&field=${breakdownField}`),
        fetch(`/api/analytics/top-companies?${params}`),
      ]);
  
      // Semua 5 json()
      const [metricsData, volumeData, frtData, breakdownData, topCompaniesData] = await Promise.all([
        metricsRes.json(),
        volumeRes.json(),
        frtRes.json(),
        breakdownRes.json(),
        topCompaniesRes.json(), // ← tambah ini
      ]);
  
      setMetrics(metricsData);
      setVolume(volumeData);
      setFrtTrend(frtData);
      setBreakdown(breakdownData);
      setTopCompanies(topCompaniesData); // ← tambah ini
      setHasLoaded(true);
  
    } catch {
      showToast.error("Failed to load analytics data.");
    } finally {
      setIsLoading(false);
    }
  }, [dateFrom, dateTo, breakdownField]);
  
  // ===========================================================================
  // FETCH BREAKDOWN ONLY — Dipanggil saat user ganti breakdown field
  // ===========================================================================
  const fetchBreakdown = useCallback(async (field: string) => {
    try {
      const res  = await fetch(
        `/api/analytics/breakdown?dateFrom=${dateFrom}&dateTo=${dateTo}&field=${field}`
      );
      const data = await res.json();
      setBreakdown(data);
    } catch {
      showToast.error("Failed to load breakdown data.");
    }
  }, [dateFrom, dateTo]);

  // ===========================================================================
  // USE EFFECTS
  // ===========================================================================

  // Fetch years saat pertama mount
  useEffect(() => {
    fetchAvailableYears();
  }, [fetchAvailableYears]);

  // Fetch monthly chart saat selectedYear berubah
  useEffect(() => {
    if (selectedYear) {
      fetchMonthlyVolume(selectedYear);
      fetchMomChange(selectedYear);
    }
  }, [selectedYear, fetchMonthlyVolume, fetchMomChange]);
  
  // Auto fetch analytics saat pertama mount — default 1 bulan ke belakang
  useEffect(() => {
    fetchAnalytics();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ===========================================================================
  // RENDER
  // ===========================================================================
  return (
    <DashboardLayout
      title="Analytics Dashboard"
      description="L1 tickets reporting dashbaord from Chatwoot API"
    >
      {/* =================================================================
          CHART MONTHLY — Bar chart hijau + tooltip breakdown service
          Independen dari filter date range di bawah
          ================================================================= */}
      <Card className="mb-6">
        {/* Header + Year Filter */}
        <div className="flex items-center justify-between flex-wrap gap-3 mb-6">
          <div className="flex items-center gap-2">
            <TrendingUp size={16} className="text-primary" />
            <h3 className="font-headline font-semibold text-[var(--text-primary)]">
              Ticket Volume per Month
            </h3>
          </div>

          {/* Year Filter Pills */}
          <div className="flex flex-wrap gap-2">
            {availableYears.length === 0 ? (
              <div className="flex gap-2">
                {[1, 2].map((i) => (
                  <div key={i} className="w-16 h-7 bg-[var(--surface-muted)] rounded-sm animate-pulse" />
                ))}
              </div>
            ) : (
              availableYears.map((year) => (
                <button
                  key={year}
                  onClick={() => setSelectedYear(year)}
                  className={cn(
                    "px-3 py-1.5 rounded-sm text-xs font-semibold font-body",
                    "border transition-all duration-150 cursor-pointer",
                    selectedYear === year
                      ? "bg-primary-light text-primary border-primary/20"
                      : "bg-[var(--surface-muted)] text-[var(--text-secondary)] border-[var(--border-default)] hover:text-primary hover:bg-primary-light hover:border-primary/20"
                  )}
                >
                  {year}
                </button>
              ))
            )}
          </div>
        </div>

        {/* Chart loading skeleton */}
        {isLoadingChart ? (
          <div className="h-64 bg-[var(--surface-muted)] rounded-md animate-pulse" />
        ) : monthlyVolume.every((m) => m.total === 0) ? (
          // Empty state
          <div className="flex flex-col items-center justify-center h-64 text-[var(--text-secondary)]">
            <BarChart2 size={40} className="opacity-20 mb-3" />
            <p className="font-body text-sm">No ticket data for {selectedYear}</p>
          </div>
        ) : (
          // Bar Chart — 1 warna hijau, tooltip tampilkan breakdown service
          <ResponsiveContainer width="100%" height={280}>
            <BarChart
              data={monthlyVolume.filter((m) => m.total >= 0)}
              margin={{ top: 10, right: 20, left: 0, bottom: 10 }}
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
                  <CustomMonthlyTooltip
                    selectedYear={selectedYear}
                    serviceDataMap={serviceDataMap}
                    monthlyVolume={monthlyVolume}
                    prevYearVolume={prevYearVolume}
                  />
                }
                cursor={{ fill: "var(--surface-muted)", opacity: 0.5 }}
              />

              {/* Single bar hijau mint */}
              <Bar
                dataKey="total"
                name="Total Tickets"
                fill="#10B981"
                radius={[4, 4, 0, 0]}
                maxBarSize={150}
              />
            </BarChart>
          </ResponsiveContainer>
        )}

        {/* Summary bar di bawah chart */}
        {!isLoadingChart && monthlyVolume.some((m) => m.total > 0) && (
          <div className="mt-4 pt-4 border-t border-[var(--border-default)]">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
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
                    vs{" "}
                    {["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"][momChange.prevMonth - 1]}
                    {" "}{momChange.prevYear}
                  </p>
                  <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                    {momChange.direction === "up"      && <TrendingUp   size={16} className="text-success" />}
                    {momChange.direction === "down"    && <TrendingDown size={16} className="text-error"   />}
                    {momChange.direction === "neutral" && <Minus        size={16} className="text-[var(--text-secondary)]" />}
                    <p className={cn(
                      "font-headline font-bold text-lg",
                      momChange.direction === "up"      ? "text-success" :
                      momChange.direction === "down"    ? "text-error"   :
                      "text-[var(--text-secondary)]"
                    )}>
                      {momChange.direction === "up" ? "+" : ""}{momChange.changePercent}%
                    </p>
                    <p className="font-body text-xs text-[var(--text-secondary)]">
                      ({momChange.prevTotal} → {momChange.currentTotal})
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </Card>

      {/* =================================================================
          FILTER DATE RANGE — Untuk chart analytics di bawah
          Tidak mempengaruhi chart monthly di atas
          ================================================================= */}
      <Card className="mb-6">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-end gap-3">
          <Input
            label="From"
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            className="w-full sm:w-44"
          />
          <Input
            label="To"
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            className="w-full sm:w-44"
          />
          <Button
            onClick={fetchAnalytics}
            disabled={isLoading}
            className="gap-2 w-full sm:w-auto shrink-0 whitespace-nowrap sm:mb-0.5"
          >
            {isLoading
              ? <RefreshCw size={16} className="animate-spin" />
              : <BarChart2 size={16} />
            }
            {isLoading ? "Loading..." : "Show Analytics"}
          </Button>
        </div>
      </Card>

      {/* Loading state saat pertama fetch */}
      {!hasLoaded && isLoading && (
        <div className="flex flex-col items-center justify-center py-20 text-[var(--text-secondary)]">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mb-3" />
          <p className="font-body text-sm">Loading analytics...</p>
        </div>
      )}

      {/* =================================================================
          ANALYTICS SECTION — Tampil setelah klik Show Analytics
          ================================================================= */}
      {hasLoaded && (
        <>
          {/* Metric Cards — Mobile: 2 kolom, Desktop: 5 kolom */}
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 mb-6">
            <MetricCard
              title="Total Tickets"
              value={metrics?.totalTickets ?? 0}
              icon={<Ticket size={18} />}
            />
            <MetricCard
              title="Resolved"
              value={metrics?.ticketsResolved ?? 0}
              icon={<CheckCircle size={18} />}
            />
            <MetricCard
              title="Backlog (Open)"
              value={
                <span className="text-primary">{metrics?.backlog ?? 0}</span>
              }
              icon={<AlertCircle size={18} />}
            />
            <MetricCard
              title="AVG FRT"
              value={
                <span
                  className={
                    (metrics?.avgFrtSeconds ?? 0) > 900
                      ? "text-red-500"
                      : "text-green-500"
                  }
                >
                  {secondsToHHMMSS(metrics?.avgFrtSeconds ?? 0)}
                </span>
              }
              subtitle={`of ${metrics?.ticketsWithFrt ?? 0} tickets`}
              description={
                <span
                  className={
                    (metrics?.avgFrtSeconds ?? 0) > 900
                      ? "text-red-500"
                      : "text-green-500"
                  }>
                    {(metrics?.avgFrtSeconds ?? 0) > 900 ? "15 minute target, not achieved!" : "15 minute target, achieved!"}
                </span>
              }
              icon={<Clock size={18} />}
            />
            <MetricCard
              title="AVG Resolution"
              value={
                <span
                  className={
                    (metrics?.avgRtSeconds ?? 0) > 28800
                      ? "text-red-500"
                      : "text-green-500"
                  }>
                    {secondsToHHMMSS(metrics?.avgRtSeconds ?? 0)}
                </span>
              }
              subtitle={`of ${metrics?.ticketsResolved ?? 0} tickets`}
              description={
                <span
                  className={
                    (metrics?.avgRtSeconds ?? 0) > 28800
                      ? "text-red-500"
                      : "text-green-500"
                  }>
                    {(metrics?.avgRtSeconds ?? 0) > 28800 ? "8 hour target, not achieved!" : "8 hour target, achieved!"}
                </span>
              }
              icon={<Clock size={18} />}
            />
          </div>

          {/* Chart — Total Tickets per Day (Bar Chart) */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>📈 Total Tickets per Day</CardTitle>
            </CardHeader>
            <CardContent>
              {volume.length > 0 ? (
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={volume} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border-default)" vertical={false} />
                    <XAxis dataKey="date" tick={{ fontSize: 11, fill: "var(--text-secondary)" }} />
                    <YAxis tick={{ fontSize: 11, fill: "var(--text-secondary)" }} allowDecimals={false} />
                    <Tooltip
                      contentStyle={{
                        background  : "var(--bg-card)",
                        border      : "1px solid var(--border-default)",
                        borderRadius: "8px",
                        fontSize    : "12px",
                      }}
                      cursor={{ fill: "var(--surface-muted)" }}
                    />
                    <Bar
                      dataKey="ticketCreated"
                      name="Ticket Masuk"
                      fill="#10B981"
                      radius={[4, 4, 0, 0]}
                      maxBarSize={40}
                    />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-center text-sm text-[var(--text-secondary)] py-10">
                  There is no data for this period.
                </p>
              )}
            </CardContent>
          </Card>

          {/* Chart — AVG FRT per Day (Line Chart) */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>⏱️ AVG FRT per Day (minute)</CardTitle>
            </CardHeader>
            <CardContent>
              {frtTrend.length > 0 ? (
                <ResponsiveContainer width="100%" height={280}>
                  <LineChart data={frtTrend}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border-default)" />
                    <XAxis dataKey="date" tick={{ fontSize: 11, fill: "var(--text-secondary)" }} />
                    <YAxis tick={{ fontSize: 11, fill: "var(--text-secondary)" }} />
                    <Tooltip
                      content={<CustomFrtTooltip />}
                    />
                    <ReferenceLine
                      y={15}
                      stroke="#EF4444"
                      strokeDasharray="5 5"
                      label={{ value: "Max FRT 15 min", position: "insideTopRight", fontSize: 13, fill: "#EF4444" }}
                    />
                    <Line
                      type="monotone"
                      dataKey="avgFrtMinutes"
                      name="AVG FRT"
                      stroke="#F59E0B"
                      strokeWidth={2}
                      dot={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-center text-sm text-[var(--text-secondary)] py-10">
                  There is no data for this period.
                </p>
              )}
            </CardContent>
          </Card>

          {/* Chart — Breakdown Ticket (Bar Chart) */}
          {/* ===============================================================
              BREAKDOWN + TOP 10 COMPANY — Layout 2 kolom
              Kiri : Pie chart breakdown (by agent/escalate/priority/type)
              Kanan: Tabel Top 10 Company
              =============================================================== */}
          <Card>
            <div className="flex flex-col lg:flex-row gap-6">

              {/* ============================================================
                  KIRI — Pie Chart Breakdown
                  ============================================================ */}
              <div className="flex-1 min-w-0">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
                  <h3 className="font-headline font-semibold text-[var(--text-primary)]">
                    ▪ Breakdown Ticket
                  </h3>

                  {/* Pill buttons */}
                  <div className="flex gap-2 overflow-x-auto pb-1">
                    {[
                      { value: "agent",    label: "Agent"    },
                      { value: "escalate", label: "Escalate" },
                      { value: "priority", label: "Priority" },
                      { value: "type",     label: "Type"     },
                    ].map((option) => (
                      <button
                        key={option.value}
                        onClick={() => {
                          setBreakdownField(option.value);
                          fetchBreakdown(option.value);
                        }}
                        className={cn(
                          "px-3 py-1.5 rounded-sm text-xs font-semibold font-body",
                          "border transition-all duration-150 cursor-pointer shrink-0",
                          breakdownField === option.value
                            ? "bg-primary-light text-primary border-primary/20"
                            : "bg-[var(--surface-muted)] text-[var(--text-secondary)] border-[var(--border-default)] hover:text-primary hover:bg-primary-light hover:border-primary/20"
                        )}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Pie Chart */}
                {breakdown.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={breakdown}
                        dataKey="total"
                        nameKey="label"
                        cx="50%"
                        cy="50%"
                        outerRadius={110}
                        // Label persentase langsung di chart
                        label={({ percent }) =>
                          percent !== undefined ? `${(percent * 100).toFixed(0)}%` : ""
                        }
                        labelLine={true}
                      >
                        {breakdown.map((_, index) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={SERVICE_COLORS[index % SERVICE_COLORS.length]}
                          />
                        ))}
                      </Pie>
                      {/* Tooltip: nama + total saat hover */}
                      <Tooltip content={<CustomPieTooltip />} />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-[300px] text-[var(--text-secondary)]">
                    <p className="font-body text-sm">No data for this period.</p>
                  </div>
                )}

                {/* Legend pie chart */}
                {breakdown.length > 0 && (
                  <div className="flex flex-wrap gap-x-4 gap-y-2 mt-2">
                    {breakdown.map((item, index) => (
                      <div key={item.label} className="flex items-center gap-1.5">
                        <div
                          className="w-2.5 h-2.5 rounded-full shrink-0"
                          style={{ background: SERVICE_COLORS[index % SERVICE_COLORS.length] }}
                        />
                        <span className="font-body text-xs text-[var(--text-secondary)]">
                          {item.label}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Divider vertikal — hanya di desktop */}
              <div className="hidden lg:block w-px bg-[var(--border-default)]" />

              {/* ============================================================
                  KANAN — Top 10 Company Table
                  ============================================================ */}
              <div className="flex-1 min-w-0">
                <h3 className="font-headline font-semibold text-[var(--text-primary)] mb-4">
                  🏢 Top 10 Company
                </h3>

                {topCompanies.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="bg-[var(--surface-muted)] border-b border-[var(--border-default)]">
                          <th className="px-3 py-2 text-left font-headline text-xs font-semibold uppercase tracking-wide text-[var(--text-secondary)] w-12">
                            No
                          </th>
                          <th className="px-3 py-2 text-left font-headline text-xs font-semibold uppercase tracking-wide text-[var(--text-secondary)]">
                            Company
                          </th>
                          <th className="px-3 py-2 text-right font-headline text-xs font-semibold uppercase tracking-wide text-[var(--text-secondary)] w-20">
                            Total
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {topCompanies.map((row) => (
                          <tr
                            key={row.rank}
                            className="border-b border-[var(--border-default)] hover:bg-[var(--surface-muted)] transition-colors"
                          >
                            <td className="px-3 py-2 font-body text-xs text-[var(--text-secondary)] text-center">
                              {row.rank}
                            </td>
                            <td className="px-3 py-2 font-body text-sm text-[var(--text-primary)]">
                              {row.company}
                            </td>
                            <td className="px-3 py-2 font-body text-sm font-semibold text-[var(--text-primary)] text-right">
                              {row.total.toLocaleString()}
                            </td>
                          </tr>
                        ))}
                        {/* Total row */}
                        <tr className="bg-[var(--surface-muted)]">
                          <td colSpan={2} className="px-3 py-2 font-headline text-sm font-semibold text-[var(--text-primary)] text-center">
                            Total
                          </td>
                          <td className="px-3 py-2 font-headline text-sm font-semibold text-primary text-right">
                            {topCompanies.reduce((sum, r) => sum + r.total, 0).toLocaleString()}
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-[300px] text-[var(--text-secondary)]">
                    <p className="font-body text-sm">No company data for this period.</p>
                  </div>
                )}
              </div>
            </div>
          </Card>

        </>
      )}
    </DashboardLayout>
  );
}
