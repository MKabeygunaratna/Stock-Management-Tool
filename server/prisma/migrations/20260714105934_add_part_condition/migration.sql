-- CreateEnum
CREATE TYPE "PartCondition" AS ENUM ('NEW', 'RECONDITION');

-- AlterTable
ALTER TABLE "products" ADD COLUMN     "condition" "PartCondition" NOT NULL DEFAULT 'NEW';

-- AlterTable
ALTER TABLE "purchase_order_items" ADD COLUMN     "condition" "PartCondition" NOT NULL DEFAULT 'NEW';
