import { GoogleAuth } from "google-auth-library";
import { DogSex, DogSize, FurLength } from "../../domain/dog.entity.js";
import { MlDogPort } from "../../domain/ml.port.js";
import { BreedsMap } from "./breeds.map.js"
import { Injectable } from "@nestjs/common";
import { decode, JwtPayload } from "jsonwebtoken";
import { CreateDogDto } from "src/application/create-dog.dto.js";
import { UpdateDogDto } from "src/application/update-dog.dto.js";

@Injectable()
export class MlDogAdapter implements MlDogPort {
    mlServiceToken: string;

    async createMlDog(dog: CreateDogDto, adoptionFee: number, dogId: string): Promise<{adoption_speed: number, speed_label: string, dog_vector: number[]}> {
        try { 
            const parsedDog = this.parseDogToMlPayload(dog, adoptionFee, dogId, dog.amountImagesToCreate ?? 0)
            if (this.checkTokenExpired()) {
                await this.refreshTokenClient();
            }
            const response = await fetch(`${process.env.ML_SERVICE_URL}/predict/process-dog`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.mlServiceToken}`
                },
                body: JSON.stringify(parsedDog),
            });
            if (!response.ok) {
                throw new Error(`Machine Learning service error! status: ${response.status}`);
            }
            const {adoption_speed, speed_label, dog_vector} = await response.json();
            return {adoption_speed, speed_label, dog_vector};
        } catch (error) {
            console.error(error)
            throw new Error("Failed to create dog in ML service")
        }
    }
    async updateMlDog(dog: UpdateDogDto, adoptionFee: number, dogId: string, amountImages: number = 0): Promise<{adoption_speed: number, speed_label: string, dog_vector: number[]}> {
        try { 
            const parsedDog = this.parseDogToMlPayload(dog, adoptionFee, dogId, amountImages)
            if (this.checkTokenExpired()) {
                await this.refreshTokenClient();
            }
            const response = await fetch(`${process.env.ML_SERVICE_URL}/predict/process-dog`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.mlServiceToken}`
                },
                body: JSON.stringify(parsedDog),
            });
            if (!response.ok) {
                throw new Error(`Machine Learning service error! status: ${response.status}`);
            }
            const {adoption_speed, speed_label, dog_vector} = await response.json();
            return {adoption_speed, speed_label, dog_vector};
        } catch (error) {
            console.error(error)
            throw new Error("Failed to update dog in ML service")
        }
    }

    async deleteMlDog(dogId: string): Promise<void> {
        try { 
            if (this.checkTokenExpired()) {
                await this.refreshTokenClient();
            }
            const response = await fetch(`${process.env.ML_SERVICE_URL}/dogs/${dogId}`, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.mlServiceToken}`
                },
            });
            if (!response.ok) {
                throw new Error(`Machine Learning service error! status: ${response.status}`);
            }
        } catch (error) {
            console.error(error)
            throw new Error("Failed to delete dog in ML service")
        }
    }

    checkTokenExpired(): boolean {
        if (!this.mlServiceToken) return true;
        const decodedToken = decode(this.mlServiceToken) as JwtPayload;
        const currentTime = Date.now() / 1000;
        return decodedToken.exp! < currentTime;
    }

    async refreshTokenClient(): Promise<void> {
        try {
            const auth = new GoogleAuth();
            const client = await auth.getIdTokenClient(process.env.ML_SERVICE_URL ?? "");
            const token = await client.idTokenProvider.fetchIdToken(process.env.ML_SERVICE_URL ?? "")
            this.mlServiceToken = token;
        } catch (error) {
            console.error(error)
            throw new Error("Failed to refresh ML service token")
        }
    }

    parseDogToMlPayload(dog: CreateDogDto | UpdateDogDto, adoptionFee: number, dogId: string, amountImages: number = 0): any {
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
            dog_service_id: dogId,
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
            PhotoAmt: amountImages,
            VideoAmt: 0,
            Description: dog.description,
        }
    }
}