/*
  Warnings:

  - A unique constraint covering the columns `[id]` on the table `Dog` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `description` to the `Dog` table without a default value. This is not possible if the table is not empty.
  - Added the required column `energyLevel` to the `Dog` table without a default value. This is not possible if the table is not empty.
  - Added the required column `furLength` to the `Dog` table without a default value. This is not possible if the table is not empty.
  - Added the required column `goodWithCats` to the `Dog` table without a default value. This is not possible if the table is not empty.
  - Added the required column `goodWithDogs` to the `Dog` table without a default value. This is not possible if the table is not empty.
  - Added the required column `goodWithKids` to the `Dog` table without a default value. This is not possible if the table is not empty.
  - Added the required column `health` to the `Dog` table without a default value. This is not possible if the table is not empty.
  - Added the required column `isDewormed` to the `Dog` table without a default value. This is not possible if the table is not empty.
  - Added the required column `isVaccinated` to the `Dog` table without a default value. This is not possible if the table is not empty.
  - Added the required column `needsYard` to the `Dog` table without a default value. This is not possible if the table is not empty.
  - Added the required column `sex` to the `Dog` table without a default value. This is not possible if the table is not empty.
  - Added the required column `size` to the `Dog` table without a default value. This is not possible if the table is not empty.
  - Added the required column `status` to the `Dog` table without a default value. This is not possible if the table is not empty.
  - Added the required column `sterilized` to the `Dog` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "DogStatus" AS ENUM ('disponible', 'en_proceso', 'adoptado', 'no_disponible');

-- CreateEnum
CREATE TYPE "DogSize" AS ENUM ('pequeño', 'mediano', 'grande', 'gigante');

-- CreateEnum
CREATE TYPE "EnergyLevel" AS ENUM ('baja', 'moderada', 'alta', 'muy_alta');

-- CreateEnum
CREATE TYPE "DogSex" AS ENUM ('macho', 'hembra');

-- CreateEnum
CREATE TYPE "PersonalityCategory" AS ENUM ('caracter', 'socializacion', 'actividad', 'entrenamiento');

-- CreateEnum
CREATE TYPE "FurLength" AS ENUM ('corto', 'mediano', 'largo');

-- AlterTable
ALTER TABLE "Dog" ADD COLUMN     "breed2" TEXT,
ADD COLUMN     "description" TEXT NOT NULL,
ADD COLUMN     "energyLevel" "EnergyLevel" NOT NULL,
ADD COLUMN     "furLength" "FurLength" NOT NULL,
ADD COLUMN     "goodWithCats" BOOLEAN NOT NULL,
ADD COLUMN     "goodWithDogs" BOOLEAN NOT NULL,
ADD COLUMN     "goodWithKids" BOOLEAN NOT NULL,
ADD COLUMN     "health" TEXT NOT NULL,
ADD COLUMN     "isDewormed" BOOLEAN NOT NULL,
ADD COLUMN     "isVaccinated" BOOLEAN NOT NULL,
ADD COLUMN     "needsYard" BOOLEAN NOT NULL,
ADD COLUMN     "photo" TEXT,
ADD COLUMN     "sex" "DogSex" NOT NULL,
ADD COLUMN     "shelterLogo" TEXT,
ADD COLUMN     "shelterName" TEXT,
ADD COLUMN     "size" "DogSize" NOT NULL,
ADD COLUMN     "status" "DogStatus" NOT NULL,
ADD COLUMN     "sterilized" BOOLEAN NOT NULL,
ADD COLUMN     "weightKg" DOUBLE PRECISION;

-- CreateTable
CREATE TABLE "Vaccination" (
    "id" TEXT NOT NULL,
    "dogId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "nextDose" TIMESTAMP(3),
    "verified" BOOLEAN NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Vaccination_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PersonalityTag" (
    "id" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "category" "PersonalityCategory" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PersonalityTag_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_DogToPersonalityTag" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_DogToPersonalityTag_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE UNIQUE INDEX "Vaccination_id_key" ON "Vaccination"("id");

-- CreateIndex
CREATE UNIQUE INDEX "PersonalityTag_id_key" ON "PersonalityTag"("id");

-- CreateIndex
CREATE INDEX "_DogToPersonalityTag_B_index" ON "_DogToPersonalityTag"("B");

-- CreateIndex
CREATE UNIQUE INDEX "Dog_id_key" ON "Dog"("id");

-- AddForeignKey
ALTER TABLE "Vaccination" ADD CONSTRAINT "Vaccination_dogId_fkey" FOREIGN KEY ("dogId") REFERENCES "Dog"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_DogToPersonalityTag" ADD CONSTRAINT "_DogToPersonalityTag_A_fkey" FOREIGN KEY ("A") REFERENCES "Dog"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_DogToPersonalityTag" ADD CONSTRAINT "_DogToPersonalityTag_B_fkey" FOREIGN KEY ("B") REFERENCES "PersonalityTag"("id") ON DELETE CASCADE ON UPDATE CASCADE;
