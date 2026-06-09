// =============================================================================
// components/layout/sidebar.tsx
// Sidebar navigation component — tampil di semua halaman dashboard
//
// Features:
// - Navigation links (Home, Tickets, Analytics, Settings)
// - Role-based menu visibility (Settings hanya admin & leader)
// - Active link indicator (highlight halaman aktif)
// - User info di bagian bawah (nama, role, email)
// - Logout button
// - Dark mode support
// - Collapsible di mobile (responsive)
// =============================================================================

"use client"; // Wajib client component karena pakai usePathname & state

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { cn } from "@/lib/utils";
import ThemeToggle from "@/components/ui/theme-toggle";
import {
  LayoutDashboard, // Home/Overview
  Ticket,          // Tickets
  BarChart2,       // Analytics
  Settings,        // Settings
  LogOut,          // Logout
  Menu,            // Hamburger menu (mobile)
  X,               // Close menu (mobile)
  ChevronRight,    // Active indicator
} from "lucide-react";

// ===========================================================================
// TYPES
// ===========================================================================

// Info user yang sedang login — nanti diambil dari NextAuth session
interface UserInfo {
  name: string;
  email: string;
  role: "admin" | "leader" | "viewer";
}

interface SidebarProps {
  user: UserInfo;
  onLogout: () => void; // Callback logout — handle di parent/layout
}

// ===========================================================================
// NAV ITEMS — Definisi semua menu navigasi
// roles: menu hanya tampil untuk role yang ada di array ini
// ===========================================================================
const navItems = [
  {
    href: "/dashboard",
    label: "Overview",
    icon: LayoutDashboard,
    roles: ["admin", "leader", "viewer"], // Semua role bisa akses
  },
  {
    href: "/dashboard/tickets",
    label: "Tickets",
    icon: Ticket,
    roles: ["admin", "leader", "viewer"], // Semua role bisa akses
  },
  {
    href: "/dashboard/analytics",
    label: "Analytics",
    icon: BarChart2,
    roles: ["admin", "leader", "viewer"], // Semua role bisa akses
  },
  {
    href: "/dashboard/settings",
    label: "Settings",
    icon: Settings,
    roles: ["admin", "leader"], // Viewer tidak bisa akses settings
  },
];

// ===========================================================================
// ROLE BADGE CONFIG — Warna badge per role
// ===========================================================================
const roleBadgeStyle: Record<UserInfo["role"], string> = {
  admin:  "bg-primary-light text-primary border border-primary/20",
  leader: "bg-info/10 text-info border border-info/20",
  viewer: "bg-[var(--surface-muted)] text-[var(--text-secondary)] border border-[var(--border-default)]",
};

