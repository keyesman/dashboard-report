# Dashboard Reporting Chatwoot (v2)

Dashboard reporting internal untuk monitoring dan analisis ticket L1 Support berbasis data dari Chatwoot.
Direfactor dari Python/Streamlit ke Next.js + TypeScript.

## Tech Stack

| Layer             | Technology                                |
|-------------------|-------------------------------------------|
| **Framework**     | Next.js 15+ (App Router, TypeScript)      |
| **Styling**       | Tailwind CSS v4 + BudgetZen Design System |
| **Database**      | PostgreSQL + Prisma ORM v7                |
| **Auth**          | NextAuth.js v5 (JWT + Bcrypt)             |
| **Charts**        | Recharts                                  |
| **Table**         | TanStack Table v8                         |
| **UI Components** | Custom (Radix UI primitives)              |

## Features

- 🎫 **Tickets** — List, filter, export CSV, input escalation
- 📈 **Analytics** — Chart volume, AVG FRT trend, breakdown by agent/service/type
- ⚙️ **Settings** — Manage shift config, escalation categories, user management
- 🔐 **Auth** — Login dengan JWT, role-based access (admin/leader/viewer)
- 🌙 **Dark Mode** — Light/dark/system theme toggle
- 🔄 **Sync** — Manual & auto sync data dari Chatwoot API

## Requirements

- Node.js v20+
- PostgreSQL 14+

## Setup & Installation

### 1. Clone repository
git clone https://github.com/keyesman/dashboard-report.git
cd dashboard-report

### 2. Install dependencies
npm install

### 3. Setup environment
cp .env.example .env
# Edit .env dan isi credentials yang sesuai

### 4. Setup database
npx prisma migrate dev
npx prisma db seed

### 5. Jalankan development server
npm run dev

Buka http://localhost:3000

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
Akan kita tambahkan di halaman Settings — tombol sync dengan date range picker.

### Auto Sync via Cron
Endpoint: `GET /api/sync/cron`
Header: `x-cron-secret: YOUR_CRON_SECRET`

Contoh setup dengan cron (setiap hari jam 09:00):
