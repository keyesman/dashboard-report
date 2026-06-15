// =============================================================================
// prisma.config.ts
// Prisma v7 configuration file
//
// NOTE: Prisma v7 belum support directUrl di config file
// Menggunakan DATABASE_URL untuk semua operasi
// Migration tetap berjalan via DATABASE_URL_DIRECT yang di-set manual
// =============================================================================

import 'dotenv/config'
import { defineConfig, env } from 'prisma/config'

export default defineConfig({
  schema: 'prisma/schema.prisma',

  migrations: {
    seed: 'npx tsx prisma/seed.ts',
  },

  datasource: {
    url: env('DATABASE_URL'),
  },
})
