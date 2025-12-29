/*
  Warnings:

  - The `status` column on the `user_profile` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- CreateEnum
CREATE TYPE "UserProfileStatus" AS ENUM ('PENDING', 'ACTIVE', 'INACTIVE', 'BLOCKED');

-- AlterTable
ALTER TABLE "user_profile" DROP COLUMN "status",
ADD COLUMN     "status" "UserProfileStatus" NOT NULL DEFAULT 'ACTIVE';
