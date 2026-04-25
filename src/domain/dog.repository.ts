import { Dog } from "./dog.entity.js";
import { PersonalityTag } from "./personalityTag.entity.js";
import { Vaccination } from "./vaccination.entity.js";
import { ImageStatus } from "./image.entity.js";

export abstract class DogRepository {
    abstract createDog(dog: Dog): Promise<void>;
    abstract findAll(): Promise<Dog[]>;
    abstract findDogById(id: string): Promise<Dog>;
    abstract updateDog(dog: Dog): Promise<void>;
    abstract findPersonalityTagsByLabel(labels: string[]): Promise<PersonalityTag[]>;
    abstract createPersonalityTags(tags: PersonalityTag[]): Promise<void>;
    abstract deleteAllDogVaccinations(dogId: string): Promise<void>;
    abstract createAndLinkVaccinations(vaccinations: Vaccination[]): Promise<void>
    abstract findAllByShelterId(shelterId: string): Promise<Dog[]>;
    abstract updateImageStatus(imageId: string, status: ImageStatus): Promise<void>;
    abstract deleteImage(imageId: string): Promise<void>;
}