// =============================================================================
// lib/prisma.ts
// Prisma Client singleton — satu instance untuk seluruh app
//
// Prisma v7 membutuhkan driver adapter (pg) untuk koneksi ke PostgreSQL
//
// Kenapa singleton?
// Di development, Next.js hot reload bisa bikin banyak instance Prisma Client
// yang menyebabkan "too many connections" error ke PostgreSQL.
// Singleton pattern memastikan hanya 1 instance yang aktif.
// =============================================================================

import { PrismaClient } from '@prisma/client'
import { PrismaPg }     from '@prisma/adapter-pg'

// ===========================================================================
// GLOBAL TYPE DECLARATION
// Extend NodeJS global type supaya TypeScript gak complain
// ===========================================================================
declare global {
  // eslint-disable-next-line no-var
  var prisma: PrismaClient | undefined
}

// ===========================================================================
// PRISMA CLIENT SINGLETON
// - Development : pakai global variable supaya survive hot reload
// - Production  : buat instance baru (gak ada hot reload)
// ===========================================================================

// Setup pg adapter dengan DATABASE_URL dari .env
const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL!
})

const prisma = global.prisma ?? new PrismaClient({
  adapter,
  log: process.env.NODE_ENV === 'development'
    ? ['error', 'warn'] // Log error & warning di development
    : ['error'],         // Log error only di production
})

if (process.env.NODE_ENV !== 'production') {
  // Simpan ke global supaya gak buat instance baru saat hot reload
  global.prisma = prisma
}

export default prisma
