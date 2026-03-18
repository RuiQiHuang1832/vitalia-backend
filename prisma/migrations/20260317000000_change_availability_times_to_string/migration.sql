-- AlterTable: Convert startTime and endTime from TIMESTAMP to TEXT (HH:mm format)

-- Add temporary columns
ALTER TABLE "ProviderAvailability" ADD COLUMN "startTime_new" TEXT;
ALTER TABLE "ProviderAvailability" ADD COLUMN "endTime_new" TEXT;

-- Convert existing DateTime values to "HH:mm" strings
UPDATE "ProviderAvailability"
SET "startTime_new" = TO_CHAR("startTime", 'HH24:MI'),
    "endTime_new"   = TO_CHAR("endTime", 'HH24:MI');

-- Drop old columns
ALTER TABLE "ProviderAvailability" DROP COLUMN "startTime";
ALTER TABLE "ProviderAvailability" DROP COLUMN "endTime";

-- Rename new columns
ALTER TABLE "ProviderAvailability" RENAME COLUMN "startTime_new" TO "startTime";
ALTER TABLE "ProviderAvailability" RENAME COLUMN "endTime_new" TO "endTime";

-- Set NOT NULL constraint
ALTER TABLE "ProviderAvailability" ALTER COLUMN "startTime" SET NOT NULL;
ALTER TABLE "ProviderAvailability" ALTER COLUMN "endTime" SET NOT NULL;
