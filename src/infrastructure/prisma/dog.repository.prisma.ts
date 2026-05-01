import { DogRepository } from "../../domain/dog.repository.js";
import { Dog, DogFindAllCatalog, DogSex, DogSize, DogStatus, EnergyLevel, FurLength } from "../../domain/dog.entity.js";
import { PersonalityCategory, PersonalityTag } from "../../domain/personalityTag.entity.js";
import { Vaccination } from "../../domain/vaccination.entity.js";
import { Image as DogImage, ImageStatus } from "../../domain/image.entity.js";
import { Injectable } from "@nestjs/common";
import { PrismaService } from "./prisma.service.js";

@Injectable()
export class PrismaDogRepository implements DogRepository {
    constructor(private readonly prisma: PrismaService) { }
    async createDog(dog: Dog): Promise<void> {
        await this.prisma.dog.create({
            data: {
                ...dog,
                personality: {
                    connect: dog.personality.map(tag => ({ id: tag.id })),
                },
                vaccinations: {
                    create: dog.vaccinations.map(vaccination => ({
                        id: vaccination.id, name: vaccination.name, date: vaccination.date, nextDose: vaccination.nextDose, verified: vaccination.verified, createdAt: vaccination.createdAt, updatedAt: vaccination.updatedAt
                    }))
                },
                images: {
                    create: dog.images.map(image => ({
                        id: image.id, url: image.url, status: image.status as ImageStatus
                    }))
                }
            }
        })
    }
    async findAll(): Promise<Dog[]> {
        const dogs = await this.prisma.dog.findMany();
        return dogs.map(dog => {
            const furLength = dog.furLength as FurLength;
            const energyLevel = dog.energyLevel as EnergyLevel;
            const size = dog.size as DogSize;
            const sex = dog.sex as DogSex;
            const status = dog.status as DogStatus;
            // This function is supposed to be for long dogs list, so we don't need all the images and relations
            return Dog.createDog({
                ...dog,
                personality: [],
                vaccinations: [],
                images: [],
                furLength: furLength,
                energyLevel: energyLevel,
                size: size,
                sex: sex,
                status: status,
            })});
    }

    async findAllCatalog(filters: any, page: number, limit: number): Promise<{ data: DogFindAllCatalog[], total: number }> {
        const andConditions: any[] = [];

        // Base visibility filter
        andConditions.push({
            status: {
                notIn: [DogStatus.no_disponible, DogStatus.adoptado]
            }
        });

        if (filters.search) {
            andConditions.push({
                OR: [
                    { name: { contains: filters.search, mode: 'insensitive' } },
                    { breed: { contains: filters.search, mode: 'insensitive' } }
                ]
            });
        }

        if (filters.breed) {
            andConditions.push({
                OR: [
                    { breed: { contains: filters.breed, mode: 'insensitive' } },
                    { breed2: { contains: filters.breed, mode: 'insensitive' } }
                ]
            });
        }

        if (filters.size) {
            andConditions.push({ size: filters.size });
        }

        if (filters.sex) {
            andConditions.push({ sex: filters.sex });
        }

        if (filters.energyLevel) {
            andConditions.push({ energyLevel: filters.energyLevel });
        }

        if (filters.goodWithKids === true) {
            andConditions.push({ goodWithKids: true });
        }

        if (filters.goodWithDogs === true) {
            andConditions.push({ goodWithDogs: true });
        }

        if (filters.shelterId) {
            andConditions.push({ shelterId: filters.shelterId });
        }

        if (filters.ageCategory) {
            switch (filters.ageCategory) {
                case 'cachorro':
                    andConditions.push({ age: { lt: 12 } });
                    break;
                case 'joven':
                    andConditions.push({ age: { gte: 12, lte: 36 } });
                    break;
                case 'adulto':
                    andConditions.push({ age: { gt: 36, lte: 96 } });
                    break;
                case 'senior':
                    andConditions.push({ age: { gt: 96 } });
                    break;
            }
        }

        const where = { AND: andConditions };
        const total = await this.prisma.dog.count({ where });

        const offset = (page - 1) * limit;

        const dogs = await this.prisma.dog.findMany({
            where,
            skip: offset,
            take: limit,
            orderBy: { createdAt: 'desc' },
            select: {
                id: true,
                shelterId: true,
                name: true,
                age: true,
                breed: true,
                size: true,
                sex: true,
                energyLevel: true,
                status: true,
                photo: true,
                goodWithKids: true,
                goodWithDogs: true,
                needsYard: true,
                shelterName: true,
            }
        });

        const data = dogs.map(dog => {
            return {
                id: dog.id,
                shelterId: dog.shelterId,
                name: dog.name,
                age: dog.age,
                breed: dog.breed,
                size: dog.size as DogSize,
                sex: dog.sex as DogSex,
                energyLevel: dog.energyLevel as EnergyLevel,
                status: dog.status as DogStatus,
                photo: dog.photo,
                goodWithKids: dog.goodWithKids,
                goodWithDogs: dog.goodWithDogs,
                needsYard: dog.needsYard,
                shelterName: dog.shelterName,
            } as DogFindAllCatalog;
        });

        return { data, total };
    }

