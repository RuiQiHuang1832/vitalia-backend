/*
  Warnings:

  - You are about to drop the column `latestVersionId` on the `VisitNote` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "VisitNote" DROP COLUMN "latestVersionId",
ADD COLUMN     "latestEntryId" INTEGER;
