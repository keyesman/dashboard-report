// =============================================================================
// components/ui/data-table.tsx
// Data Table component — tabel interaktif dengan TanStack Table
//
// Features:
// - Sorting (klik header untuk sort asc/desc)
// - Pagination (next/prev, pilih jumlah row per halaman)
// - Empty state
// - Loading skeleton
// - Export CSV (dengan proper escaping & BOM untuk Excel)
// - Dark mode support
//
// Dipakai untuk:
// - Halaman Tickets (list semua ticket)
// - Expandable data di halaman Analytics
// =============================================================================

"use client"; // Client component karena pakai state untuk sorting & pagination

import {
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  getPaginationRowModel,
  useReactTable,
  type ColumnDef,
  type SortingState,
} from "@tanstack/react-table";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  ChevronUp,
  ChevronDown,
  ChevronsUpDown,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Download,
} from "lucide-react";

// ===========================================================================
// TYPES
// ===========================================================================
interface DataTableProps<TData, TValue> {
  columns        : ColumnDef<TData, TValue>[];        // Definisi kolom
  data           : TData[];                            // Data rows
  isLoading?     : boolean;                            // Loading state
  emptyMessage?  : string;                             // Pesan kalau data kosong
  showExport?    : boolean;                            // Tampilkan tombol export CSV
  exportFileName?: string;                             // Nama file CSV saat export
  exportData?    : Record<string, unknown>[];          // Data khusus untuk export (optional)
  pageSize?      : number;                             // Jumlah row per halaman (default: 10)
}

// ===========================================================================
// EXPORT TO CSV — Helper function untuk export data ke file CSV
//
// Fix yang dilakukan:
// 1. Join rows dengan newline, bukan "" yang bikin semua jadi 1 baris
// 2. Proper escape untuk koma, quotes, newline dalam value
// 3. Tambah BOM supaya Excel baca UTF-8 dengan benar
// 4. Support exportData prop untuk format custom
// ===========================================================================
// ===========================================================================
// EXPORT TO CSV — Menggunakan library SheetJS (xlsx)
// Handle semua edge case otomatis: newline, koma, quotes, special chars
// ===========================================================================
function exportToCSV(data: Record<string, unknown>[], fileName: string) {
  if (!data.length) return;

  const XLSX = require("xlsx");

  // ===========================================================================
  // Sanitize data:
  // - Header: ganti spasi dengan underscore
  // - Value: bersihkan newline supaya cell rapi
  // ===========================================================================
  const sanitizedData = data.map((row) => {
    const newRow: Record<string, unknown> = {};
    Object.entries(row).forEach(([key, value]) => {
      const safeKey = key.replace(/ /g, "_");

      if (typeof value === "string") {
        newRow[safeKey] = value
          .replace(`/\r?
/g`, " ")
          .replace(`/\r/g`, " ")
          .trim();
      } else {
        newRow[safeKey] = value;
      }
    });
    return newRow;
  });

  // Buat worksheet & workbook
  const worksheet = XLSX.utils.json_to_sheet(sanitizedData);
  const workbook  = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Tickets");

  // Export sebagai .xlsx — bukan .csv
  // Format xlsx tidak punya masalah pemisah kolom
  XLSX.writeFile(workbook, `${fileName}.xlsx`);
}





// ===========================================================================
// LOADING SKELETON — Tampil saat data sedang di-fetch
// ===========================================================================
function TableSkeleton({ columns }: { columns: number }) {
  return (
    <>
      {Array.from({ length: 5 }).map((_, rowIndex) => (
        <tr key={rowIndex}>
          {Array.from({ length: columns }).map((_, colIndex) => (
            <td key={colIndex} className="px-4 py-3">
              <div className="h-4 bg-[var(--surface-muted)] rounded animate-pulse" />
            </td>
          ))}
        </tr>
      ))}
    </>
  );
}

