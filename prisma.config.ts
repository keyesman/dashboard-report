// =============================================================================
// prisma.config.ts
// Prisma v7 configuration file
//
// PENTING: Prisma v7 TIDAK auto-load .env file.
// Harus import 'dotenv/config' secara explicit supaya DATABASE_URL terbaca.
// =============================================================================

import 'dotenv/config'
import { defineConfig, env } from 'prisma/config'

export default defineConfig({
  // Path ke schema file
  schema: 'prisma/schema.prisma',

  // ===========================================================================
  // MIGRATIONS CONFIG
  // Seed command — dijalankan via `npx prisma db seed`
  // Pakai ts-node untuk jalankan TypeScript seed file langsung
  // ===========================================================================
  migrations: {
    seed: 'npx ts-node --compiler-options {"module":"CommonJS"} prisma/seed.ts',
  },

  // Datasource — koneksi ke PostgreSQL
  datasource: {
    url: env('DATABASE_URL'),
  },
})
