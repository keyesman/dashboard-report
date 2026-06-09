// =============================================================================
// components/ui/card.tsx
// Card component — container utama untuk content sections
//
// Sub-components:
// - Card            : Wrapper utama (border, shadow, rounded)
// - CardHeader      : Section atas (title area)
// - CardTitle       : Heading text
// - CardDescription : Subtitle / helper text
// - CardContent     : Body content area
//
// Support dark mode via CSS variables (--bg-card, --border-default)
// Hover effect: shadow naik dari subtle ke medium
// =============================================================================

import { cn } from "@/lib/utils";
import { forwardRef } from "react";

// ===========================================================================
// CARD — Container wrapper utama
// Default: bg card, border subtle, rounded-md, shadow-subtle
// ===========================================================================
const Card = forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        // Background & border — pakai CSS var supaya auto switch dark/light
        "bg-[var(--bg-card)] border border-[var(--border-default)]",
        // Shape & spacing
        "rounded-md p-5",
        // Elevation — hover shadow naik
        "shadow-subtle hover:shadow-medium",
        // Smooth shadow transition
        "transition-shadow duration-200",
        className
      )}
      {...props}
    />
  )
);
Card.displayName = "Card";

// ===========================================================================
// CARD HEADER — Section atas card (title + description)
// ===========================================================================
const CardHeader = forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        "flex flex-col space-y-1.5 pb-4",
        // Border bawah sebagai separator antara header & content
        "border-b border-[var(--border-default)]",
        className
      )}
      {...props}
    />
  )
);
CardHeader.displayName = "CardHeader";

// ===========================================================================
// CARD TITLE — Heading text di dalam card
// ===========================================================================
const CardTitle = forwardRef<HTMLHeadingElement, React.HTMLAttributes<HTMLHeadingElement>>(
  ({ className, ...props }, ref) => (
    <h3
      ref={ref}
      className={cn(
        // Font & weight
        "font-headline text-lg font-semibold",
        // Warna auto switch dark/light
        "text-[var(--text-primary)]",
        className
      )}
      {...props}
    />
  )
);
CardTitle.displayName = "CardTitle";

// ===========================================================================
// CARD DESCRIPTION — Subtitle / helper text di bawah title
// ===========================================================================
const CardDescription = forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLParagraphElement>>(
  ({ className, ...props }, ref) => (
    <p
      ref={ref}
      className={cn(
        // Font body, ukuran kecil, warna secondary
        "font-body text-sm text-[var(--text-secondary)]",
        className
      )}
      {...props}
    />
  )
);
CardDescription.displayName = "CardDescription";

// ===========================================================================
// CARD CONTENT — Body area card, untuk isi konten utama
// ===========================================================================
const CardContent = forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        // Padding atas sebagai jarak dari header
        "pt-4",
        className
      )}
      {...props}
    />
  )
);
CardContent.displayName = "CardContent";

// ===========================================================================
// EXPORTS — Export semua sub-components
// ===========================================================================
export { Card, CardHeader, CardTitle, CardDescription, CardContent };
