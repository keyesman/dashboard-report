// =============================================================================
// app/dashboard/page.tsx
// Dashboard home page — halaman pertama setelah login
//
// Tampilkan:
// - Welcome message dengan nama user
// - Quick info cards (Tickets, Analytics, Settings)
// =============================================================================

import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import DashboardLayout from "@/components/layout/dashboard-layout";
import { Card } from "@/components/ui/card";
import { Ticket, BarChart2, Settings } from "lucide-react";

export default async function DashboardPage() {
  // Ambil session — kalau belum login redirect ke login
  const session = await auth();
  if (!session) redirect("/login");

  return (
    <DashboardLayout
      title="Overview"
      description="Welcome to L1 Reporting Dashboard"
    >
      {/* Welcome message */}
      <div className="mb-8">
        <h2 className="font-headline text-2xl font-bold text-[var(--text-primary)]">
          Hello, {session.user?.name}! 👋
        </h2>
        <p className="font-body text-sm text-[var(--text-secondary)] mt-1">
          {/* Berikut ringkasan dashboard kamu hari ini. */}
        </p>
      </div>

      {/* Quick info cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Tickets Card */}
        <Card className="flex items-start gap-4">
          <div className="w-10 h-10 bg-primary-light rounded-md flex items-center justify-center shrink-0">
            <Ticket size={20} className="text-primary" />
          </div>
          <div>
            <p className="font-headline font-semibold text-[var(--text-primary)]">
              Tickets
            </p>
            <p className="font-body text-sm text-[var(--text-secondary)] mt-0.5">
            View and filter all tickets from Chatwoot
            </p>
          </div>
        </Card>

        {/* Analytics Card */}
        <Card className="flex items-start gap-4">
          <div className="w-10 h-10 bg-info/10 rounded-md flex items-center justify-center shrink-0">
            <BarChart2 size={20} className="text-info" />
          </div>
          <div>
            <p className="font-headline font-semibold text-[var(--text-primary)]">
              Analytics
            </p>
            <p className="font-body text-sm text-[var(--text-secondary)] mt-0.5">
            L1 team performance charts and metrics
            </p>
          </div>
        </Card>

        {/* Settings Card */}
        <Card className="flex items-start gap-4">
          <div className="w-10 h-10 bg-warning/10 rounded-md flex items-center justify-center shrink-0">
            <Settings size={20} className="text-warning" />
          </div>
          <div>
            <p className="font-headline font-semibold text-[var(--text-primary)]">
              Settings
            </p>
            <p className="font-body text-sm text-[var(--text-secondary)] mt-0.5">
            Manage shifts, categories, users and sync data
            </p>
          </div>
        </Card>
      </div>
    </DashboardLayout>
  );
}
