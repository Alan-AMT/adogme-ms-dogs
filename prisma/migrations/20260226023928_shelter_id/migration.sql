/*
  Warnings:

  - Made the column `shelterId` on table `Dog` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "Dog" ALTER COLUMN "shelterId" SET NOT NULL;
