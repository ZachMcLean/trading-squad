-- AlterTable
ALTER TABLE "BrokerageAccount" ADD COLUMN     "marginAvailable" DOUBLE PRECISION,
ADD COLUMN     "marginMaintenance" DOUBLE PRECISION,
ADD COLUMN     "marginUsed" DOUBLE PRECISION;
