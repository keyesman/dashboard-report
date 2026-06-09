// =============================================================================
// components/ui/input.tsx
// Input component — text input field dengan BudgetZen design system
//
// Features:
// - States: default, hover, focus, error, disabled
// - Support label + helper text + error message
// - Support left/right icon/addon
// - Support dark mode via CSS variables
//
// Dipakai untuk:
// - Form login (email, password)
// - Filter input di halaman Tickets
// - Form tambah user, shift, category di Settings
// =============================================================================

import { cn } from "@/lib/utils";
import { forwardRef } from "react";

// ===========================================================================
// INPUT PROPS
// Extend native <input> props + custom props
// ===========================================================================
export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;         // Label di atas input (opsional)
  helperText?: string;    // Teks helper di bawah input (opsional)
  errorMessage?: string;  // Pesan error — jika ada, input jadi error state
  leftIcon?: React.ReactNode;  // Icon di sisi kiri (opsional)
  rightIcon?: React.ReactNode; // Icon di sisi kanan (opsional)
}

// ===========================================================================
// INPUT COMPONENT
// forwardRef supaya bisa di-ref dari parent (contoh: focus management)
// ===========================================================================
const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      className,
      label,
      helperText,
      errorMessage,
      leftIcon,
      rightIcon,
      disabled,
      id,
      ...props
    },
    ref
  ) => {
    // Generate id otomatis dari label kalau gak di-provide
    const inputId = id ?? label?.toLowerCase().replace(/\s+/g, "-");

    // Tentukan apakah state error aktif
    const isError = !!errorMessage;

    return (
      <div className="flex flex-col gap-1.5 w-full">
        {/* =================================================================
            LABEL — Teks di atas input
            ================================================================= */}
        {label && (
          <label
            htmlFor={inputId}
            className={cn(
              "font-body text-sm font-semibold",
              // Warna label — merah kalau error, normal kalau tidak
              isError
                ? "text-error"
                : "text-[var(--text-secondary)]",
              // Opacity kurang kalau disabled
              disabled && "opacity-50"
            )}
          >
            {label}
          </label>
        )}

        {/* =================================================================
            INPUT WRAPPER — Relative container untuk icon positioning
            ================================================================= */}
        <div className="relative flex items-center">
          {/* Left Icon — absolute di sisi kiri */}
          {leftIcon && (
            <div className="absolute left-3 text-[var(--text-secondary)] pointer-events-none">
              {leftIcon}
            </div>
          )}

          {/* Input Field */}
          <input
            id={inputId}
            ref={ref}
            disabled={disabled}
            className={cn(
              // Base styles
              "w-full h-11 font-body text-sm rounded-md",
              "bg-[var(--bg-card)] text-[var(--text-primary)]",
              "placeholder:text-[var(--text-secondary)] placeholder:opacity-60",
              "outline-none transition-all duration-200",

              // Border default
              "border-[1.5px] border-stone-muted",

              // Hover state
              "hover:border-tertiary",

              // Focus state — mint border + ring
              "focus:border-primary focus:ring-2 focus:ring-primary/15",

              // Error state — red border + ring
              isError && "border-error focus:border-error focus:ring-error/12",

              // Disabled state
              "disabled:bg-[var(--surface-muted)] disabled:text-[var(--text-secondary)]",
              "disabled:border-[var(--border-default)] disabled:cursor-not-allowed disabled:opacity-50",

              // Padding kiri extra kalau ada left icon
              leftIcon ? "pl-10" : "pl-4",
              // Padding kanan extra kalau ada right icon
              rightIcon ? "pr-10" : "pr-4",

              className
            )}
            {...props}
          />

          {/* Right Icon — absolute di sisi kanan */}
          {rightIcon && (
            <div className="absolute right-3 text-[var(--text-secondary)] pointer-events-none">
              {rightIcon}
            </div>
          )}
        </div>

        {/* =================================================================
            HELPER TEXT — Teks kecil di bawah input (info tambahan)
            Hanya tampil kalau tidak ada error message
            ================================================================= */}
        {helperText && !isError && (
          <p className="font-body text-xs text-[var(--text-secondary)]">
            {helperText}
          </p>
        )}

        {/* =================================================================
            ERROR MESSAGE — Tampil kalau ada error, replace helper text
            ================================================================= */}
        {isError && (
          <p className="font-body text-xs text-error font-medium">
            {errorMessage}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = "Input";

export { Input };
