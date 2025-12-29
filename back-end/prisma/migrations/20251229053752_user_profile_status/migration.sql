/*
  Warnings:

  - You are about to drop the column `ativo` on the `user_profile` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "user_profile" DROP COLUMN "ativo",
ADD COLUMN     "status" VARCHAR(20) NOT NULL DEFAULT 'ACTIVE';