    async findAllByShelterId(shelterId: string, filters: any, page: number, limit: number): Promise<{ data: DogFindAllCatalog[], total: number }> {
        const andConditions: any[] = [{ shelterId }];

        if (filters.status) {
            andConditions.push({ status: filters.status });
        }

        if (filters.search) {
            andConditions.push({
                OR: [
                    { name: { contains: filters.search, mode: 'insensitive' } },
                    { breed: { contains: filters.search, mode: 'insensitive' } }
                ]
            });
        }

        const where = { AND: andConditions };
        const total = await this.prisma.dog.count({ where });

        const offset = (page - 1) * limit;

        const dogs = await this.prisma.dog.findMany({
            where,
            skip: offset,
            take: limit,
            orderBy: { createdAt: 'desc' },
            select: {
                id: true,
                shelterId: true,
                name: true,
                age: true,
                breed: true,
                size: true,
                sex: true,
                energyLevel: true,
                status: true,
                photo: true,
                goodWithKids: true,
                goodWithDogs: true,
                needsYard: true,
                shelterName: true,
            }
        });

        const data = dogs.map(dog => {
            return {
                id: dog.id,
                shelterId: dog.shelterId,
                name: dog.name,
                age: dog.age,
                breed: dog.breed,
                size: dog.size as DogSize,
                sex: dog.sex as DogSex,
                energyLevel: dog.energyLevel as EnergyLevel,
                status: dog.status as DogStatus,
                photo: dog.photo,
                goodWithKids: dog.goodWithKids,
                goodWithDogs: dog.goodWithDogs,
                needsYard: dog.needsYard,
                shelterName: dog.shelterName,
            } as DogFindAllCatalog;
        });

        return { data, total };
    }

    async findDogById(id: string): Promise<Dog> {
        const dog = await this.prisma.dog.findUnique({ where: { id }, include: { personality: true, vaccinations: true, images: true } });
        if (!dog) throw new Error("Dog not found");
        return Dog.createDog({...dog, 
                personality: dog.personality.map(tag => PersonalityTag.createPersonalityTag({
                    id: tag.id, dogId: dog.id, label: tag.label, category: tag.category as PersonalityCategory, createdAt: tag.createdAt, updatedAt: tag.updatedAt
                })), 
                vaccinations: dog.vaccinations.map(vaccination => Vaccination.createVaccination({
                    id: vaccination.id, dogId: dog.id, name: vaccination.name, date: vaccination.date, nextDose: vaccination.nextDose, verified: vaccination.verified, createdAt: vaccination.createdAt, updatedAt: vaccination.updatedAt
                })),
                images: dog.images.map(image => DogImage.createImage({
                    id: image.id, dogId: dog.id, url: image.url, status: image.status as ImageStatus
                })),
                furLength: dog.furLength as FurLength,
                energyLevel: dog.energyLevel as EnergyLevel,
                size: dog.size as DogSize,
                sex: dog.sex as DogSex,
                status: dog.status as DogStatus,
            });
    }

