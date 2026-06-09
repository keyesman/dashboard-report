// =============================================================================
// app/page.tsx
// Root page — redirect ke dashboard
// Middleware akan handle redirect ke login kalau belum authenticated
// =============================================================================

import { redirect } from "next/navigation";

export default function RootPage() {
  // Redirect ke dashboard — middleware akan handle auth check
  redirect("/dashboard");
}
