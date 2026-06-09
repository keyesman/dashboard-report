// =============================================================================
// lib/utils.ts
// Utility functions yang dipakai di seluruh app
// 
// cn() — Class Name merger
// Gabungan clsx (conditional classes) + tailwind-merge (resolve conflicts)
// Contoh: cn("p-2 bg-red-500", condition && "bg-blue-500", "p-4")
// Hasil: "bg-blue-500 p-4" (p-2 di-override p-4, bg resolved)
// =============================================================================

import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Merge multiple Tailwind CSS class strings, resolving conflicts.
 * 
 * @param inputs - Class values (strings, conditionals, arrays)
 * @returns Merged & de-conflicted class string
 * 
 * @example
 * cn("p-2 text-red-500", isActive && "text-green-500", "p-4")
 * // → "text-green-500 p-4" (conflicts resolved)
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
