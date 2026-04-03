/*
  Warnings:

  - A unique constraint covering the columns `[verificationToken]` on the table `User` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[resetToken]` on the table `User` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateEnum
CREATE TYPE "NotificationType" AS ENUM ('STATUS_UPDATE', 'QUEUE_ROLLOVER', 'PICKUP_READY', 'GENERAL');

-- AlterEnum
ALTER TYPE "College" ADD VALUE 'CASS';

-- AlterTable
ALTER TABLE "Notification" ADD COLUMN     "requestId" TEXT,
ADD COLUMN     "type" "NotificationType" NOT NULL DEFAULT 'GENERAL';

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "resetToken" TEXT,
ADD COLUMN     "resetTokenExpiry" TIMESTAMP(3),
ADD COLUMN     "verificationToken" TEXT,
ADD COLUMN     "verified" BOOLEAN NOT NULL DEFAULT false;

-- CreateIndex
CREATE UNIQUE INDEX "User_verificationToken_key" ON "User"("verificationToken");

-- CreateIndex
CREATE UNIQUE INDEX "User_resetToken_key" ON "User"("resetToken");

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_requestId_fkey" FOREIGN KEY ("requestId") REFERENCES "Request"("id") ON DELETE SET NULL ON UPDATE CASCADE;
