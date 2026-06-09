// =============================================================================
// app/page.tsx
// Halaman temporary untuk test BudgetZen design system
// Nanti akan diganti dengan Dashboard home page
// =============================================================================

export default function Home() {
  return (
    <div className="min-h-screen bg-background p-10">
      {/* Heading — test font Manrope */}
      <h1 className="font-headline text-3xl font-bold text-stone-text">
        ✓ BudgetZen Design System Active
      </h1>

      {/* Body text — test font Nunito */}
      <p className="font-body text-body text-stone-secondary mt-4">
        Ini test paragraph pakai font Nunito dan warna stone-secondary.
      </p>

      {/* Cards — test colors, shadow, radius */}
      <div className="flex gap-4 mt-8">
        <div className="bg-surface border border-stone-border rounded-md p-5 shadow-subtle hover:shadow-medium transition-shadow">
          <p className="font-headline font-semibold text-stone-text">Card 1</p>
          <p className="text-sm text-neutral mt-1">Shadow subtle, rounded-md</p>
        </div>

        <div className="bg-surface border border-stone-border rounded-lg p-5 shadow-subtle hover:shadow-medium transition-shadow">
          <p className="font-headline font-semibold text-stone-text">Card 2</p>
          <p className="text-sm text-neutral mt-1">Shadow subtle, rounded-lg</p>
        </div>
      </div>

      {/* Buttons — test primary & secondary */}
      <div className="flex gap-4 mt-8">
        <button className="bg-primary hover:bg-primary-hover text-white font-headline font-semibold px-5 py-2.5 rounded-md transition-colors">
          Primary Button
        </button>

        <button className="bg-transparent border-2 border-primary text-primary hover:bg-primary-light font-headline font-semibold px-5 py-2.5 rounded-md transition-colors">
          Secondary Button
        </button>
      </div>

      {/* Status Chips — test semantic colors */}
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
      <div className="mt-8 bg-stone-surface p-4 rounded-md">
        <code className="font-mono text-sm text-stone-secondary">
          Ticket ID: #TKT-2026-001 — font mono (Source Code Pro)
        </code>
      </div>
    </div>
  );
}
