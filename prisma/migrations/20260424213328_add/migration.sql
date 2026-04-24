/*
  Warnings:

  - Added the required column `status` to the `Image` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "ImageStatus" AS ENUM ('pending', 'accepted', 'rejected');

-- AlterTable
ALTER TABLE "Image" ADD COLUMN     "status" "ImageStatus" NOT NULL;
