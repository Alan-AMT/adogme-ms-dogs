import { Injectable } from "@nestjs/common";
import { DogRepository } from "../domain/dog.repository.js";
import { Dog } from "../domain/dog.entity.js";
import { CreateDogDto } from "./create-dog.dto.js";
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class DogService {
    constructor(private readonly repository: DogRepository) {}

    async createDog(createDogDto: CreateDogDto): Promise<Dog> {
        const date = new Date();
        const dogToCreate = new Dog(
            uuidv4(),
            createDogDto.name,
            createDogDto.breed,
            createDogDto.age,
            date,
            date
        )
        await this.repository.createDog(dogToCreate);
        return dogToCreate;
    }

    async findAll(): Promise<Dog[]> {
        return this.repository.findAll();
    }
    
}