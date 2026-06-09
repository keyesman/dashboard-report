// =============================================================================
// prisma/seed.ts
// Database seeder — isi data awal yang dibutuhkan app
//
// Prisma v7 membutuhkan driver adapter (pg) untuk koneksi ke PostgreSQL
//
// Cara jalankan: npx prisma db seed
// =============================================================================

import 'dotenv/config'
import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import bcrypt from 'bcryptjs'

// ===========================================================================
// SETUP PRISMA CLIENT DENGAN PG ADAPTER (Prisma v7)
// ===========================================================================
const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! })
const prisma  = new PrismaClient({ adapter })

async function main() {
  console.log('🌱 Starting database seed...')

  // ===========================================================================
  // SEED: Default Admin User
  // ===========================================================================
  const existingAdmin = await prisma.user.findUnique({
    where: { email: 'admin@dashboard.com' },
  })

  if (!existingAdmin) {
    const hashedPassword = await bcrypt.hash('Admin123!', 12)

    await prisma.user.create({
      data: {
        name        : 'Administrator',
        email       : 'admin@dashboard.com',
        passwordHash: hashedPassword,
        role        : 'admin',
        isActive    : true,
      },
    })

    console.log('✓ Admin user created: admin@dashboard.com / Admin123!')
  } else {
    console.log('⏭️  Admin user already exists, skipping.')
  }

  // ===========================================================================
  // SEED: Default Escalation Categories
  // ===========================================================================
  const defaultCategories = [
    'Action L2 - Bug System',
    'Action L2 - Human Error',
    'Action L2 - Eskalasi Management',
    'Action L2 - Pending Vendor',
    'Action L2 - Feature Request',
  ]

  for (const categoryName of defaultCategories) {
    await prisma.escalationCategory.upsert({
      where : { name: categoryName },
      update: {},
      create: { name: categoryName, isActive: true },
    })
  }

  console.log('✓ Escalation categories seeded.')
  console.log('🎉 Seed completed!')
}

main()
  .catch((e) => {
    console.error('✗ Seed failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