// ===========================================================================
// SIDEBAR COMPONENT
// ===========================================================================
export default function Sidebar({ user, onLogout }: SidebarProps) {
  // Mobile menu open/close state
  const [mobileOpen, setMobileOpen] = useState(false);

  // Dapatkan pathname aktif untuk highlight menu
  const pathname = usePathname();

  // Filter nav items berdasarkan role user yang sedang login
  const allowedNavItems = navItems.filter((item) =>
    item.roles.includes(user.role)
  );

  // ===========================================================================
  // SIDEBAR CONTENT — Dipakai untuk desktop & mobile (sama)
  // ===========================================================================
  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* =================================================================
          LOGO / BRAND — Bagian atas sidebar
          ================================================================= */}
      <div className="px-6 py-5 border-b border-[var(--border-default)]">
        <div className="flex items-center gap-2">
          {/* Logo icon */}
          <div className="w-8 h-8 bg-primary rounded-md flex items-center justify-center">
            <span className="text-white font-headline font-bold text-sm">C</span>
          </div>
          {/* Brand name */}
          <div>
            <p className="font-headline font-bold text-sm text-[var(--text-primary)]">
              Chatwoot
            </p>
            <p className="font-body text-xs text-[var(--text-secondary)]">
              Dashboard
            </p>
          </div>
        </div>
      </div>

      {/* =================================================================
          NAVIGATION MENU — List menu items
          ================================================================= */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {allowedNavItems.map((item) => {
          // Cek apakah link ini adalah halaman aktif
          const isActive =
            item.href === "/dashboard"
              ? pathname === "/dashboard"           // Exact match untuk home
              : pathname.startsWith(item.href);     // Prefix match untuk sub-pages

          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setMobileOpen(false)} // Tutup mobile menu saat navigasi
              className={cn(
                // Base nav item styles
                "flex items-center gap-3 px-3 py-2.5 rounded-md",
                "font-body text-sm font-medium",
                "transition-all duration-150",
                "group relative",

                // Active state — mint background + text
                isActive
                  ? "bg-primary-light text-primary"
                  : // Inactive state — transparent, hover subtle
                    "text-[var(--text-secondary)] hover:bg-[var(--surface-muted)] hover:text-[var(--text-primary)]"
              )}
            >
              {/* Active indicator — bar di sisi kiri */}
              {isActive && (
                <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-primary rounded-r-full" />
              )}

              {/* Icon */}
              <Icon
                size={18}
                className={cn(
                  "shrink-0",
                  isActive ? "text-primary" : "text-[var(--text-secondary)]"
                )}
              />

              {/* Label */}
              <span className="flex-1">{item.label}</span>

              {/* Chevron — hanya tampil saat hover pada item aktif */}
              {isActive && (
                <ChevronRight size={14} className="text-primary opacity-60" />
              )}
            </Link>
          );
        })}
      </nav>

      {/* =================================================================
          BOTTOM SECTION — Theme toggle + User info + Logout
          ================================================================= */}
      <div className="px-3 py-4 border-t border-[var(--border-default)] space-y-3">
        {/* Theme Toggle */}
        <div className="px-1">
          <ThemeToggle />
        </div>

        {/* User Info Card */}
        <div className="bg-[var(--surface-muted)] rounded-md px-3 py-3">
          {/* Nama & Role badge */}
          <div className="flex items-center justify-between gap-2 mb-1">
            <p className="font-headline text-sm font-semibold text-[var(--text-primary)] truncate">
              {user.name}
            </p>
            {/* Role badge */}
            <span
              className={cn(
                "text-xs font-semibold px-2 py-0.5 rounded-sm shrink-0",
                roleBadgeStyle[user.role]
              )}
            >
              {user.role}
            </span>
          </div>

          {/* Email */}
          <p className="font-body text-xs text-[var(--text-secondary)] truncate">
            {user.email}
          </p>
        </div>

        {/* Logout Button */}
        <button
          onClick={onLogout}
          className={cn(
            "w-full flex items-center gap-2 px-3 py-2.5 rounded-md",
            "font-body text-sm font-medium",
            "text-[var(--text-secondary)] hover:bg-error/10 hover:text-error",
            "transition-colors duration-150"
          )}
        >
          <LogOut size={16} />
          <span>Logout</span>
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* ===================================================================
          DESKTOP SIDEBAR — Fixed di sisi kiri, selalu tampil di md+
          =================================================================== */}
      <aside
        className={cn(
          "hidden md:flex flex-col",
          "w-64 shrink-0 h-screen sticky top-0",
          "bg-[var(--bg-card)] border-r border-[var(--border-default)]",
        )}
      >
        <SidebarContent />
      </aside>

      {/* ===================================================================
          MOBILE TOPBAR — Hanya tampil di layar kecil (< md)
          =================================================================== */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-40 h-14 flex items-center justify-between px-4 bg-[var(--bg-card)] border-b border-[var(--border-default)]">
        {/* Brand */}
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 bg-primary rounded-md flex items-center justify-center">
            <span className="text-white font-headline font-bold text-xs">C</span>
          </div>
          <p className="font-headline font-bold text-sm text-[var(--text-primary)]">
            Chatwoot Dashboard
          </p>
        </div>

        {/* Hamburger button */}
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="p-2 rounded-md text-[var(--text-secondary)] hover:bg-[var(--surface-muted)]"
          aria-label="Toggle menu"
        >
          {mobileOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {/* ===================================================================
          MOBILE SIDEBAR OVERLAY — Drawer dari kiri saat hamburger diklik
          =================================================================== */}
      {mobileOpen && (
        <>
          {/* Backdrop — klik untuk tutup */}
          <div
            className="md:hidden fixed inset-0 z-40 bg-black/40"
            onClick={() => setMobileOpen(false)}
          />

          {/* Drawer */}
          <aside className="md:hidden fixed top-0 left-0 z-50 w-64 h-full bg-[var(--bg-card)] border-r border-[var(--border-default)] shadow-overlay">
            <SidebarContent />
          </aside>
        </>
      )}
    </>
  );
}
