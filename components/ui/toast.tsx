// =============================================================================
// components/ui/toast.tsx
// Toast notification component — feedback ringkas untuk aksi user
//
// Menggunakan library "sonner" yang sudah kita install sebelumnya
// Sonner dipilih karena:
// - Ringan & simple API
// - Support dark mode otomatis
// - Beautiful default animations
// - Gak perlu setup context/provider yang ribet
//
// Dipakai untuk:
// - Sukses: "Escalation berhasil disimpan!"
// - Error: "Gagal menyimpan data, coba lagi."
// - Info: "Sync sedang berjalan..."
// - Warning: "Password tidak cocok!"
// =============================================================================

"use client"; // Client component karena Toaster perlu mount di browser

import { Toaster as SonnerToaster, toast as sonnerToast } from "sonner";
import { useTheme } from "next-themes";
import {
  CheckCircle,
  XCircle,
  AlertTriangle,
  Info,
} from "lucide-react";

// ===========================================================================
// TOASTER COMPONENT
// Taruh 1x di layout utama — jadi "container" untuk semua toast notif
// ===========================================================================
export function Toaster() {
  // Ambil theme aktif supaya toast ikut dark/light mode
  const { theme } = useTheme();

  return (
    <SonnerToaster
      // Posisi toast di kanan bawah layar
      position="bottom-right"

      // Ikut dark/light mode dari next-themes
      theme={theme as "light" | "dark" | "system"}

      // Styling custom sesuai BudgetZen design system
      toastOptions={{
        style: {
          fontFamily: "var(--font-body)",
          fontSize: "14px",
          borderRadius: "12px",       // rounded-md sesuai BudgetZen
          border: "1px solid var(--border-default)",
          background: "var(--bg-card)",
          color: "var(--text-primary)",
        },
        // Durasi tampil — 4 detik (cukup untuk dibaca)
        duration: 4000,
      }}

      // Jumlah max toast yang tampil bersamaan
      visibleToasts={3}

      // Expand toast kalau ada beberapa sekaligus
      expand={false}

      // Tombol close di setiap toast
      closeButton
    />
  );
}

// ===========================================================================
// TOAST HELPERS — Shortcut functions untuk tampilkan toast
// Import & pakai langsung di mana aja tanpa perlu setup
//
// Usage:
// import { showToast } from "@/components/ui/toast"
// showToast.success("Data berhasil disimpan!")
// showToast.error("Gagal memuat data.")
// ===========================================================================
export const showToast = {
  // Success toast — aksi berhasil
  success: (message: string, description?: string) =>
    sonnerToast.success(message, {
      description,
      icon: <CheckCircle size={18} className="text-success" />,
      style: {
        borderLeft: "4px solid #10B981", // Mint green left border
      },
    }),

  // Error toast — aksi gagal
  error: (message: string, description?: string) =>
    sonnerToast.error(message, {
      description,
      icon: <XCircle size={18} className="text-error" />,
      style: {
        borderLeft: "4px solid #EF4444", // Red left border
      },
    }),

  // Warning toast — perlu perhatian user
  warning: (message: string, description?: string) =>
    sonnerToast.warning(message, {
      description,
      icon: <AlertTriangle size={18} className="text-warning" />,
      style: {
        borderLeft: "4px solid #F59E0B", // Yellow left border
      },
    }),

  // Info toast — informasi umum
  info: (message: string, description?: string) =>
    sonnerToast.info(message, {
      description,
      icon: <Info size={18} className="text-info" />,
      style: {
        borderLeft: "4px solid #38BDF8", // Sky blue left border
      },
    }),

  // Loading toast — proses sedang berjalan (bisa di-update jadi success/error)
  loading: (message: string) =>
    sonnerToast.loading(message, {
      duration: Infinity, // Tetap tampil sampai di-dismiss manual
    }),

  // Dismiss toast tertentu by ID — dipakai setelah loading selesai
  dismiss: (toastId?: string | number) =>
    sonnerToast.dismiss(toastId),
};
