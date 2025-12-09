/*
  Warnings:

  - You are about to drop the column `latestEntryId` on the `VisitNote` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "VisitNote" DROP COLUMN "latestEntryId",
ADD COLUMN     "latestVersion" INTEGER;
