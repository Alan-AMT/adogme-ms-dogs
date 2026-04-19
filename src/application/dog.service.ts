import { Injectable } from "@nestjs/common";
import { DogRepository } from "../domain/dog.repository.js";
import { Dog, DogStatus, PersonalityTag, Vaccination } from "../domain/dog.entity.js";
import { CreateDogDto, PersonalityDto, VaccinationDto } from "./create-dog.dto.js";
import { v4 as uuidv4 } from 'uuid';
import { UpdateDogDto } from "./update-dog.dto.js";

@Injectable()
export class DogService {
    constructor(private readonly repository: DogRepository) {}

    async createDog(createDogDto: CreateDogDto, userOwnerId: string): Promise<Dog> {
        const date = new Date();
        const dogId = uuidv4();
        const dogTags = await this.createAndGetPersonalityTags(dogId, createDogDto.personality);
        const dogToCreate = Dog.createDog({
            id: dogId,
            ...createDogDto,
            userOwnerId: userOwnerId,
            personality: dogTags,
            status: DogStatus.disponible,
            vaccinations: this.createVaccinationsDomainInstances(dogId, createDogDto.vaccinations),
            updatedAt: date,
            createdAt: date,
        })
        await this.repository.createDog(dogToCreate);
        return dogToCreate;
    }

    async findAll(): Promise<Dog[]> {
        return this.repository.findAll();
    }
    
    async updateDog(updateDogDto: UpdateDogDto, dogId: string): Promise<Dog> {
        const dog = await this.repository.findDogById(dogId);
        const dogTags = await this.createAndGetPersonalityTags(dogId, updateDogDto.personality ?? []);
        //Primero llenamos con los valores actuales, luego con los valores que vienen llenos en el Dto
        const updatedDog = Dog.createDog({...dog, ...updateDogDto, personality: dogTags,
            vaccinations: updateDogDto.vaccinations ? this.createVaccinationsDomainInstances(dogId, updateDogDto.vaccinations) : [],
            updatedAt: new Date()});
        await this.repository.updateDog(updatedDog);
        return updatedDog;
    }

    async createAndGetPersonalityTags(dogId: string, dtoTags: PersonalityDto[]): Promise<PersonalityTag[]> {
        const existingTags = await this.repository.findPersonalityTagsByLabel(dtoTags.map(tag => tag.label));
        const notExistingTags = dtoTags.filter(tag => !existingTags.some(existingTag => existingTag.label === tag.label));
        const tagsToCreate = notExistingTags.map((tag) => {
            return PersonalityTag.createPersonalityTag({
                id: uuidv4(),
                dogId: dogId,
                label: tag.label,
                category: tag.category,
                createdAt: new Date(),
                updatedAt: new Date()
            })
        })
        if (tagsToCreate.length > 0) {
            await this.repository.createPersonalityTags(tagsToCreate);
        }
        
        return [...existingTags, ...tagsToCreate];
    }

    createVaccinationsDomainInstances(dogId: string, vaccinations: VaccinationDto[]): Vaccination[] {
        return vaccinations.map((vaccination) => Vaccination.createVaccination({
                id: uuidv4(),
                dogId: dogId,
                name: vaccination.name,
                date: new Date(vaccination.date),
                nextDose: vaccination.nextDose ? new Date(vaccination.nextDose) : null,
                verified: vaccination.verified,
                createdAt: new Date(),
                updatedAt: new Date()
            }))
    }

}