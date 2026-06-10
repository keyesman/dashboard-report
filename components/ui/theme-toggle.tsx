// =============================================================================
// components/ui/theme-toggle.tsx
// Toggle button untuk switch dark/light mode
// Props:
// - iconOnly: kalau true, hanya tampil icon tanpa label (untuk collapsed sidebar)
// =============================================================================

"use client";

import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { Sun, Moon, Monitor } from "lucide-react";
import { cn } from "@/lib/utils";

interface ThemeToggleProps {
  iconOnly?: boolean; // Hanya tampil icon tanpa label
}

export default function ThemeToggle({ iconOnly = false }: ThemeToggleProps) {
  const [mounted, setMounted] = useState(false);
  const { theme, setTheme }   = useTheme();

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  const cycleTheme = () => {
    if (theme === "light")       setTheme("dark");
    else if (theme === "dark")   setTheme("system");
    else                         setTheme("light");
  };

  const getIcon = () => {
    if (theme === "dark")   return <Moon    size={18} />;
    if (theme === "light")  return <Sun     size={18} />;
    return                         <Monitor size={18} />;
  };

  const getLabel = () => {
    if (theme === "dark")   return "Dark";
    if (theme === "light")  return "Light";
    return                         "System";
  };

  return (
    <button
      onClick={cycleTheme}
      title={`Theme: ${getLabel()}`}
      aria-label={`Switch theme (current: ${getLabel()})`}
      className={cn(
        "flex items-center rounded-md",
        "bg-[var(--surface-muted)]",
        "border border-[var(--border-default)]",
        "text-[var(--text-secondary)]",
        "hover:bg-[var(--border-muted)]",
        "transition-colors duration-200",
        "text-sm font-medium font-body cursor-pointer",
        // Layout berubah berdasarkan iconOnly
        iconOnly
          ? "p-2 justify-center w-full"         // Icon only — square
          : "px-3 py-2 gap-2 w-full"            // Icon + label — full width
      )}
    >
      {getIcon()}
      {/* Label — hide kalau iconOnly */}
      {!iconOnly && (
        <span className="hidden sm:inline">{getLabel()}</span>
      )}
    </button>
  );
}
