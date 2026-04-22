import { Dog } from "./dog.entity.js";

export abstract class MlDogPort{
    abstract createMlDog(dog: Dog, adoptionFee: number): Promise<void>;
    abstract updateMlDog(dog: Dog, adoptionFee: number): Promise<void>;
    // abstract deleteMlDog(dogId: string): Promise<void>;
}