-- CreateEnum
CREATE TYPE "AllergySeverity" AS ENUM ('MILD', 'MODERATE', 'SEVERE');

-- CreateEnum
CREATE TYPE "AllergyCategory" AS ENUM ('FOOD', 'MEDICATION', 'ENVIRONMENTAL', 'OTHER');

-- CreateTable
CREATE TABLE "Allergy" (
    "id" SERIAL NOT NULL,
    "patientId" INTEGER NOT NULL,
    "recordedById" INTEGER NOT NULL,
    "category" "AllergyCategory" NOT NULL,
    "substance" TEXT NOT NULL,
    "reaction" TEXT,
    "severity" "AllergySeverity",
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Allergy_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Allergy" ADD CONSTRAINT "Allergy_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "Patient"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Allergy" ADD CONSTRAINT "Allergy_recordedById_fkey" FOREIGN KEY ("recordedById") REFERENCES "Provider"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
