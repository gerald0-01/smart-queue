/*
  Warnings:

  - You are about to drop the column `collage` on the `User` table. All the data in the column will be lost.
  - Added the required column `college` to the `User` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "College" AS ENUM ('COE', 'CCS', 'CSM', 'CHS', 'CEBA', 'CED');

-- AlterTable
ALTER TABLE "User" DROP COLUMN "collage",
ADD COLUMN     "college" "College" NOT NULL;

-- DropEnum
DROP TYPE "Collage";
