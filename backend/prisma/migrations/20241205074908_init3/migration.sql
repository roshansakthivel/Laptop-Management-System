/*
  Warnings:

  - The `status` column on the `Maintenance` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - Changed the type of `status` on the `Issue` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- AlterTable
ALTER TABLE "Issue" DROP COLUMN "status",
ADD COLUMN     "status" "LaptopStatus" NOT NULL;

-- AlterTable
ALTER TABLE "Maintenance" DROP COLUMN "status",
ADD COLUMN     "status" "LaptopStatus" NOT NULL DEFAULT 'AVAILABLE';
