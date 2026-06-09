// =============================================================================
// components/ui/select.tsx
// Select / Dropdown component — pilihan dari list opsi
//
// Features:
// - Native HTML select (simple, accessible, mobile-friendly)
// - Support label + helper text + error message
// - Support placeholder option
// - Support disabled state
// - Support dark mode via CSS variables
//
// Dipakai untuk:
// - Filter Agent, Service, Priority, Escalate, Status di Tickets
// - Breakdown selector di Analytics
// - Role selector di User Management
// - Escalation category selector
// =============================================================================

import { cn } from "@/lib/utils";
import { forwardRef } from "react";
import { ChevronDown } from "lucide-react";

// ===========================================================================
// OPTION TYPE — Structure untuk setiap pilihan di dropdown
// ===========================================================================
export interface SelectOption {
  value: string;  // Value yang dikirim ke form/handler
  label: string;  // Text yang ditampilkan ke user
}

// ===========================================================================
// SELECT PROPS
// Extend native <select> props + custom props
// ===========================================================================
export interface SelectProps
  extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;           // Label di atas select (opsional)
  helperText?: string;      // Teks helper di bawah (opsional)
  errorMessage?: string;    // Pesan error (opsional)
  placeholder?: string;     // Placeholder option pertama (opsional)
  options: SelectOption[];  // List opsi yang ditampilkan
}

// ===========================================================================
// SELECT COMPONENT
// Pakai native <select> untuk simplicity & accessibility
// Custom styled dengan Tailwind + ChevronDown icon overlay
// ===========================================================================
const Select = forwardRef<HTMLSelectElement, SelectProps>(
  (
    {
      className,
      label,
      helperText,
      errorMessage,
      placeholder,
      options,
      disabled,
      id,
      ...props
    },
    ref
  ) => {
    // Generate id otomatis dari label kalau gak di-provide
    const selectId = id ?? label?.toLowerCase().replace(/\s+/g, "-");

    // Tentukan apakah state error aktif
    const isError = !!errorMessage;

    return (
      <div className="flex flex-col gap-1.5 w-full">
        {/* =================================================================
            LABEL — Teks di atas select
            ================================================================= */}
        {label && (
          <label
            htmlFor={selectId}
            className={cn(
              "font-body text-sm font-semibold",
              // Warna label — merah kalau error
              isError
                ? "text-error"
                : "text-[var(--text-secondary)]",
              disabled && "opacity-50"
            )}
          >
            {label}
          </label>
        )}

        {/* =================================================================
            SELECT WRAPPER — Relative container untuk ChevronDown icon
            ================================================================= */}
        <div className="relative flex items-center">
          {/* Native Select Element */}
          <select
            id={selectId}
            ref={ref}
            disabled={disabled}
            className={cn(
              // Base styles
              "w-full h-11 font-body text-sm rounded-md",
              "bg-[var(--bg-card)] text-[var(--text-primary)]",
              "outline-none transition-all duration-200",
              "appearance-none cursor-pointer", // Hide default arrow
              "pl-4 pr-10",                     // Padding kanan untuk icon

              // Border default
              "border-[1.5px] border-stone-muted",

              // Hover state
              "hover:border-tertiary",

              // Focus state — mint border + ring
              "focus:border-primary focus:ring-2 focus:ring-primary/15",

              // Error state
              isError && "border-error focus:border-error focus:ring-error/12",

              // Disabled state
              "disabled:bg-[var(--surface-muted)] disabled:text-[var(--text-secondary)]",
              "disabled:border-[var(--border-default)] disabled:cursor-not-allowed disabled:opacity-50",

              className
            )}
            {...props}
          >
            {/* Placeholder option — tidak bisa dipilih kembali */}
            {placeholder && (
              <option value="" disabled>
                {placeholder}
              </option>
            )}

            {/* Render semua options dari props */}
            {options.map((option) => (
              <option
                key={option.value}
                value={option.value}
                className="bg-[var(--bg-card)] text-[var(--text-primary)]"
              >
                {option.label}
              </option>
            ))}
          </select>

          {/* ChevronDown Icon — overlay di kanan, pointer-events-none
              supaya klik tetap ke select element */}
          <ChevronDown
            size={16}
            className={cn(
              "absolute right-3 pointer-events-none",
              "text-[var(--text-secondary)]",
              disabled && "opacity-50"
            )}
          />
        </div>

        {/* =================================================================
            HELPER TEXT — Info tambahan, hanya tampil kalau tidak ada error
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

Select.displayName = "Select";

export { Select };
