import { Injectable } from "@nestjs/common";
import { DogRepository } from "../domain/dog.repository.js";
import { Dog } from "../domain/dog.entity.js";
import { CreateDogDto } from "./create-dog.dto.js";
import { v4 as uuidv4 } from 'uuid';
import { UpdateDogDto } from "./update-dog.dto.js";

@Injectable()
export class DogService {
    constructor(private readonly repository: DogRepository) {}

    async createDog(createDogDto: CreateDogDto, shelterId: string): Promise<Dog> {
        const date = new Date();
        const dogToCreate = Dog.createDog({
            id: uuidv4(),
            shelterId: shelterId,
            name: createDogDto.name,
            breed: createDogDto.breed,
            age: createDogDto.age,
            createdAt: date,
            updatedAt: date
        })
        await this.repository.createDog(dogToCreate);
        return dogToCreate;
    }

    async findAll(): Promise<Dog[]> {
        return this.repository.findAll();
    }
    
    async updateDog(updateDogDto: UpdateDogDto, dogId: string): Promise<Dog> {
        const dog = await this.repository.findDogById(dogId);
        dog.updateDetails(updateDogDto);
        await this.repository.updateDog(dog);
        return dog;
    }
}