/*
  Warnings:

  - Added the required column `collage` to the `User` table without a default value. This is not possible if the table is not empty.
  - Added the required column `course` to the `User` table without a default value. This is not possible if the table is not empty.
  - Added the required column `idNumber` to the `User` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "Collage" AS ENUM ('COE', 'CCS', 'CSM', 'CHS', 'CEBA', 'CED');

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "collage" "Collage" NOT NULL,
ADD COLUMN     "course" TEXT NOT NULL,
ADD COLUMN     "idNumber" TEXT NOT NULL;
