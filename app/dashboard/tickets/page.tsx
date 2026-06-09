// =============================================================================
// app/dashboard/tickets/page.tsx
// Halaman Tickets — list semua ticket dengan filter, export CSV, input escalation
//
// Features:
// - Filter by date range, agent, service, priority, escalate, status
// - Data table dengan sorting & pagination (TanStack Table)
// - Export CSV
// - Input escalation (admin & leader only)
// - Dark mode support
// =============================================================================

"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import DashboardLayout from "@/components/layout/dashboard-layout";
import { DataTable } from "@/components/ui/data-table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Card } from "@/components/ui/card";
import { StatusBadge, PriorityBadge, Badge } from "@/components/ui/badge";
import { showToast } from "@/components/ui/toast";
import { type ColumnDef } from "@tanstack/react-table";
import { Search, RefreshCw, Filter, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";


// ===========================================================================
// TYPES
// ===========================================================================
interface Ticket {
  id                   : number;
  ticketId             : number;
  createdAt            : string;
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
  company              : string | null;
  customer             : string | null;
  phone                : string | null;
  escalationNote       : string | null;
  escalationCategory   : string | null;
}

interface FilterOptions {
  agents    : string[];
  services  : string[];
  priorities: string[];
  escalates : string[];
  statuses  : string[];
}

// ===========================================================================
// HELPER — Convert seconds ke format HH:MM:SS
// ===========================================================================
function secondsToHHMMSS(seconds: number | null): string {
  if (!seconds) return "-";
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

// ===========================================================================
// TABLE COLUMNS DEFINITION
// ===========================================================================
const columns: ColumnDef<Ticket>[] = [
  {
    accessorKey: "ticketId",
    header     : "Ticket ID",
    cell       : ({ row }) => (
      <span className="font-mono text-xs text-[var(--text-secondary)]">
        #{row.original.ticketId}
      </span>
    ),
  },
  {
    accessorKey: "createdAt",
    header     : "Created At",
    cell       : ({ row }) => (
      <span className="text-xs">
        {new Date(row.original.createdAt).toLocaleDateString("id-ID", {
          day  : "2-digit",
          month: "short",
          year : "numeric",
        })}
      </span>
    ),
  },
  {
    accessorKey: "status",
    header     : "Status",
    cell       : ({ row }) => <StatusBadge status={row.original.status} />,
  },
  {
    accessorKey: "agent",
    header     : "Agent",
    cell       : ({ row }) => (
      <span className="text-sm">{row.original.agent ?? "-"}</span>
    ),
  },
  {
    accessorKey: "service",
    header     : "Service",
    cell       : ({ row }) => (
      <span className="text-sm">{row.original.service ?? "-"}</span>
    ),
  },
  {
    accessorKey: "priority",
    header     : "Priority",
    cell       : ({ row }) =>
      row.original.priority
        ? <PriorityBadge priority={row.original.priority} />
        : <span className="text-xs text-[var(--text-secondary)]">-</span>,
  },
  {
    accessorKey: "escalate",
    header     : "Escalate",
    cell       : ({ row }) =>
      row.original.escalate ? (
        <Badge variant="warning">{row.original.escalate}</Badge>
      ) : (
        <span className="text-xs text-[var(--text-secondary)]">-</span>
      ),
  },
  {
    accessorKey: "frtSeconds",
    header     : "FRT",
    cell       : ({ row }) => (
      <span className="font-mono text-xs">
        {secondsToHHMMSS(row.original.frtSeconds)}
      </span>
    ),
  },
  {
    accessorKey: "resolutionTimeSeconds",
    header     : "Resolution",
    cell       : ({ row }) => (
      <span className="font-mono text-xs">
        {secondsToHHMMSS(row.original.resolutionTimeSeconds)}
      </span>
    ),
  },
  {
    accessorKey: "company",
    header     : "Company",
    cell       : ({ row }) => (
      <span className="text-sm">{row.original.company ?? "-"}</span>
    ),
  },
  {
    accessorKey: "escalationCategory",
    header     : "Escalation Category",
    cell       : ({ row }) =>
      row.original.escalationCategory ? (
        <Badge variant="info" className="text-xs">
          {row.original.escalationCategory}
        </Badge>
      ) : (
        <span className="text-xs text-[var(--text-secondary)]">-</span>
      ),
  },
  {
    accessorKey: "escalationNote",
    header     : "Escalation Note",
    cell       : ({ row }) =>
      row.original.escalationNote ? (
        <Badge variant="info" className="text-xs">
          {row.original.escalationNote}
        </Badge>
      ) : (
        <span className="text-xs text-[var(--text-secondary)]">-</span>
      ),
  },
];

// ===========================================================================
// TICKETS PAGE COMPONENT
// ===========================================================================
export default function TicketsPage() {
  const { data: session } = useSession();
  const role = (session?.user as { role?: string })?.role ?? "viewer";

  // ===========================================================================
  // STATE
  // ===========================================================================
  const [tickets,       setTickets]       = useState<Ticket[]>([]);
  const [filterOptions, setFilterOptions] = useState<FilterOptions>({
    agents: [], services: [], priorities: [], escalates: [], statuses: [],
  });
  const [isLoading,     setIsLoading]     = useState(false);
  const [hasSearched,   setHasSearched]   = useState(false);
  const [filterOpen, setFilterOpen] = useState(true); // Default: expanded

  // Filter state
  const today     = new Date().toISOString().split("T")[0];
  const weekAgo   = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];
  const [dateFrom,  setDateFrom]  = useState(weekAgo);
  const [dateTo,    setDateTo]    = useState(today);
  const [agent,     setAgent]     = useState("");
  const [service,   setService]   = useState("");
  const [priority,  setPriority]  = useState("");
  const [escalate,  setEscalate]  = useState("");
  const [status,    setStatus]    = useState("");

  // Escalation form state
  const [selTicketId,   setSelTicketId]   = useState<number | null>(null);
  const [escCategory,   setEscCategory]   = useState("");
  const [escNote,       setEscNote]       = useState("");
  const [escCategories, setEscCategories] = useState<string[]>([]);
  const [isSavingEsc,   setIsSavingEsc]   = useState(false);

  // ===========================================================================
  // FETCH FILTER OPTIONS on mount
  // ===========================================================================
  useEffect(() => {
    async function fetchFilterOptions() {
      try {
        const res  = await fetch("/api/tickets/filter-options");
        const data = await res.json();
        setFilterOptions(data);
      } catch {
        console.error("Failed to fetch filter options");
      }
    }

    async function fetchEscCategories() {
      try {
        const res  = await fetch("/api/settings/escalation-categories?activeOnly=true");
        const data = await res.json();
        setEscCategories(data.map((c: { name: string }) => c.name));
      } catch {
        console.error("Failed to fetch escalation categories");
      }
    }

    fetchFilterOptions();
    fetchEscCategories();
  }, []);

  // ===========================================================================
  // FETCH TICKETS
  // ===========================================================================
  const fetchTickets = useCallback(async () => {
    setIsLoading(true);
    setHasSearched(true);

    try {
      const params = new URLSearchParams({ dateFrom, dateTo });
      if (agent)    params.append("agent",    agent);
      if (service)  params.append("service",  service);
      if (priority) params.append("priority", priority);
      if (escalate) params.append("escalate", escalate);
      if (status)   params.append("status",   status);

      const res  = await fetch(`/api/tickets?${params.toString()}`);
      const data = await res.json();
      setTickets(data);
    } catch {
      showToast.error("Gagal memuat data tickets.");
    } finally {
      setIsLoading(false);
    }
  }, [dateFrom, dateTo, agent, service, priority, escalate, status]);

  // ===========================================================================
  // SAVE ESCALATION
  // ===========================================================================
  const handleSaveEscalation = async () => {
    if (!selTicketId) {
      showToast.warning("Pilih ticket dulu!");
      return;
    }
    if (!escCategory && !escNote) {
      showToast.warning("Isi category atau note escalation!");
      return;
    }

    setIsSavingEsc(true);

    try {
      const res = await fetch("/api/tickets/escalation", {
        method : "POST",
        headers: { "Content-Type": "application/json" },
        body   : JSON.stringify({
          ticketId          : selTicketId,
          escalationCategory: escCategory,
          escalationNote    : escNote,
        }),
      });

      if (res.ok) {
        showToast.success("Escalation berhasil disimpan!");
        setEscNote("");
        setEscCategory("");
        setSelTicketId(null);
        // Refresh data
        fetchTickets();
      } else {
        showToast.error("Gagal menyimpan escalation.");
      }
    } catch {
      showToast.error("Terjadi kesalahan.");
    } finally {
      setIsSavingEsc(false);
    }
  };

  // ===========================================================================
  // RENDER
  // ===========================================================================
  return (
    <DashboardLayout
      title="Tickets"
      description="List semua ticket dari Chatwoot"
    >
      {/* =================================================================
          FILTER SECTION — Collapsible
          ================================================================= */}
      <Card className="mb-6">
        {/* Header filter — klik untuk collapse/expand */}
        {/* Header filter — klik untuk collapse/expand */}
        <button
          onClick={() => setFilterOpen(!filterOpen)}
          className="w-full flex items-center justify-between cursor-pointer"
        >
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <Filter size={16} className="text-primary" />
              <h2 className="font-headline font-semibold text-[var(--text-primary)]">
                Filter
              </h2>
            </div>

            {/* Divider */}
            <span className="text-[var(--border-default)]">|</span>

            {/* Reset Filter button */}
            <button
              onClick={(e) => {
                // Stop propagation supaya gak trigger collapse/expand
                e.stopPropagation();

                // Reset semua filter ke default
                setDateFrom(weekAgo);
                setDateTo(today);
                setAgent("");
                setService("");
                setPriority("");
                setEscalate("");
                setStatus("");
              }}
              className="
                font-body text-sm text-[var(--text-secondary)]
                hover:text-primary transition-colors duration-150
                cursor-pointer
              "
            >
              Reset Filter
            </button>
          </div>

          {/* Chevron icon — rotate saat expand */}
          <ChevronDown
            size={16}
            className={cn(
              "text-[var(--text-secondary)] transition-transform duration-200",
              filterOpen && "rotate-180"
            )}
          />
        </button>


        {/* Filter content — collapse/expand */}
        {filterOpen && (
          <div className="mt-4">
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-3 items-end">
              {/* Date From */}
              <Input
                label="Dari Tanggal"
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
              />

              {/* Date To */}
              <Input
                label="Sampai Tanggal"
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
              />

              {/* Status */}
              <Select
                label="Status"
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                options={[
                  { value: "", label: "Semua Status" },
                  ...filterOptions.statuses.map((s) => ({ value: s, label: s })),
                ]}
              />

              {/* Agent */}
              <Select
                label="Agent"
                value={agent}
                onChange={(e) => setAgent(e.target.value)}
                options={[
                  { value: "", label: "Semua Agent" },
                  ...filterOptions.agents.map((a) => ({ value: a, label: a })),
                ]}
              />

              {/* Service */}
              <Select
                label="Service"
                value={service}
                onChange={(e) => setService(e.target.value)}
                options={[
                  { value: "", label: "Semua Service" },
                  ...filterOptions.services.map((s) => ({ value: s, label: s })),
                ]}
              />

              {/* Priority */}
              <Select
                label="Priority"
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
                options={[
                  { value: "", label: "Semua Priority" },
                  ...filterOptions.priorities.map((p) => ({ value: p, label: p })),
                ]}
              />

              {/* Escalate */}
              <Select
                label="Escalate"
                value={escalate}
                onChange={(e) => setEscalate(e.target.value)}
                options={[
                  { value: "", label: "Semua Level" },
                  ...filterOptions.escalates.map((e) => ({ value: e, label: e })),
                ]}
              />

              {/* Submit Button */}
              <Button
                onClick={fetchTickets}
                disabled={isLoading}
                className="gap-2 w-full whitespace-nowrap mt-5"
              >
                {isLoading ? (
                  <RefreshCw size={16} className="animate-spin" />
                ) : (
                  <Search size={16} />
                )}
                {isLoading ? "Loading..." : "Tampilkan"}
              </Button>
            </div>
          </div>
        )}

      </Card>


      {/* =================================================================
          DATA TABLE
          ================================================================= */}
      {hasSearched && (
        <Card className="mb-6">
          {/* Summary */}
          <div className="flex items-center justify-between mb-4">
            <p className="font-body text-sm text-[var(--text-secondary)]">
              Total:{" "}
              <span className="font-semibold text-[var(--text-primary)]">
                {tickets.length} tickets
              </span>
            </p>
          </div>

          <DataTable
            columns={columns}
            data={tickets}
            isLoading={isLoading}
            emptyMessage="Tidak ada ticket untuk filter yang dipilih."
            showExport
            exportFileName={`tickets_${dateFrom}_${dateTo}`}
            pageSize={20}
          />
        </Card>
      )}

      {/* =================================================================
          INPUT ESCALATION — Hanya untuk admin & leader
          ================================================================= */}
      {["admin", "leader"].includes(role) && hasSearched && tickets.length > 0 && (
        <Card>
          <h2 className="font-headline font-semibold text-[var(--text-primary)] mb-4">
            📝 Input Escalation
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Pilih Ticket */}
            <Select
              label="Pilih Ticket ID"
              value={selTicketId?.toString() ?? ""}
              onChange={(e) => setSelTicketId(Number(e.target.value))}
              options={[
                { value: "", label: "Pilih ticket..." },
                ...tickets.map((t) => ({
                  value: t.ticketId.toString(),
                  label: `#${t.ticketId} — ${t.agent ?? "Unassigned"} — ${t.status}`,
                })),
              ]}
            />

            {/* Escalation Category */}
            <Select
              label="Escalation Category"
              value={escCategory}
              onChange={(e) => setEscCategory(e.target.value)}
              options={[
                { value: "", label: "Pilih category..." },
                ...escCategories.map((c) => ({ value: c, label: c })),
              ]}
            />
          </div>

          {/* Escalation Note */}
          <div className="mt-4">
            <label className="font-body text-sm font-semibold text-[var(--text-secondary)] block mb-1.5">
              Escalation Note
            </label>
            <textarea
              value={escNote}
              onChange={(e) => setEscNote(e.target.value)}
              placeholder="Tuliskan detail escalation..."
              rows={3}
              className="
                w-full px-4 py-3 rounded-md font-body text-sm
                bg-[var(--bg-card)] text-[var(--text-primary)]
                border-[1.5px] border-stone-muted
                hover:border-tertiary
                focus:border-primary focus:ring-2 focus:ring-primary/15
                outline-none transition-all duration-200
                placeholder:text-[var(--text-secondary)] placeholder:opacity-60
                resize-none
              "
            />
          </div>

          {/* Save Button */}
          <div className="mt-4 flex justify-end">
            <Button
              onClick={handleSaveEscalation}
              disabled={isSavingEsc}
              className="gap-2"
            >
              {isSavingEsc ? (
                <RefreshCw size={16} className="animate-spin" />
              ) : null}
              {isSavingEsc ? "Menyimpan..." : "💾 Simpan Escalation"}
            </Button>
          </div>
        </Card>
      )}
    </DashboardLayout>
  );
}
