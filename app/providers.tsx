// =============================================================================
// app/providers.tsx
// Theme Provider wrapper — menghandle dark/light mode switching
// 
// Pakai next-themes supaya:
// - Theme persist di localStorage (user gak perlu switch ulang)
// - Support system preference (ikut OS setting)
// - No flicker saat page load (ditangani oleh suppressHydrationWarning)
// =============================================================================

"use client"; // Wajib client component karena pakai context/state

import { ThemeProvider } from "next-themes";
import { Toaster } from "@/components/ui/toast"; // Import Toaster

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider
      attribute="class"        // Toggle class "dark" di <html>
      defaultTheme="system"    // Default ikut OS preference user
      enableSystem             // Support auto-detect OS dark/light
      disableTransitionOnChange={false} // Allow smooth color transition
    >
      {children}
      {/* Toaster — taruh di sini supaya aktif di seluruh app */}
      <Toaster />
    </ThemeProvider>
  );
}
