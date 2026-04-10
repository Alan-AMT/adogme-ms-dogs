/*
  Warnings:

  - Added the required column `userOwnerId` to the `Dog` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Dog" ADD COLUMN     "userOwnerId" TEXT NOT NULL;
