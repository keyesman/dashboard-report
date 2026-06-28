# Dokumentasi Teknis — Dashboard Reporting Chatwoot (v2)

> Dashboard reporting internal untuk monitoring & analisis ticket **L1 Support** berbasis data dari **Chatwoot**.
> Direfactor dari versi lama (Python/Streamlit) ke **Next.js + TypeScript**.

---

## Daftar Isi

1. [Ringkasan Project](#1-ringkasan-project)
2. [Tech Stack](#2-tech-stack)
3. [Dependencies](#3-dependencies)
4. [Struktur Folder](#4-struktur-folder)
5. [Konfigurasi & Environment Variables](#5-konfigurasi--environment-variables)
6. [Arsitektur & Data Flow](#6-arsitektur--data-flow)
7. [Database Layer (Prisma)](#7-database-layer-prisma)
8. [Authentication & Authorization](#8-authentication--authorization)
9. [Service Layer (Integrasi Chatwoot)](#9-service-layer-integrasi-chatwoot)
10. [Query Layer (Business Logic)](#10-query-layer-business-logic)
11. [API Reference](#11-api-reference)
12. [Frontend — Pages](#12-frontend--pages)
13. [Frontend — UI Components](#13-frontend--ui-components)
14. [Design System (BudgetZen)](#14-design-system-budgetzen)
15. [Setup & Deployment](#15-setup--deployment)

---

## 1. Ringkasan Project

Aplikasi web internal yang menarik (sync) data percakapan/ticket dari **Chatwoot API**, menyimpannya ke **PostgreSQL**, lalu menyajikannya dalam bentuk:

- **Tickets** — daftar ticket lengkap dengan filter, export Excel, dan input escalation manual.
- **Analytics** — chart volume, tren AVG FRT (First Response Time), breakdown per agent/service/type, top company, dll.
- **Settings** — manajemen shift kerja, kategori escalation, user, dan trigger sync.

Akses dikontrol berdasarkan **role** (admin / leader / viewer) dan dilindungi **autentikasi JWT**.

| Tujuan | Keterangan |
|--------|-----------|
| Domain | Internal support reporting (L1) |
| Sumber data | Chatwoot API (conversations + messages) |
| Pola | Sync periodik → simpan ke DB → tampilkan & analisis |
| Pengguna | Tim support & leadership |

---

## 2. Tech Stack

| Layer | Teknologi | Versi |
|-------|-----------|-------|
| Framework | Next.js (App Router) | 16.2.7 |
| Library UI | React | 19.2.4 |
| Bahasa | TypeScript | ^5 |
| Styling | Tailwind CSS | v4 (`@tailwindcss/postcss`) |
| Database | PostgreSQL | 14+ |
| ORM | Prisma | ^7.8 (+ `@prisma/adapter-pg`) |
| Driver DB | `pg` | ^8.21 |
| Auth | NextAuth.js | 5.0.0-beta.31 (JWT) |
| Hashing | bcryptjs | ^3.0 (12 salt rounds) |
| Charts | Recharts | ^3.8 |
| Tabel | TanStack Table | ^8.21 |
| Export | ExcelJS | ^4.4 (file `.xlsx`) |
| Primitives | Radix UI | dialog, dropdown, select, slot, tabs, tooltip |
| Ikon | lucide-react | ^1.17 |
| Tema | next-themes | ^0.4 (dark/light/system) |
| Notifikasi | sonner | ^2.0 |
| Validasi | zod | ^4.4 |
| Date utils | date-fns, react-day-picker | ^4.4 / ^10.0 |

> **Catatan penting:** File `AGENTS.md` menyatakan versi Next.js ini punya **breaking changes** dibanding versi umum. Salah satu konsekuensinya: parameter dinamis route (`params`) berbentuk **Promise** dan harus di-`await`.

---

## 3. Dependencies

### Dependencies (runtime)

```
@prisma/adapter-pg, @prisma/client     → ORM + driver adapter PostgreSQL
@radix-ui/react-*                       → primitives aksesibel (dialog, dropdown, select, slot, tabs, tooltip)
@tanstack/react-table                   → tabel data (sort, pagination)
bcryptjs                                → hashing password
class-variance-authority (cva)          → manajemen varian style komponen
clsx + tailwind-merge                   → utility penggabungan className (cn)
date-fns, react-day-picker              → manipulasi & pemilihan tanggal
dotenv                                   → load env vars (untuk seed & prisma config)
exceljs                                  → generate file Excel export
lucide-react                            → ikon
next, react, react-dom                  → core framework
next-auth                               → autentikasi
next-themes                             → dark/light mode
pg                                       → PostgreSQL client
recharts                                → charting
sonner                                   → toast notification
zod                                      → schema validation
```

### DevDependencies

```
@tailwindcss/postcss, tailwindcss   → styling pipeline
@types/*                             → TypeScript types
eslint, eslint-config-next           → linting
prisma                               → CLI & migrations
typescript                           → compiler
```

### NPM Scripts

| Script | Perintah | Fungsi |
|--------|----------|--------|
| `dev` | `next dev` | Development server |
| `build` | `prisma migrate deploy && next build` | Migrasi DB lalu build |
| `start` | `next start` | Production server |
| `lint` | `eslint` | Linting |
| `postinstall` | `prisma generate` | Generate Prisma Client otomatis |

Seeding: `prisma db seed` (menjalankan `prisma/seed.ts` via `tsx`).

---

## 4. Struktur Folder

```
dashboard-report/
├── app/                          # Next.js App Router
│   ├── api/                      # API Routes (backend)
│   │   ├── analytics/            # 8 endpoint analytics
│   │   ├── auth/[...nextauth]/   # Handler NextAuth
│   │   ├── settings/             # escalation-categories, shifts, users
│   │   ├── sync/                 # sync manual, cron, logs
│   │   └── tickets/              # tickets, escalation, filter-options
│   ├── dashboard/                # Halaman terproteksi
│   │   ├── page.tsx              # Overview
│   │   ├── analytics/page.tsx    # Analytics
│   │   ├── tickets/page.tsx      # Tickets
│   │   └── settings/page.tsx     # Settings
│   ├── login/page.tsx            # Halaman login
│   ├── layout.tsx                # Root layout (fonts + providers)
│   ├── providers.tsx             # Session + Theme + Toaster
│   ├── page.tsx                  # Redirect ke /dashboard
│   └── globals.css               # Design tokens + Tailwind
├── components/
│   ├── layout/                   # dashboard-layout, sidebar
│   └── ui/                       # badge, button, card, data-table, input,
│                                 #   metric-card, select, theme-toggle, toast
├── lib/
│   ├── auth.ts                   # NextAuth config + helper hashing
│   ├── prisma.ts                 # Prisma Client singleton
│   ├── utils.ts                  # cn() helper
│   └── queries/                  # analytics.ts, tickets.ts, settings.ts
├── services/
│   ├── chatwoot.ts               # Client Chatwoot API
│   ├── chatwoot-parser.ts        # Parser raw data → format DB
│   └── sync-service.ts           # Orkestrasi sync
├── prisma/
│   ├── schema.prisma             # Skema database
│   ├── seed.ts                   # Data awal
│   └── migrations/               # 4 migrasi
├── middleware.ts                 # Proteksi route (Edge)
├── prisma.config.ts              # Konfigurasi Prisma v7
├── next.config.ts
├── tsconfig.json                 # Path alias @/* → ./
└── package.json
```

---

## 5. Konfigurasi & Environment Variables

| Variable | Dipakai di | Keterangan |
|----------|-----------|-----------|
| `DATABASE_URL` | `lib/prisma.ts`, `prisma.config.ts`, `seed.ts` | Connection string PostgreSQL |
| `DATABASE_URL_DIRECT` | migration (manual) | Koneksi langsung untuk migrasi |
| `NEXTAUTH_SECRET` | `lib/auth.ts`, `middleware.ts` | Secret penandatangan JWT |
| `CHATWOOT_BASE_URL` | `services/chatwoot.ts` | Base URL instance Chatwoot |
| `CHATWOOT_API_TOKEN` | `services/chatwoot.ts` | Token API (`api_access_token`) |
| `CHATWOOT_ACCOUNT_ID` | `services/chatwoot.ts` | ID akun Chatwoot |
| `CRON_SECRET` | `app/api/sync/cron/route.ts` | Proteksi endpoint cron (`x-cron-secret`) |
| `NODE_ENV` | beberapa | Mempengaruhi level log & singleton Prisma |

**Konfigurasi lain:**
- `tsconfig.json`: alias `@/*` → root project; `strict: true`; target ES2017.
- `prisma.config.ts`: Prisma v7 — schema `prisma/schema.prisma`, datasource dari `env('DATABASE_URL')`, seed via `npx tsx`.
- `postcss.config.mjs`: plugin `@tailwindcss/postcss`.

---

## 6. Arsitektur & Data Flow

### Arsitektur tingkat tinggi

```
┌───────────────┐   sync    ┌──────────────────┐   write   ┌──────────────┐
│  Chatwoot API │ ────────▶ │  Service Layer   │ ────────▶ │  PostgreSQL  │
│ (conversations│           │ (fetch + parse)  │           │  (Prisma)    │
│  + messages)  │           └──────────────────┘           └──────┬───────┘
└───────────────┘                                                 │ read
                                                                  ▼
┌───────────────┐  fetch    ┌──────────────────┐   query   ┌──────────────┐
│  Browser (UI) │ ◀───────▶ │   API Routes     │ ────────▶ │ Query Layer  │
│ React + Charts│   JSON    │ (auth + routing) │           │ (lib/queries)│
└───────────────┘           └──────────────────┘           └──────────────┘
```

### Alur 1 — Sync data dari Chatwoot (write path)

1. **Trigger**: manual via `POST /api/sync` (admin/leader) **atau** otomatis via `GET /api/sync/cron` (header `x-cron-secret`).
2. `runSync()` membuat record `SyncLog` berstatus `running`.
3. `getAllConversations(dateFrom, dateTo)` mengulang status `[open, resolved, pending, snoozed]`, fetch terpaginasi dengan **early-stop** saat semua data di sebuah page lebih tua dari `dateFrom`.
4. Untuk setiap conversation → `getMessages(id)` lalu `buildConversation()` mem-parsing label, FRT, resolution time, CSAT, notes, customer info.
5. **Upsert** ke tabel `conversations` berdasarkan `ticketId` (field escalation manual **tidak** ditimpa saat update).
6. `SyncLog` di-update menjadi `success` (+ `totalSynced`) atau `failed` (+ `errorMsg`). Error per-ticket dicatat tetapi sync tetap lanjut.

### Alur 2 — Menampilkan data (read path)

1. Browser memanggil API route (mis. `GET /api/tickets?...` atau `GET /api/analytics/metrics?...`).
2. Route memvalidasi sesi via `auth()` (401 jika tidak ada), dan role untuk operasi tertentu (403).
3. Route memanggil fungsi di `lib/queries/*`, yang mengambil data via Prisma dan melakukan agregasi **di level aplikasi (JavaScript)**, bukan SQL.
4. Tanggal diserialisasi ke string ISO, dikembalikan sebagai JSON.
5. Komponen React me-render tabel/chart (Recharts, TanStack Table).

### Alur 3 — Autentikasi

1. User submit email+password di `/login` → `signIn("credentials", ...)`.
2. `authorize()` mencari user, cek `isActive`, verifikasi bcrypt, update `lastLoginAt`.
3. JWT dibuat (berlaku 8 jam) berisi `id` + `role`.
4. `middleware.ts` (Edge Runtime) mengecek token di tiap request: `/dashboard/*` butuh login; `/login` dialihkan ke dashboard jika sudah login.

---

## 7. Database Layer (Prisma)

- **Koneksi**: Prisma v7 + driver adapter `PrismaPg` (paket `@prisma/adapter-pg`), preview feature `driverAdapters`.
- **Singleton** (`lib/prisma.ts`): satu instance global untuk mencegah error "too many connections" saat hot-reload di development.
- Semua model dipetakan ke nama tabel `snake_case` melalui `@@map`.

### Model: `User` → tabel `users`

| Field | Tipe | Catatan |
|-------|------|---------|
| id | Int (PK, autoincrement) | |
| name | String | Nama tampilan |
| email | String (unique) | Untuk login |
| passwordHash | String | Bcrypt hash (`password_hash`) |
| role | String (default `viewer`) | `admin` \| `leader` \| `viewer` |
| isActive | Boolean (default true) | `is_active` — false = tak bisa login |
| lastLoginAt | DateTime? | `last_login_at` |
| createdAt / updatedAt | DateTime | |

### Model: `Conversation` → tabel `conversations` (tabel utama)

| Field | Tipe | Catatan |
|-------|------|---------|
| id | Int (PK) | |
| ticketId | Int (unique) | ID dari Chatwoot (`ticket_id`) |
| createdAt | DateTime | Waktu ticket dibuat di Chatwoot |
| status | String | open \| resolved \| pending \| snoozed |
| agent | String? | Nama agent (assignee) |
| service | String? | Hasil parse label `2_xxx` |
| priority | String? | P1–P4 |
| escalate | String? | L1 \| L2 |
| type | String? | Bug, Human Error, Question, dll |
| rawLabels | String? | Label asli (CSV) |
| frtSeconds | Int? | First Response Time (detik) |
| resolutionTimeSeconds | Int? | Resolution time (detik) |
| resolveCount | Int (default 0) | Berapa kali di-resolve |
| isReopened | Boolean (default false) | true bila `resolveCount > 1` |
| lastNote | String? | Private note terakhir |
| company / customer / phone | String? | Info customer |
| csatRating | Int? | 1–5 |
| csatFeedback | String? | Teks feedback |
| subject / rootCause / resolution | String? | Hasil parse note berprefix |
| source | String? | Whatsapp/Teams/Slack/Email/Chatwoot |
| escalationNote | String? | Input manual |
| escalationCategory | String? | Input manual |
| escalationUpdatedBy | Int? | user_id yang update |
| escalationUpdatedAt | DateTime? | |
| updatedAt | DateTime | |

### Model: `ShiftConfig` → tabel `shift_config`

| Field | Tipe | Catatan |
|-------|------|---------|
| id | Int (PK) | |
| shiftName | String | Pagi, Siang, Malam, dll |
| startTime / endTime | String | Format `HH:MM` |
| priorityOrder | Int | Penentu pemenang saat overlap (kecil = prioritas tinggi) |
| isActive | Boolean | |

### Model: `EscalationCategory` → tabel `escalation_categories`

| Field | Tipe |
|-------|------|
| id | Int (PK) |
| name | String (unique) |
| isActive | Boolean (default true) |

### Model: `SyncLog` → tabel `sync_log`

| Field | Tipe | Catatan |
|-------|------|---------|
| id | Int (PK) | |
| syncType | String | `cron` \| `manual` |
| dateFrom / dateTo | String | Range `YYYY-MM-DD` |
| totalSynced | Int (default 0) | |
| status | String (default `running`) | running \| success \| failed |
| errorMsg | String? | |
| startedAt / finishedAt | DateTime / DateTime? | |

### Migrasi
`20260609050738_init` → `20260617101122_add_csat_fields` → `20260627111509_add_notes_fields` → `20260627123617_add_source_field`.

### Seed (`prisma/seed.ts`)
- Membuat admin default: `admin@dashboard.com` / `Admin123!` (bcrypt, 12 rounds) bila belum ada.
- Upsert 5 kategori escalation default: *Action L2 - Bug System, Human Error, Eskalasi Management, Pending Vendor, Feature Request*.

---

## 8. Authentication & Authorization

### `lib/auth.ts` (NextAuth v5)
- **Provider**: Credentials (email + password).
- **Strategi sesi**: JWT, `maxAge` = 8 jam.
- **Helper**: `hashPassword()` & `verifyPassword()` (bcrypt, 12 salt rounds).
- **`authorize()`**: validasi input → cari user → cek `isActive` → verifikasi password → update `lastLoginAt` → kembalikan `{id, name, email, role}`.
- **Callbacks**: `jwt` menambahkan `id` + `role` ke token; `session` mengekspos keduanya ke `session.user`.
- **Halaman login** kustom: `/login`.

### `middleware.ts` (Edge Runtime)
- Membaca token via `getToken()` (tanpa koneksi DB — Prisma/bcrypt tidak boleh di Edge).
- `/dashboard/*` tanpa login → redirect ke `/login?callbackUrl=...`.
- `/login` saat sudah login → redirect ke `/dashboard/analytics`.
- **Matcher** mengecualikan `api/auth`, `_next/static`, `_next/image`, `favicon.ico`.

### Matriks Role

| Role | Tickets | Analytics | Escalation | Settings | User Mgmt |
|------|:------:|:--------:|:----------:|:--------:|:---------:|
| admin | ✓ | ✓ | ✓ | ✓ | ✓ |
| leader | ✓ | ✓ | ✓ | Shift saja | ✗ |
| viewer | ✓ | ✓ | ✗ | ✗ | ✗ |

Penegakan: API routes memanggil `auth()` (401 bila tak ada sesi) dan mengecek `role` untuk operasi tulis (403). Di frontend, sidebar menyembunyikan menu sesuai role, dan halaman Settings menendang `viewer` keluar.

---

## 9. Service Layer (Integrasi Chatwoot)

### `services/chatwoot.ts` — Client API
- `getApiConfig()` — membaca env Chatwoot; melempar error bila kurang.
- `getConversationsByStatus(status, dateFrom, dateTo)` — fetch terpaginasi (`page=n`), header `api_access_token`. Memfilter berdasarkan tanggal dan **berhenti** ketika seluruh data di sebuah page lebih tua dari `dateFrom`.
- `getAllConversations(dateFrom, dateTo)` — looping status `[open, resolved, pending, snoozed]`, lalu sort dari terbaru.
- `getMessages(conversationId)` — ambil seluruh message dari 1 conversation.

### `services/chatwoot-parser.ts` — Transformasi data
- **`parseLabels(labels)`** — konvensi label:
  - `2_xxx` → **service** (mis. `2_billing` → "Billing")
  - `3_xxx` → **company**
  - `urgent`, `p1`–`p4` → **priority**
  - `l1`, `l2` → **escalate**
  - `10_xxx` → **type** via `TYPE_MAPPING` (`bug`→Bug, `he`→Human Error, `others_issue`, `question`, `req`→Request, `system_code_issue`)
  - `4_xxx` → **source** via `SOURCE_MAPPING` (`wag`→Whatsapp, `teams`, `slack`, `email`, `chatwoot`)
- **`parseFrt(conv)`** = `first_reply_created_at − created_at` (detik).
- **`parseResolutionTime(messages, createdAt)`** = timestamp activity message "resolved" terakhir − created_at.
- **`parseResolveCount(messages)`** = jumlah activity message mengandung "resolved".
- **`parseLastNote(messages)`** = private note terakhir.
- **`parseNotes(messages)`** = regex untuk `Case Subject :`, `Root Cause :`, `Resolution :` (ambil yang terbaru).
- **`parseCustomerInfo(conv)`** = dari `meta.sender` (company_name, name, phone_number).
- **`parseCsat(messages)`** = dari message `content_type === "input_csat"` (rating + feedback).
- **`buildConversation(conv, messages)`** = menggabungkan semua menjadi objek siap simpan; `isReopened = resolveCount > 1`.

### `services/sync-service.ts` — Orkestrasi
- `runSync({dateFrom, dateTo, syncType})`:
  1. Buat `SyncLog` (`running`).
  2. `getAllConversations()` → loop conversation.
  3. Per conversation: `getMessages()` + `buildConversation()` → **upsert** (`update` mengecualikan field escalation manual).
  4. Update `SyncLog` `success`/`failed`; kembalikan `{ success, totalSynced, errorMsg? }`.

---

## 10. Query Layer (Business Logic)

> Catatan: seluruh agregasi/grouping dilakukan **di level aplikasi (JavaScript)** setelah `findMany`, bukan via SQL aggregate. Rentang tanggal dievaluasi `00:00:00.000Z` – `23:59:59.999Z`.

### `lib/queries/analytics.ts`
| Fungsi | Output | Kegunaan |
|--------|--------|----------|
| `getDailyVolume({dateFrom,dateTo})` | `{date, ticketCreated, ticketSolved}[]` | Line/bar volume harian |
| `getAvgMetrics({...})` | total, resolved, backlog, avgFrtSeconds, avgRtSeconds, ticketsWithFrt, csatCount, csatPercentage | Metric cards |
| `getDailyAvgFrt({...})` | `{date, avgFrtMinutes}[]` | Tren FRT harian (menit) |
| `getBreakdownBy({...}, field)` | `{label, total}[]` | Breakdown by `agent\|service\|type\|priority\|escalate` |
| `getAvailableYears()` | `number[]` | Dropdown tahun |
| `getMonthlyVolume(year)` | `{month, monthLabel, total}[]` | Bar volume bulanan (label ID: Jan–Des) |
| `getMonthOverMonthChange(year, month)` | total bulan ini vs lalu, `changePercent`, `direction` | Mendukung lintas tahun (Jan vs Des) |
| `getMonthlyVolumeByService(year)` | `{month, monthLabel, services{}, total}[]` | Stacked bar per service |
| `getTopCompanies({...})` | Top 10 `{rank, company, total}` | **Filter khusus**: kecualikan company `ICUBE`, hanya `escalate = L2`, dan `service ≠ Shopify` |

### `lib/queries/tickets.ts`
- `getTickets(filters)` — filter wajib date range + opsional `agent/service/priority/escalate/status`; urut `createdAt desc`.
- `getFilterOptions()` — distinct values (agents, services, priorities, escalates, statuses) secara paralel.
- `updateEscalation({ticketId, escalationNote, escalationCategory, updatedBy})` — set note/category + `updatedBy`/`updatedAt`.

### `lib/queries/settings.ts`
- **Shift**: `getShifts`, `addShift`, `toggleShift`, `deleteShift`.
- **Escalation Category**: `getEscalationCategories(activeOnly?)`, `addEscalationCategory`, `toggleEscalationCategory`.
- **User**: `getUsers` (tanpa hash), `addUser` (hash password), `toggleUser`, `resetPassword` (hash baru).

---

## 11. API Reference

> Semua endpoint memerlukan sesi login (mengembalikan **401** jika tidak ada), kecuali endpoint cron yang dilindungi header rahasia. Operasi tulis menambahkan pengecekan role (**403** jika tidak berwenang). Parameter dinamis route berupa Promise (Next.js 16).

### Analytics (semua `GET`)
| Endpoint | Query Params | Respons |
|----------|-------------|---------|
| `/api/analytics/available-years` | — | `number[]` |
| `/api/analytics/volume` | `dateFrom`, `dateTo` | Volume harian |
| `/api/analytics/metrics` | `dateFrom`, `dateTo` | Summary metrics |
| `/api/analytics/frt-trend` | `dateFrom`, `dateTo` | Tren AVG FRT |
| `/api/analytics/breakdown` | `dateFrom`, `dateTo`, `field` | Breakdown (field divalidasi; **400** bila invalid) |
| `/api/analytics/mom-change` | `year`, `month` | Month-over-month change |
| `/api/analytics/monthly-volume` | `year`, `breakdown=service?` | Volume bulanan (total atau per-service) |
| `/api/analytics/top-companies` | `dateFrom`, `dateTo` | Top 10 company |

### Auth
| Endpoint | Method | Keterangan |
|----------|--------|-----------|
| `/api/auth/[...nextauth]` | GET, POST | Handler NextAuth (signin, signout, session) |

### Tickets
| Endpoint | Method | Role | Keterangan |
|----------|--------|------|-----------|
| `/api/tickets` | GET | login | Filter `dateFrom/dateTo/agent/service/priority/escalate/status` (default tanggal = hari ini) |
| `/api/tickets/filter-options` | GET | login | Distinct values untuk dropdown |
| `/api/tickets/escalation` | POST | admin, leader | Body `{ticketId, escalationNote, escalationCategory}`; `updatedBy` diambil dari sesi |

### Settings
| Endpoint | Method | Role | Keterangan |
|----------|--------|------|-----------|
| `/api/settings/shifts` | GET | login | Daftar shift |
| `/api/settings/shifts` | POST | admin, leader | Tambah shift |
| `/api/settings/shifts/[id]` | DELETE | admin, leader | Hapus shift |
| `/api/settings/shifts/[id]/toggle` | PATCH | admin, leader | Aktif/nonaktif shift |
| `/api/settings/escalation-categories` | GET | login | Param `activeOnly=true?` |
| `/api/settings/escalation-categories` | POST | admin | Tambah (**409** bila duplikat) |
| `/api/settings/escalation-categories/[id]/toggle` | PATCH | admin | Aktif/nonaktif |
| `/api/settings/users` | GET | admin | Daftar user (tanggal diserialisasi) |
| `/api/settings/users` | POST | admin | Tambah user (**409** bila email ada) |
| `/api/settings/users/[id]/toggle` | PATCH | admin | Aktif/nonaktif user |
| `/api/settings/users/[id]/reset-password` | PATCH | admin | Body `{newPassword}` (min 8 char, **400** bila kurang) |

### Sync
| Endpoint | Method | Role/Proteksi | Keterangan |
|----------|--------|--------------|-----------|
| `/api/sync` | POST | admin, leader | Body `{dateFrom, dateTo}` → sync manual (**400** bila kosong) |
| `/api/sync/cron` | GET | header `x-cron-secret` = `CRON_SECRET` | Default sync H-1 (kemarin); `syncType=cron` |
| `/api/sync/logs` | GET | admin, leader | 20 log terakhir (desc) |

**Kode status umum:** `200` sukses · `400` input invalid · `401` belum login · `403` role tidak berwenang · `404` tidak ditemukan · `409` konflik/duplikat · `500` error server.

---

## 12. Frontend — Pages

### Root & Layout
- **`app/layout.tsx`** — memuat 3 Google Font (Manrope=headline, Nunito=body, Source Code Pro=mono) sebagai CSS variable; membungkus app dengan `Providers`; `suppressHydrationWarning` untuk next-themes.
- **`app/providers.tsx`** — `SessionProvider` (NextAuth) + `ThemeProvider` (default `system`) + `Toaster` (sonner).
- **`app/page.tsx`** — redirect ke `/dashboard`.

### `app/login/page.tsx`
Client component. Form email+password dengan toggle show/hide, validasi sederhana, `signIn("credentials", {redirect:false})`, toast sukses/gagal, redirect ke `/dashboard/analytics` saat berhasil.

### `app/dashboard/page.tsx` — Overview
- Kartu info cepat + **bar chart volume ticket per bulan** dengan filter tahun.
- Custom tooltip menampilkan total + **% perubahan vs bulan sebelumnya** (mendukung lintas tahun, mengambil data tahun sebelumnya bila bulan Januari).

### `app/dashboard/analytics/page.tsx`
Halaman analitik terkaya (~1100 baris):
- **Metric cards**: total, resolved, backlog, AVG FRT, AVG RT, CSAT.
- **Bar chart** volume harian (created vs solved).
- **Line chart** tren AVG FRT dengan **garis target 15 menit** (`ReferenceLine`).
- **Bar chart breakdown** by agent/service/type/priority/escalate.
- **Pie chart** distribusi per service (palet `SERVICE_COLORS`).
- **Tabel Top 10 Company**.
- Helper `secondsToHHMMSS()` untuk format durasi.

### `app/dashboard/tickets/page.tsx`
- **Filter**: date range, agent, service, priority, escalate, status.
- **DataTable** (TanStack) dengan sorting, pagination, dan **export Excel**.
- **Modal escalation** (input note + category) untuk admin/leader.
- **Perhitungan shift di sisi klien**: `created_at` (UTC) dikonversi ke **WIB (Asia/Jakarta)** via `Intl.DateTimeFormat`, lalu dicocokkan ke `ShiftConfig` (mendukung range lintas tengah malam; pemenang = `priorityOrder` terkecil).

### `app/dashboard/settings/page.tsx`
- **4 tab**: Shift Config, Escalation Category, User Management, Sync Data.
- `viewer` otomatis ditolak & dialihkan ke `/dashboard`.
- Form CRUD untuk shift/kategori/user, panel sync dengan date range, serta riwayat `SyncLog`.

---

## 13. Frontend — UI Components

| Komponen | File | Ringkasan |
|----------|------|-----------|
| **Button** | `button.tsx` | CVA varian `primary/secondary/ghost/destructive`, ukuran `sm/md/lg`, `forwardRef` |
| **Badge** | `badge.tsx` | CVA `default/primary/success/warning/error/info` + helper `StatusBadge` (map status ticket) & `PriorityBadge` (P1=merah … P4=abu) |
| **Card** | `card.tsx` | `Card`, `CardHeader`, `CardTitle`, `CardDescription`, `CardContent` |
| **Input** | `input.tsx` | label, helperText, errorMessage, left/right icon; state error/disabled |
| **Select** | `select.tsx` | native `<select>` ber-styling + ikon ChevronDown, options + placeholder |
| **MetricCard** | `metric-card.tsx` | title, value, subtitle, description, indikator trend `up/down/neutral` |
| **DataTable** | `data-table.tsx` | TanStack Table: sorting, pagination, skeleton loading, empty state, **export `.xlsx` via ExcelJS** (dynamic import, header bold + background mint) |
| **ThemeToggle** | `theme-toggle.tsx` | siklus tema `light → dark → system`, mode `iconOnly` |
| **Toast** | `toast.tsx` | wrapper `sonner`: `showToast.success/error/warning/info/loading/dismiss` |

**Layout:**
- **`dashboard-layout.tsx`** — auth guard via `useSession` (loading spinner, redirect bila unauthenticated), struktur sidebar + header + main, handler logout.
- **`sidebar.tsx`** — collapsible (desktop) + drawer (mobile), navigasi role-based (Analytics & Tickets untuk semua; "Configurations" hanya admin/leader), info user + badge role, theme toggle.

> Catatan: tombol export menghasilkan file **Excel `.xlsx`** (ExcelJS), meskipun beberapa komentar lama menyebut "CSV".

---

## 14. Design System (BudgetZen)

Didefinisikan di `app/globals.css` menggunakan Tailwind v4 `@theme` + CSS variables, dengan `@custom-variant dark` (di-toggle next-themes via class `.dark`).

**Palet warna utama:**
| Token | Light | Catatan |
|-------|-------|---------|
| primary (mint) | `#10B981` | CTA, progress, success |
| primary-hover | `#059669` | |
| secondary (sky) | `#38BDF8` | link/info |
| success / warning / error / info | `#10B981` / `#F59E0B` / `#EF4444` / `#38BDF8` | semantik |

**Variabel adaptif (light → dark):**
| Variable | Light | Dark |
|----------|-------|------|
| `--bg-page` | `#FAFFFE` | `#0F1419` |
| `--bg-card` | `#FFFFFF` | `#1A2332` |
| `--text-primary` | `#1C1917` | `#F1F5F9` |
| `--text-secondary` | `#57534E` | `#94A3B8` |
| `--border-default` | `#E7E5E4` | `#2D3B4E` |

**Tipografi:** Manrope (headline), Nunito (body), Source Code Pro (mono).
**Radius:** sm 6px, md 12px, lg 16px, xl 24px.
**Shadow:** subtle / medium / large / overlay (lebih gelap di dark mode).

---

## 15. Setup & Deployment

**Requirements:** Node.js v20+, PostgreSQL 14+.

```bash
# 1. Install dependencies (otomatis menjalankan prisma generate)
npm install

# 2. Setup environment
cp .env.example .env   # isi DATABASE_URL, NEXTAUTH_SECRET, CHATWOOT_*, CRON_SECRET

# 3. Migrasi & seed database
npx prisma migrate dev
npx prisma db seed

# 4. Jalankan development server
npm run dev            # http://localhost:3000
```

**Login default:** `admin@dashboard.com` / `Admin123!` (ganti setelah login pertama).

**Production build:** `npm run build` (menjalankan `prisma migrate deploy` lalu `next build`), kemudian `npm run start`.

**Auto-sync (cron):** jadwalkan pemanggilan harian ke `GET /api/sync/cron` dengan header `x-cron-secret: <CRON_SECRET>`. Default men-sync data H-1.

---

*Dokumen ini dihasilkan dari analisis menyeluruh terhadap source code repository `keyesman/dashboard-report`.*
