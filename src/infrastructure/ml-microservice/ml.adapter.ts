import { Dog, DogSex, DogSize, FurLength } from "../../domain/dog.entity.js";
import { MlDogPort } from "../../domain/ml.port.js";
import { BreedsMap } from "./breeds.map.js"
import { Injectable } from "@nestjs/common";

@Injectable()
export class MlDogAdapter implements MlDogPort {
    async createMlDog(dog: Dog, adoptionFee: number): Promise<void> {
        try { 
            const parsedDog = this.parseDogToMlPayload(dog, adoptionFee)
            const response = await fetch(`${process.env.ML_SERVICE_URL}/predict/process-dog`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(parsedDog),
            });
            if (!response.ok) {
                throw new Error(`Machine Learning service error! status: ${response.status}`);
            }
            const {adoption_speed, speed_label, dog_vector} = await response.json();
        } catch (error) {
            console.error(error)
            throw new Error("Failed to create dog in ML service")
        }
    }
    async updateMlDog(dog: Dog, adoptionFee: number): Promise<void> {
        try { 
            const parsedDog = this.parseDogToMlPayload(dog, adoptionFee)
            const response = await fetch(`${process.env.ML_SERVICE_URL}/predict/process-dog`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(parsedDog),
            });
            if (!response.ok) {
                throw new Error(`Machine Learning service error! status: ${response.status}`);
            }
            const {adoption_speed, speed_label, dog_vector} = await response.json();
        } catch (error) {
            console.error(error)
            throw new Error("Failed to update dog in ML service")
        }
    }

    parseDogToMlPayload(dog: Dog, adoptionFee: number): any {
        const getMaturitySizeValue = (size: DogSize): number => {
            switch (size) {
                case DogSize.pequeño:
                    return 1;
                case DogSize.mediano:
                    return 2;
                case DogSize.grande:
                    return 3;
                case DogSize.gigante:
                    return 4;
            }
        }

        const getFurLengthValue = (furLength: FurLength): number => {
            switch (furLength) {
                case FurLength.corto:
                    return 1;
                case FurLength.mediano:
                    return 2;
                case FurLength.largo:
                    return 3;
            }
        }

        const getHealthValue = (health: string): number => {
            switch (health) {
                case 'Sano':
                    return 1;
                case 'Lesión o condición leve':
                    return 2;
                case 'Lesión o condición grave':
                    return 3;
                default:
                    return 1;
            }
        }
        return {
            dog_service_id: dog.id,
            Name: dog.name,
            Age: dog.age,
            Breed1: BreedsMap[dog.breed] ?? 307,
            Breed2: dog.breed2 ? BreedsMap[dog.breed2] ?? 307 : 0,
            Gender: dog.sex === DogSex.macho ? 1 : 2,
            MaturitySize: getMaturitySizeValue(dog.size),
            FurLength: getFurLengthValue(dog.furLength),
            Vaccinated: dog.isVaccinated ? 1 : 2,
            Dewormed: dog.isDewormed ? 1 : 2,
            Sterilized: dog.sterilized ? 1 : 2,
            Health: getHealthValue(dog.health),
            Quantity: 1,
            Fee: adoptionFee,
            PhotoAmt: 0,
            VideoAmt: 0,
            Description: dog.description,
        }
    }
}