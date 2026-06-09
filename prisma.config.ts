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

  // Datasource — koneksi ke PostgreSQL
  // URL diambil dari .env file (DATABASE_URL)
  datasource: {
    url: env('DATABASE_URL'),
  },
})
