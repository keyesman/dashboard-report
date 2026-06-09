// =============================================================================
// lib/auth.ts
// Authentication helper functions + NextAuth v5 configuration
//
// Berisi:
// - hashPassword   : Hash plain text password dengan bcrypt
// - verifyPassword : Verifikasi password vs hash
// - authOptions    : NextAuth v5 configuration
// =============================================================================

import bcrypt from "bcryptjs";
import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import prisma from "@/lib/prisma";

// ===========================================================================
// BCRYPT SALT ROUNDS
// 12 adalah sweet spot antara keamanan & performa
// ===========================================================================
const SALT_ROUNDS = 12;

/**
 * Hash plain text password menggunakan bcrypt
 * @param password - Plain text password
 * @returns Hashed password string
 */
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS);
}

/**
 * Verifikasi plain text password terhadap hash yang tersimpan di DB
 * @param password - Plain text password dari form login
 * @param hash     - Hashed password dari database
 * @returns true kalau match, false kalau tidak
 */
export async function verifyPassword(
  password: string,
  hash: string
): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

// ===========================================================================
// NEXTAUTH v5 CONFIG
// ===========================================================================
export const { handlers, auth, signIn, signOut } = NextAuth({
  // Secret untuk sign JWT
  secret: process.env.NEXTAUTH_SECRET,

  // Custom login page
  pages: {
    signIn: "/login",
  },

  // Session strategy
  session: {
    strategy: "jwt",
    maxAge  : 8 * 60 * 60, // 8 jam
  },

  // ===========================================================================
  // PROVIDERS — Credentials (email + password)
  // ===========================================================================
  providers: [
    Credentials({
      credentials: {
        email   : { label: "Email",    type: "email"    },
        password: { label: "Password", type: "password" },
      },

      // Fungsi authorize — dipanggil saat user submit form login
      async authorize(credentials) {
        // Validasi input
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        // Cari user di database
        const user = await prisma.user.findUnique({
          where: { email: credentials.email as string },
        });

        // User tidak ditemukan
        if (!user) return null;

        // User dinonaktifkan
        if (!user.isActive) return null;

        // Verifikasi password
        const isValid = await verifyPassword(
          credentials.password as string,
          user.passwordHash
        );

        if (!isValid) return null;

        // Update last login
        await prisma.user.update({
          where: { id: user.id },
          data : { lastLoginAt: new Date() },
        });

        // Return user — masuk ke JWT token
        return {
          id   : String(user.id),
          name : user.name,
          email: user.email,
          role : user.role,
        };
      },
    }),
  ],

  // ===========================================================================
  // CALLBACKS — Tambahkan role ke token & session
  // ===========================================================================
  callbacks: {
    // Tambahkan role & id ke JWT token
    async jwt({ token, user }) {
      if (user) {
        token.id   = user.id;
        token.role = (user as { role?: string }).role;
      }
      return token;
    },

    // Expose role & id dari token ke session
    async session({ session, token }) {
      if (session.user) {
        (session.user as { id?: string }).id     = token.id as string;
        (session.user as { role?: string }).role = token.role as string;
      }
      return session;
    },
  },
});
