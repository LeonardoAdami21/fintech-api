/*
  Warnings:

  - You are about to alter the column `amount_cents` on the `fraud_analyses` table. The data in that column could be lost. The data in that column will be cast from `Decimal(65,30)` to `Integer`.

*/
-- AlterTable
ALTER TABLE "public"."fraud_analyses" ALTER COLUMN "amount_cents" DROP DEFAULT,
ALTER COLUMN "amount_cents" SET DATA TYPE INTEGER;
