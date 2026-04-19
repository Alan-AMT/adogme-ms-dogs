import { Dog, PersonalityTag, Vaccination } from "./dog.entity.js";

export abstract class DogRepository {
    abstract createDog(dog: Dog): Promise<void>;
    abstract findAll(): Promise<Dog[]>;
    abstract findDogById(id: string): Promise<Dog>;
    abstract updateDog(dog: Dog): Promise<void>;
    abstract findPersonalityTagsByLabel(labels: string[]): Promise<PersonalityTag[]>;
    abstract createPersonalityTags(tags: PersonalityTag[]): Promise<void>;
    abstract deleteAllDogVaccinations(dogId: string): Promise<void>;
    abstract createAndLinkVaccinations(vaccinations: Vaccination[]): Promise<void>
}