// ===========================================================================
// DATA TABLE COMPONENT
// ===========================================================================
export function DataTable<TData, TValue>({
  columns,
  data,
  isLoading     = false,
  emptyMessage  = "No data available.",
  showExport    = false,
  exportFileName = "export",
  exportData,
  pageSize      = 10,
}: DataTableProps<TData, TValue>) {

  // Sorting state — kolom mana yang di-sort & arahnya
  const [sorting, setSorting] = useState<SortingState>([]);

  // ===========================================================================
  // TABLE INSTANCE — Setup TanStack Table
  // ===========================================================================
  const table = useReactTable({
    data,
    columns,
    state          : { sorting },
    onSortingChange: setSorting,
    getCoreRowModel       : getCoreRowModel(),
    getSortedRowModel     : getSortedRowModel(),
    getPaginationRowModel : getPaginationRowModel(),
    initialState: {
      pagination: { pageSize }, // Set default page size
    },
  });

  return (
    <div className="flex flex-col gap-3">

      {/* ===================================================================
          TOOLBAR — Export button (optional)
          Kalau exportData ada → pakai exportData (data yang sudah diformat)
          Kalau tidak → pakai data mentah
          =================================================================== */}
      {showExport && data.length > 0 && (
        <div className="flex justify-end">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => exportToCSV(
              exportData ?? (data as Record<string, unknown>[]),
              exportFileName
            )}
            className="gap-2"
          >
            <Download size={14} />
            Export Excel
          </Button>

        </div>
      )}

      {/* ===================================================================
          TABLE WRAPPER — Horizontally scrollable di mobile
          =================================================================== */}
      <div className="w-full overflow-x-auto rounded-md border border-[var(--border-default)]">
        <table className="w-full text-sm">

          {/* ================================================================
              TABLE HEADER
              ================================================================ */}
          <thead>
            {table.getHeaderGroups().map((headerGroup) => (
              <tr
                key={headerGroup.id}
                className="bg-[var(--surface-muted)] border-b border-[var(--border-default)]"
              >
                {headerGroup.headers.map((header) => (
                  <th
                    key={header.id}
                    className={cn(
                      "px-4 py-3 text-left",
                      "font-headline text-xs font-semibold uppercase tracking-wide",
                      "text-[var(--text-secondary)]",
                      // Cursor pointer kalau kolom bisa di-sort
                      header.column.getCanSort() &&
                        "cursor-pointer select-none hover:text-[var(--text-primary)]"
                    )}
                    onClick={header.column.getToggleSortingHandler()}
                  >
                    <div className="flex items-center gap-1">
                      {/* Header label */}
                      {flexRender(
                        header.column.columnDef.header,
                        header.getContext()
                      )}

                      {/* Sort indicator icon */}
                      {header.column.getCanSort() && (
                        <span className="text-[var(--text-secondary)]">
                          {header.column.getIsSorted() === "asc" ? (
                            <ChevronUp size={14} />
                          ) : header.column.getIsSorted() === "desc" ? (
                            <ChevronDown size={14} />
                          ) : (
                            <ChevronsUpDown size={14} className="opacity-40" />
                          )}
                        </span>
                      )}
                    </div>
                  </th>
                ))}
              </tr>
            ))}
          </thead>

          {/* ================================================================
              TABLE BODY
              ================================================================ */}
          <tbody>
            {/* Loading skeleton */}
            {isLoading && (
              <TableSkeleton columns={columns.length} />
            )}

            {/* Empty state */}
            {!isLoading && table.getRowModel().rows.length === 0 && (
              <tr>
                <td
                  colSpan={columns.length}
                  className="px-4 py-12 text-center font-body text-sm text-[var(--text-secondary)]"
                >
                  {emptyMessage}
                </td>
              </tr>
            )}

            {/* Data rows */}
            {!isLoading &&
              table.getRowModel().rows.map((row) => (
                <tr
                  key={row.id}
                  className={cn(
                    "border-b border-[var(--border-default)]",
                    "hover:bg-[var(--surface-muted)]",
                    "transition-colors duration-100"
                  )}
                >
                  {row.getVisibleCells().map((cell) => (
                    <td
                      key={cell.id}
                      className="px-4 py-3 font-body text-sm text-[var(--text-primary)]"
                    >
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </td>
                  ))}
                </tr>
              ))}
          </tbody>
        </table>
      </div>

      {/* ===================================================================
          PAGINATION — Controls navigasi halaman
          =================================================================== */}
      {!isLoading && data.length > 0 && (
        <div className="flex items-center justify-between gap-4 flex-wrap">

          {/* Info jumlah data */}
          <p className="font-body text-xs text-[var(--text-secondary)]">
            Showing{" "}
            <span className="font-semibold text-[var(--text-primary)]">
              {table.getState().pagination.pageIndex *
                table.getState().pagination.pageSize + 1}
            </span>{" "}
            -{" "}
            <span className="font-semibold text-[var(--text-primary)]">
              {Math.min(
                (table.getState().pagination.pageIndex + 1) *
                  table.getState().pagination.pageSize,
                data.length
              )}
            </span>{" "}
            of{" "}
            <span className="font-semibold text-[var(--text-primary)]">
              {data.length}
            </span>{" "}
            rows
          </p>

          {/* Pagination buttons */}
          <div className="flex items-center gap-1">

            {/* First page */}
            <button
              onClick={() => table.setPageIndex(0)}
              disabled={!table.getCanPreviousPage()}
              className={cn(
                "p-1.5 rounded-md transition-colors cursor-pointer",
                "text-[var(--text-secondary)] hover:bg-[var(--surface-muted)]",
                "disabled:opacity-30 disabled:cursor-not-allowed"
              )}
              aria-label="First page"
            >
              <ChevronsLeft size={16} />
            </button>

            {/* Previous page */}
            <button
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
              className={cn(
                "p-1.5 rounded-md transition-colors cursor-pointer",
                "text-[var(--text-secondary)] hover:bg-[var(--surface-muted)]",
                "disabled:opacity-30 disabled:cursor-not-allowed"
              )}
              aria-label="Previous page"
            >
              <ChevronLeft size={16} />
            </button>

            {/* Page number indicator */}
            <span className="px-3 py-1.5 font-body text-xs text-[var(--text-secondary)]">
              Page{" "}
              <span className="font-semibold text-[var(--text-primary)]">
                {table.getState().pagination.pageIndex + 1}
              </span>{" "}
              of{" "}
              <span className="font-semibold text-[var(--text-primary)]">
                {table.getPageCount()}
              </span>
            </span>

            {/* Next page */}
            <button
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
              className={cn(
                "p-1.5 rounded-md transition-colors cursor-pointer",
                "text-[var(--text-secondary)] hover:bg-[var(--surface-muted)]",
                "disabled:opacity-30 disabled:cursor-not-allowed"
              )}
              aria-label="Next page"
            >
              <ChevronRight size={16} />
            </button>

            {/* Last page */}
            <button
              onClick={() => table.setPageIndex(table.getPageCount() - 1)}
              disabled={!table.getCanNextPage()}
              className={cn(
                "p-1.5 rounded-md transition-colors cursor-pointer",
                "text-[var(--text-secondary)] hover:bg-[var(--surface-muted)]",
                "disabled:opacity-30 disabled:cursor-not-allowed"
              )}
              aria-label="Last page"
            >
              <ChevronsRight size={16} />
            </button>

          </div>
        </div>
      )}

    </div>
  );
}

export default DataTable;
