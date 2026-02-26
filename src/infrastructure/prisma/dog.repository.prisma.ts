import { DogRepository } from "../../domain/dog.repository.js";
import { Dog } from "../../domain/dog.entity.js";
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
                shelterId: dog.shelterId,
                createdAt: dog.createdAt,
                updatedAt: dog.updatedAt,
            }
        })
    }
    async findAll(): Promise<Dog[]> {
        const dogs = await this.prisma.dog.findMany();
        return dogs.map(dog => Dog.createDog({id: dog.id, name: dog.name, breed: dog.breed, age: dog.age, shelterId: dog.shelterId, createdAt: dog.createdAt, updatedAt: dog.updatedAt}));
    }

    async findDogById(id: string): Promise<Dog> {
        const dog = await this.prisma.dog.findUnique({ where: { id } });
        if (!dog) throw new Error("Dog not found");
        return Dog.createDog({id: dog.id, name: dog.name, breed: dog.breed, age: dog.age, shelterId: dog.shelterId, createdAt: dog.createdAt, updatedAt: dog.updatedAt});
    }

    async updateDog(dog: Dog): Promise<void> {
        await this.prisma.dog.update({ where: { id: dog.id }, 
            data: { name: dog.name, breed: dog.breed,
                shelterId: dog.shelterId,
                age: dog.age, updatedAt: dog.updatedAt } });
    }
}