    async updateDog(dog: Dog): Promise<void> {
        const data = { ...dog,
                personality: {
                    set: dog.personality.map(tag => ({ id: tag.id })),
                },
                images: {
                    connectOrCreate: dog.images.map(image => ({
                        where: { id: image.id },
                        create: { id: image.id, url: image.url, status: image.status as ImageStatus }
                    })),
                }
            }
        //TODO: HOW ARE WE GOING TO IMPLEMENT IMAGE UPDATE?
        const {id, userOwnerId, shelterId, vaccinations, ...cleanedDog} = data
        await this.prisma.dog.update({ where: { id: dog.id }, 
            data: cleanedDog });
        await this.deleteAllDogVaccinations(dog.id);
        if (vaccinations) {
            await this.createAndLinkVaccinations(vaccinations);
        }
    }

    async findPersonalityTagsByLabel(labels: string[]): Promise<PersonalityTag[]> {
        const tags = await this.prisma.personalityTag.findMany({ where: { label: { in: labels } } });
        return tags.map(tag => PersonalityTag.createPersonalityTag({
            id: tag.id, dogId: null, label: tag.label, category: tag.category as PersonalityCategory, createdAt: tag.createdAt, updatedAt: tag.updatedAt
        }));
    }

    async createPersonalityTags(tags: PersonalityTag[]): Promise<void> {
        await this.prisma.personalityTag.createMany({ 
            data: tags.map(tag => ({
                id: tag.id, 
                label: tag.label, 
                category: tag.category as PersonalityCategory, 
                createdAt: tag.createdAt, 
                updatedAt: tag.updatedAt
            })) 
        });
    }

    async deleteAllDogVaccinations(dogId: string): Promise<void> {
        await this.prisma.vaccination.deleteMany({ where: { dogId } });
    }

    async createAndLinkVaccinations(vaccinations: Vaccination[]): Promise<void> {
        await this.prisma.vaccination.createMany({ data: vaccinations.map(vaccination => ({id: vaccination.id, dogId: vaccination.dogId, name: vaccination.name, date: vaccination.date, nextDose: vaccination.nextDose, verified: vaccination.verified, createdAt: vaccination.createdAt, updatedAt: vaccination.updatedAt})) });
    }

    async updateImageStatus(imageId: string, status: ImageStatus): Promise<void> {
        await this.prisma.image.update({ where: { id: imageId }, data: { status } });
    }

    async deleteImagesByIds(imageIds: string[]): Promise<void> {
        if (imageIds.length == 0) return;
        if (imageIds.length == 1) {
            await this.prisma.image.delete({ where: { id: imageIds[0] } });
            return;
        }
        await this.prisma.image.deleteMany({ where: { id: { in: imageIds } } });
    }

    async deleteDog(dogId: string): Promise<void> {
        await this.prisma.dog.delete({ where: { id: dogId } });
    }

    async getPortraitDogs(): Promise<DogFindAllCatalog[]> {
        const dogs = await this.prisma.dog.findMany({
            where: {
                status: DogStatus.disponible
            },
            take: 4,
            orderBy: { createdAt: 'desc' },
            select: {
                id: true,
                shelterId: true,
                name: true,
                age: true,
                breed: true,
                size: true,
                sex: true,
                energyLevel: true,
                status: true,
                photo: true,
                goodWithKids: true,
                goodWithDogs: true,
                needsYard: true,
                shelterName: true,
            }
        });

        return dogs.map(dog => ({
            id: dog.id,
            shelterId: dog.shelterId,
            name: dog.name,
            age: dog.age,
            breed: dog.breed,
            size: dog.size as DogSize,
            sex: dog.sex as DogSex,
            energyLevel: dog.energyLevel as EnergyLevel,
            status: dog.status as DogStatus,
            photo: dog.photo,
            goodWithKids: dog.goodWithKids,
            goodWithDogs: dog.goodWithDogs,
            needsYard: dog.needsYard,
            shelterName: dog.shelterName,
        } as DogFindAllCatalog));
    }
}