import { DogRepository } from "../domain/dog.repository.js";
import { Dog } from "../domain/dog.entity.js";
import { Injectable } from "@nestjs/common";
import { PrismaService } from "./prisma.service.js";

@Injectable()
export class PrismaDogRepository implements DogRepository {
    constructor(private readonly prisma: PrismaService) { }
    async createDog(dog: Dog): Promise<void> {
        await this.prisma.dog.create({
            data: {
                id: dog.id,
                name: dog.name,
                breed: dog.breed,
                age: dog.age,
                createdAt: dog.createdAt,
                updatedAt: dog.updatedAt,
            }
        })
    }
    async findAll(): Promise<Dog[]> {
        const dogs = await this.prisma.dog.findMany();
        return dogs.map(dog => new Dog(dog.id, dog.name, dog.breed, dog.age, dog.createdAt, dog.updatedAt));
    }
}