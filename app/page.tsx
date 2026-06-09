// =============================================================================
// app/page.tsx
// Halaman temporary untuk test BudgetZen design system + Dark Mode
// Nanti akan diganti dengan Dashboard home page
// =============================================================================

import ThemeToggle from "@/components/ui/theme-toggle";

export default function Home() {
  return (
    <div className="min-h-screen p-10">
      {/* Header dengan theme toggle */}
      <div className="flex items-center justify-between mb-8">
        <h1 className="font-headline text-3xl font-bold">
          ✓ BudgetZen Design System
        </h1>
        {/* Toggle dark/light mode */}
        <ThemeToggle />
      </div>

      {/* Body text */}
      <p className="font-body text-body text-[var(--text-secondary)] mt-4">
        Ini test paragraph pakai font Nunito. Coba klik toggle di kanan atas untuk switch dark/light mode.
      </p>

      {/* Cards — test dark mode support */}
      <div className="flex gap-4 mt-8">
        <div className="bg-[var(--bg-card)] border border-[var(--border-default)] rounded-md p-5 shadow-subtle hover:shadow-medium transition-all">
          <p className="font-headline font-semibold">Card 1</p>
          <p className="text-sm text-[var(--text-secondary)] mt-1">Shadow subtle, rounded-md</p>
        </div>

        <div className="bg-[var(--bg-card)] border border-[var(--border-default)] rounded-lg p-5 shadow-subtle hover:shadow-medium transition-all">
          <p className="font-headline font-semibold">Card 2</p>
          <p className="text-sm text-[var(--text-secondary)] mt-1">Shadow subtle, rounded-lg</p>
        </div>

        <div className="bg-[var(--bg-card)] border border-[var(--border-default)] rounded-xl p-5 shadow-subtle hover:shadow-medium transition-all">
          <p className="font-headline font-semibold">Card 3</p>
          <p className="text-sm text-[var(--text-secondary)] mt-1">Shadow subtle, rounded-xl</p>
        </div>
      </div>

      {/* Buttons — test primary colors di kedua mode */}
      <div className="flex gap-4 mt-8">
        <button className="bg-primary hover:bg-primary-hover text-white font-headline font-semibold px-5 py-2.5 rounded-md transition-colors">
          Primary Button
        </button>

        <button className="bg-transparent border-2 border-primary text-primary hover:bg-primary-light font-headline font-semibold px-5 py-2.5 rounded-md transition-colors">
          Secondary Button
        </button>

        <button className="bg-[var(--surface-muted)] border border-[var(--border-default)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] font-headline font-semibold px-5 py-2.5 rounded-md transition-colors">
          Ghost Button
        </button>
      </div>

      {/* Status Chips */}
      <div className="flex gap-3 mt-8">
        <span className="bg-success/10 text-success border border-success/20 text-sm font-semibold px-3 py-1 rounded-sm">
          On Track
        </span>
        <span className="bg-warning/10 text-warning border border-warning/20 text-sm font-semibold px-3 py-1 rounded-sm">
          At Risk
        </span>
        <span className="bg-error/10 text-error border border-error/20 text-sm font-semibold px-3 py-1 rounded-sm">
          Over Budget
        </span>
      </div>

      {/* Mono font test */}
      <div className="mt-8 bg-[var(--surface-muted)] border border-[var(--border-default)] p-4 rounded-md">
        <code className="font-mono text-sm text-[var(--text-secondary)]">
          Ticket ID: #TKT-2026-001 — font mono (Source Code Pro)
        </code>
      </div>

      {/* Info box */}
      <div className="mt-8 bg-info/10 border border-info/20 p-4 rounded-md">
        <p className="text-info text-sm font-semibold">💡 Tip: Klik toggle di kanan atas untuk switch Light / Dark / System mode</p>
      </div>
    </div>
  );
}
