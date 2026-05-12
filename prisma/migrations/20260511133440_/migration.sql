-- CreateEnum
CREATE TYPE "public"."OutboxStatus" AS ENUM ('PENDING', 'PUBLISHED', 'FAILED');

-- CreateEnum
CREATE TYPE "public"."FraudDecision" AS ENUM ('APPROVED', 'REVIEW', 'BLOCKED');

-- CreateTable
CREATE TABLE "public"."outbox_events" (
    "id" TEXT NOT NULL,
    "aggregate_id" TEXT NOT NULL,
    "event_name" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "status" "public"."OutboxStatus" NOT NULL DEFAULT 'PENDING',
    "retries" INTEGER NOT NULL DEFAULT 0,
    "last_error" TEXT,
    "published_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "outbox_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."fraud_analyses" (
    "id" TEXT NOT NULL,
    "payment_id" TEXT,
    "sender_account_id" TEXT NOT NULL,
    "amount_cents" BIGINT NOT NULL,
    "risk_score" INTEGER NOT NULL,
    "decision" "public"."FraudDecision" NOT NULL,
    "factors" JSONB NOT NULL,
    "analyzed_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "fraud_analyses_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "outbox_events_status_created_at_idx" ON "public"."outbox_events"("status", "created_at");

-- CreateIndex
CREATE INDEX "fraud_analyses_sender_account_id_idx" ON "public"."fraud_analyses"("sender_account_id");

-- CreateIndex
CREATE INDEX "fraud_analyses_decision_idx" ON "public"."fraud_analyses"("decision");
