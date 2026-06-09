// =============================================================================
// components/ui/button.tsx
// Reusable Button component dengan BudgetZen design system
// 
// Variants:
// - primary    : Mint green fill, white text (CTA utama)
// - secondary  : Transparent, mint border + text (CTA sekunder)
// - ghost      : Transparent, subtle text (aksi minor)
// - destructive: Red fill, white text (delete, danger actions)
//
// Sizes: sm (32px), md (40px), lg (48px)
// =============================================================================

import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";
import { forwardRef } from "react";

// ===========================================================================
// BUTTON VARIANTS — Definisi semua style berdasarkan variant & size
// Menggunakan CVA (Class Variance Authority) untuk clean variant management
// ===========================================================================
const buttonVariants = cva(
  // Base styles — applied ke semua variants
  `inline-flex items-center justify-center gap-2
   font-headline font-semibold
   rounded-md transition-all duration-200
   focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50
   disabled:opacity-50 disabled:cursor-not-allowed`,
  {
    variants: {
      // Style per variant
      variant: {
        // Primary — Mint green fill, white text
        primary:
          "bg-primary text-white hover:bg-primary-hover active:scale-[0.98]",

        // Secondary — Transparent, mint border
        secondary:
          "bg-transparent text-primary border-[1.5px] border-primary hover:bg-primary-light active:scale-[0.98]",

        // Ghost — Transparent, subtle text, light hover
        ghost:
          "bg-transparent text-[var(--text-secondary)] hover:bg-[var(--surface-muted)] hover:text-[var(--text-primary)]",

        // Destructive — Red fill, white text (danger actions)
        destructive:
          "bg-error text-white hover:bg-red-600 active:scale-[0.98]",
      },

      // Size variants — height, padding, font size, border radius
      size: {
        sm: "h-8 px-4 text-[13px] rounded-md",   // 32px height
        md: "h-10 px-5 text-[15px] rounded-md",   // 40px height (default)
        lg: "h-12 px-7 text-[17px] rounded-md",   // 48px height
      },
    },

    // Default variant kalau gak di-specify
    defaultVariants: {
      variant: "primary",
      size: "md",
    },
  }
);

// ===========================================================================
// BUTTON COMPONENT
// Extend native <button> props + variant props dari CVA
// Pakai forwardRef supaya bisa di-ref dari parent component
// ===========================================================================
export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, ...props }, ref) => {
    return (
      <button
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);

Button.displayName = "Button";

export { Button, buttonVariants };
