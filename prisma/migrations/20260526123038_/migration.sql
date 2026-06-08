-- AlterTable
ALTER TABLE "public"."accounts" ALTER COLUMN "balance_cents" SET DEFAULT 0.00,
ALTER COLUMN "balance_cents" SET DATA TYPE DECIMAL(65,30),
ALTER COLUMN "limit_cents" SET DEFAULT 0.00,
ALTER COLUMN "limit_cents" SET DATA TYPE DECIMAL(65,30);

-- AlterTable
ALTER TABLE "public"."fraud_analyses" ALTER COLUMN "amount_cents" SET DEFAULT 0.00,
ALTER COLUMN "amount_cents" SET DATA TYPE DECIMAL(65,30);

-- AlterTable
ALTER TABLE "public"."ledger_entries" ALTER COLUMN "amount_cents" SET DEFAULT 0.00,
ALTER COLUMN "amount_cents" SET DATA TYPE DECIMAL(65,30),
ALTER COLUMN "balance_cents" SET DEFAULT 0.00,
ALTER COLUMN "balance_cents" SET DATA TYPE DECIMAL(65,30);

-- AlterTable
ALTER TABLE "public"."payments" ALTER COLUMN "amount_cents" SET DEFAULT 0.00,
ALTER COLUMN "amount_cents" SET DATA TYPE DECIMAL(65,30);
