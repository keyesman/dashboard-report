// =============================================================================
// app/providers.tsx
// Global providers wrapper — membungkus seluruh app dengan context providers
//
// Providers yang dipakai:
// - SessionProvider : NextAuth session context (wajib untuk useSession hook)
// - ThemeProvider   : Dark/light mode context
// - Toaster         : Toast notification container
// =============================================================================

"use client"; // Client component karena semua provider butuh client context

import { SessionProvider } from "next-auth/react";
import { ThemeProvider }   from "next-themes";
import { Toaster }         from "@/components/ui/toast";

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    // SessionProvider — wajib ada supaya useSession() bisa dipakai
    // di semua client components
    <SessionProvider>
      <ThemeProvider
        attribute="class"
        defaultTheme="system"
        enableSystem
        disableTransitionOnChange={false}
      >
        {children}

        {/* Toaster — container untuk semua toast notifications */}
        <Toaster />
      </ThemeProvider>
    </SessionProvider>
  );
}
