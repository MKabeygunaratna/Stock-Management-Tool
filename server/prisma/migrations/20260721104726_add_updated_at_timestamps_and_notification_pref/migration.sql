/*
  Warnings:

  - Added the required column `updatedAt` to several existing tables. Backfilled
    from each row's `createdAt` (or `CURRENT_TIMESTAMP` where no prior date
    exists) since nothing has "updated" these rows before now.

*/
-- AlterTable
ALTER TABLE "invoices" ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
UPDATE "invoices" SET "updatedAt" = "createdAt";

-- AlterTable
ALTER TABLE "login_logs" ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
UPDATE "login_logs" SET "updatedAt" = "createdAt";

-- AlterTable
ALTER TABLE "payments" ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
UPDATE "payments" SET "updatedAt" = "createdAt";

-- AlterTable
ALTER TABLE "purchase_order_items" ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "purchase_orders" ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
UPDATE "purchase_orders" SET "updatedAt" = "createdAt";

-- AlterTable
ALTER TABLE "refresh_tokens" ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
UPDATE "refresh_tokens" SET "updatedAt" = COALESCE("revokedAt", "createdAt");

-- AlterTable
ALTER TABLE "stock_movements" ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
UPDATE "stock_movements" SET "updatedAt" = "createdAt";

-- AlterTable
ALTER TABLE "supplier_payments" ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
UPDATE "supplier_payments" SET "updatedAt" = "createdAt";

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "notificationsEnabled" BOOLEAN NOT NULL DEFAULT true;
