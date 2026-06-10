// =============================================================================
// components/ui/metric-card.tsx
// MetricCard component — kartu ringkasan angka/statistik utama
//
// Dipakai di halaman Analytics & Home untuk tampilkan:
// - Total Tickets
// - Tickets Resolved
// - Backlog (Open)
// - AVG FRT
// - AVG Resolution Time
//
// Support dark mode via CSS variables
// Support trend indicator (naik/turun/netral)
// =============================================================================

import { cn } from "@/lib/utils";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";

// ===========================================================================
// TYPES
// ===========================================================================

// Arah trend — dipakai untuk warna & icon indicator
type TrendDirection = "up" | "down" | "neutral";

interface MetricCardProps {
  title: string;           // Label metric (contoh: "Total Tickets")
  value: string | number;  // Nilai utama yang ditampilkan besar
  subtitle?: string;       // Teks kecil di bawah value (opsional)
  trend?: {
    direction: TrendDirection; // Arah trend: up | down | neutral
    label: string;             // Label trend (contoh: "+12% dari kemarin")
  };
  icon?: React.ReactNode;  // Icon di kanan atas card (opsional)
  className?: string;
}

// ===========================================================================
// TREND CONFIG — Mapping direction ke warna & icon
// "up"      → hijau (biasanya bagus, misal solved naik)
// "down"    → merah (biasanya buruk, misal resolved turun)
// "neutral" → abu (tidak ada perubahan signifikan)
// ===========================================================================
const trendConfig: Record<TrendDirection, {
  color: string;
  icon: React.ReactNode;
}> = {
  up: {
    color: "text-success",
    icon: <TrendingUp size={14} />,
  },
  down: {
    color: "text-error",
    icon: <TrendingDown size={14} />,
  },
  neutral: {
    color: "text-[var(--text-secondary)]",
    icon: <Minus size={14} />,
  },
};

// ===========================================================================
// METRIC CARD COMPONENT
// ===========================================================================
export function MetricCard({
  title,
  value,
  subtitle,
  trend,
  icon,
  className,
}: MetricCardProps) {
  return (
    <div
      className={cn(
        // Background & border — auto switch dark/light
        "bg-[var(--bg-card)] border border-[var(--border-default)]",
        // Shape, spacing, elevation
        "rounded-md p-5",
        "shadow-subtle hover:shadow-medium",
        "transition-shadow duration-200",
        className
      )}
    >
      {/* ===================================================================
          TOP ROW — Title label + optional icon
          =================================================================== */}
      <div className="flex items-start justify-between gap-2">
        {/* Title — label metric kecil di atas */}
        <p className="font-body text-sm font-medium text-[var(--text-secondary)]">
          {title}
        </p>

        {/* Icon — optional, tampil di kanan atas */}
        {icon && (
          <div className="text-[var(--text-secondary)] opacity-60 mt-0.5">
            {icon}
          </div>
        )}
      </div>

      {/* ===================================================================
          VALUE — Angka/nilai utama yang ditampilkan besar
          =================================================================== */}
      <p
        className={cn(
          "font-headline font-bold text-[var(--text-primary)] mt-2",
          typeof value === "string" && value.length > 5
            ? "text-xl"   // Untuk format HH:MM:SS
            : "text-3xl"  // Untuk angka pendek
        )}
      >
        {value}
      </p>


      {/* ===================================================================
          SUBTITLE — Teks kecil opsional di bawah value
          Contoh: "dari 142 ticket total"
          =================================================================== */}
      {subtitle && (
        <p className="font-body text-xs text-[var(--text-secondary)] mt-1">
          {subtitle}
        </p>
      )}

      {/* ===================================================================
          TREND INDICATOR — Arah perubahan (optional)
          Tampil di bawah sebagai pill kecil berwarna
          =================================================================== */}
      {trend && (
        <div
          className={cn(
            "inline-flex items-center gap-1 mt-3",
            "text-xs font-semibold font-body",
            trendConfig[trend.direction].color
          )}
        >
          {/* Icon trend (arrow up/down/minus) */}
          {trendConfig[trend.direction].icon}
          {/* Label trend */}
          <span>{trend.label}</span>
        </div>
      )}
    </div>
  );
}

export default MetricCard;
