// =============================================================================
// components/layout/dashboard-layout.tsx
// Dashboard Layout wrapper — layout utama untuk semua halaman dashboard
//
// Struktur:
// ┌─────────────┬──────────────────────────────┐
// │             │  Header (breadcrumb + title)  │
// │   Sidebar   ├──────────────────────────────┤
// │             │                              │
// │  (desktop)  │      Page Content            │
// │             │      {children}              │
// │             │                              │
// └─────────────┴──────────────────────────────┘
//
// Features:
// - Integrasi dengan Sidebar component
// - Header dengan page title & breadcrumb
// - Responsive (mobile topbar + desktop sidebar)
// - Auth session check via NextAuth
// - Logout handler
// - Dark mode support
// =============================================================================

"use client"; // Client component karena pakai useSession & router

import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import Sidebar from "@/components/layout/sidebar";
import { cn } from "@/lib/utils";

// ===========================================================================
// TYPES
// ===========================================================================
interface DashboardLayoutProps {
  children: React.ReactNode;  // Page content
  title?: string;             // Page title di header (opsional)
  description?: string;       // Page description di bawah title (opsional)
}

// ===========================================================================
// DASHBOARD LAYOUT COMPONENT
// ===========================================================================
export default function DashboardLayout({
  children,
  title,
  description,
}: DashboardLayoutProps) {
  const router = useRouter();

  // Ambil session dari NextAuth
  const { data: session, status } = useSession();

  // ===========================================================================
  // AUTH GUARD — Redirect ke login kalau belum authenticated
  // ===========================================================================
  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

  // ===========================================================================
  // LOADING STATE — Tampilkan skeleton saat session loading
  // ===========================================================================
  if (status === "loading") {
    return (
      <div className="flex h-screen items-center justify-center bg-[var(--bg-page)]">
        <div className="flex flex-col items-center gap-3">
          {/* Spinner */}
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="font-body text-sm text-[var(--text-secondary)]">
            Loading...
          </p>
        </div>
      </div>
    );
  }

  // ===========================================================================
  // NOT AUTHENTICATED — Return null (redirect sudah dihandle di useEffect)
  // ===========================================================================
  if (status === "unauthenticated" || !session) {
    return null;
  }

  // ===========================================================================
  // USER INFO — Ambil dari session NextAuth
  // ===========================================================================
  const user = {
    name : session.user?.name  ?? "Unknown",
    email: session.user?.email ?? "",
    role : (session.user as { role?: string })?.role as "admin" | "leader" | "viewer" ?? "viewer",
  };

  // ===========================================================================
  // LOGOUT HANDLER
  // signOut dari NextAuth + redirect ke login
  // ===========================================================================
  const handleLogout = async () => {
    await signOut({ callbackUrl: "/login" });
  };

  return (
    <div className="flex h-screen overflow-hidden bg-[var(--bg-page)]">
      {/* =====================================================================
          SIDEBAR — Navigation panel (desktop fixed, mobile drawer)
          ===================================================================== */}
      <Sidebar user={user} onLogout={handleLogout} />

      {/* =====================================================================
          MAIN AREA — Header + Page Content
          ===================================================================== */}
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        {/* ==================================================================
            PAGE HEADER — Title & description
            Hanya tampil kalau ada title prop
            ================================================================== */}
        {title && (
          <header
            className={cn(
              "shrink-0 px-6 py-4",
              "bg-[var(--bg-card)] border-b border-[var(--border-default)]",
              // Extra top padding di mobile karena ada topbar fixed
              "pt-16 md:pt-4"
            )}
          >
            {/* Page Title */}
            <h1 className="font-headline text-xl font-bold text-[var(--text-primary)]">
              {title}
            </h1>

            {/* Page Description — optional */}
            {description && (
              <p className="font-body text-sm text-[var(--text-secondary)] mt-0.5">
                {description}
              </p>
            )}
          </header>
        )}

        {/* ==================================================================
            PAGE CONTENT — Scrollable area untuk konten halaman
            ================================================================== */}
        <main
          className={cn(
            "flex-1 overflow-y-auto",
            "px-6 py-6",
            // Extra top padding di mobile kalau gak ada header title
            !title && "pt-20 md:pt-6"
          )}
        >
          {children}
        </main>
      </div>
    </div>
  );
}
