-- CreateEnum
CREATE TYPE "ProviderStatus" AS ENUM ('ACTIVE', 'INACTIVE');

-- AlterTable
ALTER TABLE "Provider" ADD COLUMN     "status" "ProviderStatus" NOT NULL DEFAULT 'ACTIVE';
