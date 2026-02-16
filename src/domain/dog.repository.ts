import { Dog } from "./dog.entity.js";

export abstract class DogRepository {
    abstract createDog(dog: Dog): Promise<void>;
    abstract findAll(): Promise<Dog[]>;
}