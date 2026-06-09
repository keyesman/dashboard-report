// =============================================================================
// middleware.ts
// Route protection middleware — jalan di setiap request sebelum page di-render
//
// PENTING: Middleware jalan di Edge Runtime (bukan Node.js)
// Jadi TIDAK bisa import Prisma / pg / bcrypt di sini
// Pakai NextAuth middleware helper langsung (tanpa custom auth config)
//
// Rules:
// - Route /dashboard/* → wajib login, redirect ke /login kalau belum
// - Route /login       → redirect ke /dashboard kalau sudah login
// =============================================================================

import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Ambil JWT token dari cookie — gak perlu koneksi DB
  const token = await getToken({
    req,
    secret: process.env.NEXTAUTH_SECRET,
  });

  const isLoggedIn = !!token;

  // ===========================================================================
  // PROTECTED ROUTES — /dashboard/* butuh login
  // ===========================================================================
  const isProtectedRoute = pathname.startsWith("/dashboard");

  if (isProtectedRoute && !isLoggedIn) {
    // Belum login → redirect ke login page
    const loginUrl = new URL("/login", req.nextUrl.origin);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // ===========================================================================
  // AUTH ROUTES — /login redirect ke dashboard kalau sudah login
  // ===========================================================================
  const isAuthRoute = pathname.startsWith("/login");

  if (isAuthRoute && isLoggedIn) {
    // Sudah login → redirect ke dashboard
    return NextResponse.redirect(new URL("/dashboard", req.nextUrl.origin));
  }

  return NextResponse.next();
}

// ===========================================================================
// MATCHER — Route mana yang dijalankan middleware ini
// Exclude: static files, API auth routes, images
// ===========================================================================
export const config = {
  matcher: [
    "/((?!api/auth|_next/static|_next/image|favicon.ico).*)",
  ],
};
