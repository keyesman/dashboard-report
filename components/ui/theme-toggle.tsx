// =============================================================================
// components/ui/theme-toggle.tsx
// Toggle button untuk switch dark/light mode
// 
// Pakai next-themes useTheme hook untuk:
// - Detect theme saat ini (light/dark/system)
// - Switch theme (persist otomatis di localStorage)
// 
// Icon: Sun (light mode) / Moon (dark mode) dari lucide-react
// =============================================================================

"use client"; // Wajib client component karena pakai useTheme hook

import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { Sun, Moon, Monitor } from "lucide-react";

export default function ThemeToggle() {
  // ===========================================================================
  // STATE & HOOKS
  // mounted: prevent hydration mismatch (server gak tau theme, client yang tau)
  // theme: current theme value dari next-themes
  // setTheme: function untuk switch theme
  // ===========================================================================
  const [mounted, setMounted] = useState(false);
  const { theme, setTheme } = useTheme();

  // Hanya render setelah mount di client (prevent server/client mismatch)
  useEffect(() => {
    setMounted(true);
  }, []);

  // Jangan render apapun sebelum mounted (prevent flash)
  if (!mounted) return null;

  // ===========================================================================
  // CYCLE THEME: light → dark → system → light → ...
  // User bisa cycle melalui 3 opsi dengan 1 tombol
  // ===========================================================================
  const cycleTheme = () => {
    if (theme === "light") setTheme("dark");
    else if (theme === "dark") setTheme("system");
    else setTheme("light");
  };

  // Pilih icon berdasarkan theme aktif
  const getIcon = () => {
    if (theme === "dark") return <Moon size={18} />;
    if (theme === "light") return <Sun size={18} />;
    return <Monitor size={18} />; // system
  };

  // Label untuk accessibility & tooltip
  const getLabel = () => {
    if (theme === "dark") return "Dark";
    if (theme === "light") return "Light";
    return "System";
  };

  return (
    <button
      onClick={cycleTheme}
      className="
        flex items-center gap-2 px-3 py-2 rounded-md
        bg-stone-surface dark:bg-[var(--surface-muted)]
        border border-stone-border dark:border-[var(--border-default)]
        text-stone-secondary dark:text-[var(--text-secondary)]
        hover:bg-stone-muted dark:hover:bg-[var(--border-muted)]
        transition-colors duration-200
        text-sm font-medium font-body
      "
      title={`Theme: ${getLabel()}`}
      aria-label={`Switch theme (current: ${getLabel()})`}
    >
      {getIcon()}
      <span className="hidden sm:inline">{getLabel()}</span>
    </button>
  );
}
