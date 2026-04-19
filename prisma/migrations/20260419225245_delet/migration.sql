-- DropForeignKey
ALTER TABLE "Vaccination" DROP CONSTRAINT "Vaccination_dogId_fkey";

-- AddForeignKey
ALTER TABLE "Vaccination" ADD CONSTRAINT "Vaccination_dogId_fkey" FOREIGN KEY ("dogId") REFERENCES "Dog"("id") ON DELETE CASCADE ON UPDATE CASCADE;
