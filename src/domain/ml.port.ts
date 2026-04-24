import { CreateDogDto } from "src/application/create-dog.dto.js";
import { UpdateDogDto } from "src/application/update-dog.dto.js";

export abstract class MlDogPort{
    abstract createMlDog(dog: CreateDogDto, adoptionFee: number, dogId: string): Promise<{adoption_speed: number, speed_label: string, dog_vector: number[]}>;
    abstract updateMlDog(dog: UpdateDogDto, adoptionFee: number, dogId: string): Promise<{adoption_speed: number, speed_label: string, dog_vector: number[]}>;
    // abstract deleteMlDog(dogId: string): Promise<void>;
}