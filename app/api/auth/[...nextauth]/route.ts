// =============================================================================
// app/api/auth/[...nextauth]/route.ts
// NextAuth v5 API route handler
//
// Route ini menangani semua request auth:
// - POST /api/auth/signin  : Login
// - POST /api/auth/signout : Logout
// - GET  /api/auth/session : Get session
// =============================================================================

import { handlers } from "@/lib/auth";

// Export GET & POST handler dari NextAuth v5
export const { GET, POST } = handlers;
