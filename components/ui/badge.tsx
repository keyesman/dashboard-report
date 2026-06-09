// =============================================================================
// components/ui/badge.tsx
// Badge / Chip component — label kecil untuk status, kategori, filter
//
// Variants:
// - default     : Abu neutral (label biasa)
// - primary     : Mint green (aktif, selected)
// - success     : Hijau (on track, resolved)
// - warning     : Kuning (at risk, pending)
// - error       : Merah (over budget, escalated)
// - info        : Biru (informational)
//
// Dipakai untuk:
// - Status ticket (open, resolved, pending, snoozed)
// - Priority label (P1, P2, P3, P4)
// - Escalate label (L1, L2)
// - Filter chips di halaman Tickets
// =============================================================================

import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

// ===========================================================================
// BADGE VARIANTS — Style per variant menggunakan CVA
// Semua variant pakai background transparan (10% opacity) supaya soft
// ===========================================================================
const badgeVariants = cva(
  // Base styles — applied ke semua variants
  `inline-flex items-center gap-1
   font-body text-xs font-semibold
   px-2.5 py-0.5 rounded-sm
   border
   transition-colors duration-150`,
  {
    variants: {
      variant: {
        // Default — abu neutral, untuk label biasa
        default:
          "bg-[var(--surface-muted)] text-[var(--text-secondary)] border-[var(--border-default)]",

        // Primary — mint green, untuk status aktif / selected
        primary:
          "bg-primary-light text-primary border-primary/20",

        // Success — hijau, untuk resolved / on track
        success:
          "bg-success/10 text-success border-success/20",

        // Warning — kuning, untuk pending / at risk
        warning:
          "bg-warning/10 text-warning border-warning/20",

        // Error — merah, untuk escalated / over budget / failed
        error:
          "bg-error/10 text-error border-error/20",

        // Info — biru, untuk informational / snoozed
        info:
          "bg-info/10 text-info border-info/20",
      },
    },

    // Default variant kalau gak di-specify
    defaultVariants: {
      variant: "default",
    },
  }
);

// ===========================================================================
// BADGE PROPS
// ===========================================================================
export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

// ===========================================================================
// BADGE COMPONENT
// ===========================================================================
function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <span
      className={cn(badgeVariants({ variant }), className)}
      {...props}
    />
  );
}

// ===========================================================================
// STATUS BADGE — Helper khusus untuk status ticket Chatwoot
// Auto-map status string ke variant yang sesuai
// ===========================================================================
const statusVariantMap: Record<string, VariantProps<typeof badgeVariants>["variant"]> = {
  open      : "info",      // Biru — ticket masih aktif
  resolved  : "success",   // Hijau — ticket selesai
  pending   : "warning",   // Kuning — menunggu response
  snoozed   : "default",   // Abu — di-snooze sementara
};

interface StatusBadgeProps {
  status: string;   // Status dari Chatwoot: open | resolved | pending | snoozed
  className?: string;
}

function StatusBadge({ status, className }: StatusBadgeProps) {
  // Ambil variant berdasarkan status, fallback ke "default" kalau gak dikenal
  const variant = statusVariantMap[status.toLowerCase()] ?? "default";

  return (
    <Badge variant={variant} className={className}>
      {/* Dot indicator di sebelah kiri text */}
      <span className="w-1.5 h-1.5 rounded-full bg-current opacity-70" />
      {/* Capitalize status text */}
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </Badge>
  );
}

// ===========================================================================
// PRIORITY BADGE — Helper khusus untuk priority ticket (P1-P4)
// P1 = merah (critical), P2 = kuning, P3 = biru, P4 = abu
// ===========================================================================
const priorityVariantMap: Record<string, VariantProps<typeof badgeVariants>["variant"]> = {
  P1: "error",    // Critical — merah
  P2: "warning",  // High — kuning
  P3: "info",     // Medium — biru
  P4: "default",  // Low — abu
};

interface PriorityBadgeProps {
  priority: string;  // P1 | P2 | P3 | P4
  className?: string;
}

function PriorityBadge({ priority, className }: PriorityBadgeProps) {
  // Uppercase priority supaya konsisten (p1 → P1)
  const normalized = priority.toUpperCase();
  const variant = priorityVariantMap[normalized] ?? "default";

  return (
    <Badge variant={variant} className={className}>
      {normalized}
    </Badge>
  );
}

// ===========================================================================
// EXPORTS
// ===========================================================================
export { Badge, StatusBadge, PriorityBadge, badgeVariants };
