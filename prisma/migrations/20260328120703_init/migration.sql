/*
  Warnings:

  - You are about to drop the column `eta` on the `Request` table. All the data in the column will be lost.
  - You are about to drop the column `etaUpdatedAt` on the `Request` table. All the data in the column will be lost.
  - You are about to drop the `EtaHistory` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "EtaHistory" DROP CONSTRAINT "EtaHistory_requestId_fkey";

-- DropIndex
DROP INDEX "Request_eta_idx";

-- AlterTable
ALTER TABLE "Request" DROP COLUMN "eta",
DROP COLUMN "etaUpdatedAt",
ADD COLUMN     "availablePickUp" TIMESTAMP(3),
ADD COLUMN     "message" TEXT;

-- DropTable
DROP TABLE "EtaHistory";
