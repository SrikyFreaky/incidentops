/*
  Warnings:

  - Made the column `teamId` on table `incidents` required. This step will fail if there are existing NULL values in that column.
  - Made the column `createdById` on table `incidents` required. This step will fail if there are existing NULL values in that column.

*/
-- DropForeignKey
ALTER TABLE "incidents" DROP CONSTRAINT "incidents_createdById_fkey";

-- DropForeignKey
ALTER TABLE "incidents" DROP CONSTRAINT "incidents_teamId_fkey";

-- AlterTable
ALTER TABLE "incidents" ALTER COLUMN "teamId" SET NOT NULL,
ALTER COLUMN "createdById" SET NOT NULL;

-- AddForeignKey
ALTER TABLE "incidents" ADD CONSTRAINT "incidents_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "teams"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "incidents" ADD CONSTRAINT "incidents_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
