# Dashboard Reporting Chatwoot (v2)

Dashboard reporting internal untuk monitoring dan analisis ticket L1 Support berbasis data dari Chatwoot.
Direfactor dari Python/Streamlit ke Next.js + TypeScript.

> 📚 Untuk dokumentasi teknis mendalam (data flow, skema database, API reference, dll), lihat [`TECHNICAL_DOCUMENTATION.md`](./TECHNICAL_DOCUMENTATION.md).

## Tech Stack

| Layer             | Technology                                |
|-------------------|-------------------------------------------|
| **Framework**     | Next.js 16 (App Router, TypeScript)       |
| **UI Library**    | React 19                                  |
| **Styling**       | Tailwind CSS v4 + BudgetZen Design System |
| **Database**      | PostgreSQL + Prisma ORM v7 (adapter `pg`) |
| **Auth**          | NextAuth.js v5 (JWT + Bcrypt)             |
| **Charts**        | Recharts                                  |
| **Table**         | TanStack Table v8                         |
| **Export**        | ExcelJS (file `.xlsx`)                    |
| **UI Components** | Custom (Radix UI primitives)              |
| **Notifikasi**    | Sonner (toast)                            |

## Features

- 🎫 **Tickets** — List, filter, export **Excel (.xlsx)**, input escalation manual
- 📈 **Analytics** — Chart volume, AVG FRT trend, breakdown by agent/service/type, top company
- ⚙️ **Settings** — Manage shift config, escalation categories, user management, sync
- 🔐 **Auth** — Login dengan JWT, role-based access (admin/leader/viewer)
- 🌙 **Dark Mode** — Light/dark/system theme toggle
- 🔄 **Sync** — Manual & auto (cron) sync data dari Chatwoot API

## Requirements

- Node.js v20+
- PostgreSQL 14+

## Setup & Installation

### 1. Clone repository

```bash
git clone https://github.com/keyesman/dashboard-report.git
cd dashboard-report
```

### 2. Install dependencies

```bash
npm install
```

> `npm install` otomatis menjalankan `prisma generate` (lewat script `postinstall`).

### 3. Setup environment

```bash
cp .env.example .env
# Edit .env dan isi credentials yang sesuai (lihat tabel di bawah)
```

### 4. Setup database

```bash
npx prisma migrate dev
npx prisma db seed
```

### 5. Jalankan development server

```bash
npm run dev
```

Buka [http://localhost:3000](http://localhost:3000)

## Environment Variables

Isi file `.env` dengan variabel berikut:

| Variable | Wajib | Keterangan |
|----------|:-----:|-----------|
| `DATABASE_URL` | ✓ | Connection string PostgreSQL (dipakai aplikasi & Prisma) |
| `DATABASE_URL_DIRECT` | opsional | Koneksi langsung untuk migrasi (bila pakai connection pooler) |
| `NEXTAUTH_SECRET` | ✓ | Secret untuk menandatangani JWT (generate: `openssl rand -base64 32`) |
| `CHATWOOT_BASE_URL` | ✓ | Base URL instance Chatwoot (mis. `https://app.chatwoot.com`) |
| `CHATWOOT_API_TOKEN` | ✓ | API access token Chatwoot |
| `CHATWOOT_ACCOUNT_ID` | ✓ | ID akun Chatwoot |
| `CRON_SECRET` | ✓ | Secret untuk memproteksi endpoint auto-sync cron |

## Available Scripts

| Script | Perintah | Fungsi |
|--------|----------|--------|
| `npm run dev` | `next dev` | Development server |
| `npm run build` | `prisma migrate deploy && next build` | Migrasi DB lalu build produksi |
| `npm run start` | `next start` | Menjalankan server produksi |
| `npm run lint` | `eslint` | Linting |
| `npx prisma db seed` | — | Mengisi data awal (admin + kategori escalation) |

## Project Structure

```
dashboard-report/
├── app/
│   ├── api/              # API Routes (analytics, auth, settings, sync, tickets)
│   ├── dashboard/        # Halaman terproteksi (overview, analytics, tickets, settings)
│   ├── login/            # Halaman login
│   ├── layout.tsx        # Root layout (fonts + providers)
│   └── globals.css       # Design tokens + Tailwind
├── components/
│   ├── layout/           # dashboard-layout, sidebar
│   └── ui/               # badge, button, card, data-table, dll
├── lib/
│   ├── auth.ts           # Konfigurasi NextAuth + helper hashing
│   ├── prisma.ts         # Prisma Client singleton
│   └── queries/          # Business logic (analytics, tickets, settings)
├── services/             # Integrasi Chatwoot (client, parser, sync)
├── prisma/               # schema.prisma, seed.ts, migrations/
└── middleware.ts         # Proteksi route
```

## Default Login

| Field | Value |
|-------|-------|
| Email | admin@dashboard.com |
| Password | Admin123! |

> ⚠️ Ganti password setelah pertama kali login!

## Roles & Akses

| Role | Tickets | Analytics | Escalation | Settings | User Mgmt |
|------|:-------:|:---------:|:----------:|:--------:|:---------:|
| admin | ✓ | ✓ | ✓ | ✓ | ✓ |
| leader | ✓ | ✓ | ✓ | ✓ Shift only | ✗ |
| viewer | ✓ | ✓ | ✗ | ✗ | ✗ |

## Sync Data dari Chatwoot

### Manual Sync (dari Settings page)

Buka **Settings → tab "Sync Data"**, pilih date range, lalu klik tombol sync.
Hanya bisa diakses oleh role **admin** dan **leader**. Riwayat sync ditampilkan di bawah panel.

### Auto Sync via Cron

- **Endpoint:** `GET /api/sync/cron`
- **Header:** `x-cron-secret: YOUR_CRON_SECRET`
- **Default:** men-sync data H-1 (kemarin) bila tanpa parameter tanggal.

Contoh setup dengan crontab (setiap hari jam 09:00):

```bash
0 9 * * * curl -s -H "x-cron-secret: YOUR_CRON_SECRET" https://your-domain.com/api/sync/cron
```

## Production Build

```bash
npm run build   # menjalankan prisma migrate deploy lalu next build
npm run start   # menjalankan server produksi
```
