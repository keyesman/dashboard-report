-- CreateTable
CREATE TABLE "users" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'viewer',
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "last_login_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "conversations" (
    "id" SERIAL NOT NULL,
    "ticket_id" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL,
    "status" TEXT NOT NULL,
    "agent" TEXT,
    "service" TEXT,
    "priority" TEXT,
    "escalate" TEXT,
    "type" TEXT,
    "raw_labels" TEXT,
    "frt_seconds" INTEGER,
    "resolution_time_seconds" INTEGER,
    "resolve_count" INTEGER NOT NULL DEFAULT 0,
    "is_reopened" BOOLEAN NOT NULL DEFAULT false,
    "last_note" TEXT,
    "company" TEXT,
    "customer" TEXT,
    "phone" TEXT,
    "escalation_note" TEXT,
    "escalation_category" TEXT,
    "escalation_updated_by" INTEGER,
    "escalation_updated_at" TIMESTAMP(3),
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "conversations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "shift_config" (
    "id" SERIAL NOT NULL,
    "shift_name" TEXT NOT NULL,
    "start_time" TEXT NOT NULL,
    "end_time" TEXT NOT NULL,
    "priority_order" INTEGER NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "shift_config_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "escalation_categories" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "escalation_categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sync_log" (
    "id" SERIAL NOT NULL,
    "sync_type" TEXT NOT NULL,
    "date_from" TEXT NOT NULL,
    "date_to" TEXT NOT NULL,
    "total_synced" INTEGER NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'running',
    "error_msg" TEXT,
    "started_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "finished_at" TIMESTAMP(3),

    CONSTRAINT "sync_log_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "conversations_ticket_id_key" ON "conversations"("ticket_id");

-- CreateIndex
CREATE UNIQUE INDEX "escalation_categories_name_key" ON "escalation_categories"("name");
