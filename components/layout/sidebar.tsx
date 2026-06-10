// =============================================================================
// components/layout/sidebar.tsx
// Sidebar navigation component — collapsible, dengan animasi smooth
//
// Features:
// - Collapse/expand dengan toggle button
// - Collapsed state: hanya tampil icon
// - Expanded state: icon + label
// - Active link indicator
// - Role-based menu visibility
// - User info di bagian bawah
// - Theme toggle
// - Dark mode support
// - Responsive (mobile drawer)
// =============================================================================

"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { cn } from "@/lib/utils";
import ThemeToggle from "@/components/ui/theme-toggle";
import {
  LayoutDashboard,
  Ticket,
  BarChart2,
  Settings,
  LogOut,
  Menu,
  X,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

// ===========================================================================
// TYPES
// ===========================================================================
interface UserInfo {
  name : string;
  email: string;
  role : "admin" | "leader" | "viewer";
}

interface SidebarProps {
  user    : UserInfo;
  onLogout: () => void;
}

// ===========================================================================
// NAV ITEMS
// ===========================================================================
const navItems = [
  {
    href : "/dashboard",
    label: "Overview",
    icon : LayoutDashboard,
    roles: ["admin", "leader", "viewer"],
  },
  {
    href : "/dashboard/tickets",
    label: "Tickets",
    icon : Ticket,
    roles: ["admin", "leader", "viewer"],
  },
  {
    href : "/dashboard/analytics",
    label: "Analytics",
    icon : BarChart2,
    roles: ["admin", "leader", "viewer"],
  },
  {
    href : "/dashboard/settings",
    label: "Settings",
    icon : Settings,
    roles: ["admin", "leader"],
  },
];

// ===========================================================================
// ROLE BADGE CONFIG
// ===========================================================================
const roleBadgeStyle: Record<UserInfo["role"], string> = {
  admin : "bg-primary-light text-primary border border-primary/20",
  leader: "bg-info/10 text-info border border-info/20",
  viewer: "bg-[var(--surface-muted)] text-[var(--text-secondary)] border border-[var(--border-default)]",
};

// ===========================================================================
// SIDEBAR COMPONENT
// ===========================================================================
export default function Sidebar({ user, onLogout }: SidebarProps) {
  const [mobileOpen,  setMobileOpen]  = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false); // Collapse state
  const pathname = usePathname();

  const allowedNavItems = navItems.filter((item) =>
    item.roles.includes(user.role)
  );

  // ===========================================================================
  // SIDEBAR CONTENT
  // ===========================================================================
  const SidebarContent = () => (
    <div className="flex flex-col h-full relative">

      {/* =================================================================
          COLLAPSE TOGGLE BUTTON — Desktop only
          Posisi absolute di kanan atas sidebar
          ================================================================= */}
      <button
        onClick={() => setIsCollapsed(!isCollapsed)}
        className={cn(
          "hidden md:flex",
          "absolute -right-3 top-6 z-10",
          "w-6 h-6 rounded-full",
          "bg-[var(--bg-card)] border border-[var(--border-default)]",
          "items-center justify-center",
          "text-[var(--text-secondary)] hover:text-primary",
          "shadow-subtle hover:shadow-medium",
          "transition-all duration-200 cursor-pointer"
        )}
        title={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
      >
        {isCollapsed
          ? <ChevronRight size={12} />
          : <ChevronLeft  size={12} />
        }
      </button>

      {/* =================================================================
          LOGO / BRAND
          ================================================================= */}
      <div className={cn(
        "border-b border-[var(--border-default)]",
        "transition-all duration-300",
        isCollapsed ? "px-3 py-5" : "px-6 py-5"
      )}>
        <div className="flex items-center gap-2 overflow-hidden">
          {/* Logo icon — selalu tampil */}
          <div className="w-8 h-8 bg-primary rounded-md flex items-center justify-center shrink-0">
            <span className="text-white font-headline font-bold text-sm">C</span>
          </div>

          {/* Brand name — hide saat collapsed */}
          {!isCollapsed && (
            <div className="overflow-hidden">
              <p className="font-headline font-bold text-sm text-[var(--text-primary)] whitespace-nowrap">
                Chatwoot
              </p>
              <p className="font-body text-xs text-[var(--text-secondary)] whitespace-nowrap">
                Dashboard
              </p>
            </div>
          )}
        </div>
      </div>

      {/* =================================================================
          NAVIGATION MENU
          ================================================================= */}
      <nav className={cn(
        "flex-1 py-4 space-y-1 overflow-y-auto overflow-x-hidden",
        isCollapsed ? "px-2" : "px-3"
      )}>
        {allowedNavItems.map((item) => {
          const isActive =
            item.href === "/dashboard"
              ? pathname === "/dashboard"
              : pathname.startsWith(item.href);

          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setMobileOpen(false)}
              title={isCollapsed ? item.label : undefined} // Tooltip saat collapsed
              className={cn(
                "flex items-center rounded-md",
                "font-body text-sm font-medium",
                "transition-all duration-150",
                "group relative",
                // Padding berubah saat collapsed
                isCollapsed ? "px-2 py-2.5 justify-center" : "px-3 py-2.5 gap-3",
                // Active vs inactive
                isActive
                  ? "bg-primary-light text-primary"
                  : "text-[var(--text-secondary)] hover:bg-[var(--surface-muted)] hover:text-[var(--text-primary)]"
              )}
            >
              {/* Active indicator bar */}
              {isActive && !isCollapsed && (
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

              {/* Label — hide saat collapsed */}
              {!isCollapsed && (
                <span className="flex-1 whitespace-nowrap overflow-hidden">
                  {item.label}
                </span>
              )}

              {/* Active dot — tampil saat collapsed */}
              {isActive && isCollapsed && (
                <span className="absolute right-1 top-1 w-1.5 h-1.5 bg-primary rounded-full" />
              )}
            </Link>
          );
        })}
      </nav>

      {/* =================================================================
          BOTTOM SECTION — Theme toggle + User info + Logout
          ================================================================= */}
      <div className={cn(
        "py-4 border-t border-[var(--border-default)] space-y-3",
        isCollapsed ? "px-2" : "px-3"
      )}>
        {/* Theme Toggle */}
        {isCollapsed ? (
          // Collapsed: hanya icon
          <div className="flex justify-center">
            <ThemeToggle iconOnly />
          </div>
        ) : (
          <ThemeToggle />
        )}

        {/* User Info — hide saat collapsed */}
        {!isCollapsed && (
          <div className="bg-[var(--surface-muted)] rounded-md px-3 py-3">
            <div className="flex items-center justify-between gap-2 mb-1">
              <p className="font-headline text-sm font-semibold text-[var(--text-primary)] truncate">
                {user.name}
              </p>
              <span className={cn(
                "text-xs font-semibold px-2 py-0.5 rounded-sm shrink-0",
                roleBadgeStyle[user.role]
              )}>
                {user.role}
              </span>
            </div>
            <p className="font-body text-xs text-[var(--text-secondary)] truncate">
              {user.email}
            </p>
          </div>
        )}

        {/* Logout Button */}
        <button
          onClick={onLogout}
          title={isCollapsed ? "Logout" : undefined}
          className={cn(
            "w-full flex items-center rounded-md",
            "font-body text-sm font-medium",
            "text-[var(--text-secondary)] hover:bg-error/10 hover:text-error",
            "transition-colors duration-150 cursor-pointer",
            isCollapsed ? "px-2 py-2.5 justify-center" : "px-3 py-2.5 gap-2"
          )}
        >
          <LogOut size={16} />
          {!isCollapsed && <span>Logout</span>}
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* ===================================================================
          DESKTOP SIDEBAR — Collapsible width
          =================================================================== */}
      <aside
        className={cn(
          "hidden md:flex flex-col",
          "h-screen sticky top-0 shrink-0",
          "bg-[var(--bg-card)] border-r border-[var(--border-default)]",
          // Width berubah smooth saat collapse/expand
          "transition-all duration-300 ease-in-out",
          isCollapsed ? "w-16" : "w-64"
        )}
      >
        <SidebarContent />
      </aside>

      {/* ===================================================================
          MOBILE TOPBAR
          =================================================================== */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-40 h-14 flex items-center justify-between px-4 bg-[var(--bg-card)] border-b border-[var(--border-default)]">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 bg-primary rounded-md flex items-center justify-center">
            <span className="text-white font-headline font-bold text-xs">C</span>
          </div>
          <p className="font-headline font-bold text-sm text-[var(--text-primary)]">
            Chatwoot Dashboard
          </p>
        </div>
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="p-2 rounded-md text-[var(--text-secondary)] hover:bg-[var(--surface-muted)] cursor-pointer"
        >
          {mobileOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {/* ===================================================================
          MOBILE SIDEBAR DRAWER
          =================================================================== */}
      {mobileOpen && (
        <>
          <div
            className="md:hidden fixed inset-0 z-40 bg-black/40"
            onClick={() => setMobileOpen(false)}
          />
          <aside className="md:hidden fixed top-0 left-0 z-50 w-64 h-full bg-[var(--bg-card)] border-r border-[var(--border-default)] shadow-overlay">
            <SidebarContent />
          </aside>
        </>
      )}
    </>
  );
}
