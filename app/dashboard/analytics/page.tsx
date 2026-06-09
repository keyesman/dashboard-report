// =============================================================================
// app/dashboard/analytics/page.tsx
// Halaman Analytics — chart & metrik performa tim
//
// Features:
// - Summary metric cards (total, resolved, backlog, AVG FRT, AVG RT)
// - Line chart: Tickets per hari
// - Line chart: AVG FRT trend per hari
// - Bar chart: Breakdown by agent/service/type/priority/escalate
// - Export data dari setiap chart
// - Dark mode support
// =============================================================================

"use client";

import { useState, useCallback } from "react";
import DashboardLayout from "@/components/layout/dashboard-layout";
import { MetricCard } from "@/components/ui/metric-card";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { showToast } from "@/components/ui/toast";
import {
  LineChart, Line, BarChart, Bar,
  XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer
} from "recharts";
import {
  Ticket, CheckCircle, Clock,
  AlertCircle, BarChart2, RefreshCw
} from "lucide-react";

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
// ANALYTICS PAGE COMPONENT
// ===========================================================================
export default function AnalyticsPage() {
  // ===========================================================================
  // STATE
  // ===========================================================================
  const today   = new Date().toISOString().split("T")[0];
  const monthAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
    .toISOString().split("T")[0];

  const [dateFrom,      setDateFrom]      = useState(monthAgo);
  const [dateTo,        setDateTo]        = useState(today);
  const [isLoading,     setIsLoading]     = useState(false);
  const [hasLoaded,     setHasLoaded]     = useState(false);
  const [breakdownField, setBreakdownField] = useState("agent");

  // Data state
  const [metrics,    setMetrics]    = useState<AvgMetrics | null>(null);
  const [volume,     setVolume]     = useState<DailyVolumeRow[]>([]);
  const [frtTrend,   setFrtTrend]   = useState<DailyAvgFrtRow[]>([]);
  const [breakdown,  setBreakdown]  = useState<BreakdownRow[]>([]);

  // ===========================================================================
  // FETCH ALL ANALYTICS DATA
  // ===========================================================================
  const fetchAnalytics = useCallback(async () => {
    setIsLoading(true);

    try {
      const params = `dateFrom=${dateFrom}&dateTo=${dateTo}`;

      // Fetch semua data parallel
      const [metricsRes, volumeRes, frtRes, breakdownRes] = await Promise.all([
        fetch(`/api/analytics/metrics?${params}`),
        fetch(`/api/analytics/volume?${params}`),
        fetch(`/api/analytics/frt-trend?${params}`),
        fetch(`/api/analytics/breakdown?${params}&field=${breakdownField}`),
      ]);

      const [metricsData, volumeData, frtData, breakdownData] = await Promise.all([
        metricsRes.json(),
        volumeRes.json(),
        frtRes.json(),
        breakdownRes.json(),
      ]);

      setMetrics(metricsData);
      setVolume(volumeData);
      setFrtTrend(frtData);
      setBreakdown(breakdownData);
      setHasLoaded(true);

    } catch {
      showToast.error("Gagal memuat data analytics.");
    } finally {
      setIsLoading(false);
    }
  }, [dateFrom, dateTo, breakdownField]);

  // ===========================================================================
  // FETCH BREAKDOWN ONLY — saat user ganti breakdown field
  // ===========================================================================
  const fetchBreakdown = useCallback(async (field: string) => {
    try {
      const res  = await fetch(
        `/api/analytics/breakdown?dateFrom=${dateFrom}&dateTo=${dateTo}&field=${field}`
      );
      const data = await res.json();
      setBreakdown(data);
    } catch {
      showToast.error("Gagal memuat breakdown data.");
    }
  }, [dateFrom, dateTo]);

  // ===========================================================================
  // RENDER
  // ===========================================================================
  return (
    <DashboardLayout
      title="Analytics"
      description="Chart dan metrik performa tim support"
    >
      {/* =================================================================
          FILTER PERIODE
          ================================================================= */}
      <Card className="mb-6">
        <div className="flex flex-wrap items-end gap-4">
          <Input
            label="Dari Tanggal"
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            className="w-44"
          />
          <Input
            label="Sampai Tanggal"
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            className="w-44"
          />
          <Button
            onClick={fetchAnalytics}
            disabled={isLoading}
            className="gap-2 mb-0.5"
          >
            {isLoading
              ? <RefreshCw size={16} className="animate-spin" />
              : <BarChart2 size={16} />
            }
            {isLoading ? "Loading..." : "Show Analytics"}
          </Button>
        </div>
      </Card>

      {/* Belum ada data */}
      {!hasLoaded && !isLoading && (
        <div className="flex flex-col items-center justify-center py-20 text-[var(--text-secondary)]">
          <BarChart2 size={48} className="opacity-20 mb-3" />
          <p className="font-body text-sm">
            Pilih periode dan klik "Show Analytics"
          </p>
        </div>
      )}

      {hasLoaded && (
        <>
          {/* ===============================================================
              METRIC CARDS — Summary angka utama
              =============================================================== */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
            <MetricCard
              title="Total Tickets"
              value={metrics?.totalTickets ?? 0}
              icon={<Ticket size={18} />}
            />
            <MetricCard
              title="Tickets Resolved"
              value={metrics?.ticketsResolved ?? 0}
              icon={<CheckCircle size={18} />}
            />
            <MetricCard
              title="Backlog (Open)"
              value={metrics?.backlog ?? 0}
              icon={<AlertCircle size={18} />}
            />
            <MetricCard
              title="AVG FRT"
              value={secondsToHHMMSS(metrics?.avgFrtSeconds ?? 0)}
              subtitle={`Dari ${metrics?.ticketsWithFrt ?? 0} ticket`}
              icon={<Clock size={18} />}
            />
            <MetricCard
              title="AVG Resolution"
              value={secondsToHHMMSS(metrics?.avgRtSeconds ?? 0)}
              subtitle={`Dari ${metrics?.ticketsResolved ?? 0} ticket`}
              icon={<Clock size={18} />}
            />
          </div>

          {/* ===============================================================
              CHART 1 — Ticket per Hari (Line Chart)
              =============================================================== */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>📈 Total Tickets per Hari</CardTitle>
            </CardHeader>
            <CardContent>
              {volume.length > 0 ? (
                <ResponsiveContainer width="100%" height={280}>
                  <LineChart data={volume}>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke="var(--border-default)"
                    />
                    <XAxis
                      dataKey="date"
                      tick={{ fontSize: 11, fill: "var(--text-secondary)" }}
                    />
                    <YAxis
                      tick={{ fontSize: 11, fill: "var(--text-secondary)" }}
                    />
                    <Tooltip
                      contentStyle={{
                        background   : "var(--bg-card)",
                        border       : "1px solid var(--border-default)",
                        borderRadius : "8px",
                        fontSize     : "12px",
                      }}
                    />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="ticketCreated"
                      name="Ticket Masuk"
                      stroke="#10B981"
                      strokeWidth={2}
                      dot={false}
                    />
                    <Line
                      type="monotone"
                      dataKey="ticketSolved"
                      name="Ticket Solved"
                      stroke="#38BDF8"
                      strokeWidth={2}
                      dot={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-center text-sm text-[var(--text-secondary)] py-10">
                  Tidak ada data untuk periode ini.
                </p>
              )}
            </CardContent>
          </Card>

          {/* ===============================================================
              CHART 2 — AVG FRT Trend (Line Chart)
              =============================================================== */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>⏱️ AVG FRT per Hari (menit)</CardTitle>
            </CardHeader>
            <CardContent>
              {frtTrend.length > 0 ? (
                <ResponsiveContainer width="100%" height={280}>
                  <LineChart data={frtTrend}>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke="var(--border-default)"
                    />
                    <XAxis
                      dataKey="date"
                      tick={{ fontSize: 11, fill: "var(--text-secondary)" }}
                    />
                    <YAxis
                      tick={{ fontSize: 11, fill: "var(--text-secondary)" }}
                    />
                    <Tooltip
                      contentStyle={{
                        background  : "var(--bg-card)",
                        border      : "1px solid var(--border-default)",
                        borderRadius: "8px",
                        fontSize    : "12px",
                      }}
                      formatter={(value) => [`${value} menit`, "AVG FRT"]}
                    />
                    <Line
                      type="monotone"
                      dataKey="avgFrtMinutes"
                      name="AVG FRT (menit)"
                      stroke="#F59E0B"
                      strokeWidth={2}
                      dot={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-center text-sm text-[var(--text-secondary)] py-10">
                  Tidak ada data FRT untuk periode ini.
                </p>
              )}
            </CardContent>
          </Card>

          {/* ===============================================================
              CHART 3 — Breakdown (Bar Chart)
              =============================================================== */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between flex-wrap gap-3">
                <CardTitle>▪ Breakdown Ticket</CardTitle>
                {/* Dropdown pilih breakdown field */}
                <Select
                  value={breakdownField}
                  onChange={(e) => {
                    setBreakdownField(e.target.value);
                    fetchBreakdown(e.target.value);
                  }}
                  options={[
                    { value: "agent",    label: "By Agent"    },
                    { value: "service",  label: "By Service"  },
                    { value: "type",     label: "By Type"     },
                    { value: "priority", label: "By Priority" },
                    { value: "escalate", label: "By Escalate" },
                  ]}
                  className="w-40"
                />
              </div>
            </CardHeader>
            <CardContent>
              {breakdown.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={breakdown} layout="vertical">
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke="var(--border-default)"
                    />
                    <XAxis
                      type="number"
                      tick={{ fontSize: 11, fill: "var(--text-secondary)" }}
                    />
                    <YAxis
                      type="category"
                      dataKey="label"
                      width={120}
                      tick={{ fontSize: 11, fill: "var(--text-secondary)" }}
                    />
                    <Tooltip
                      contentStyle={{
                        background  : "var(--bg-card)",
                        border      : "1px solid var(--border-default)",
                        borderRadius: "8px",
                        fontSize    : "12px",
                      }}
                    />
                    <Bar
                      dataKey="total"
                      name="Total Tickets"
                      fill="#10B981"
                      radius={[0, 4, 4, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-center text-sm text-[var(--text-secondary)] py-10">
                  Tidak ada data untuk breakdown ini.
                </p>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </DashboardLayout>
  );
}
