import { DogRepository } from "../../domain/dog.repository.js";
import { Dog, DogSex, DogSize, DogStatus, EnergyLevel, FurLength } from "../../domain/dog.entity.js";
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
                // personality: dog.personality.map(tag => PersonalityTag.createPersonalityTag({
                //     id: tag.id, dogId: dog.id, label: tag.label, category: tag.category as PersonalityCategory, createdAt: tag.createdAt, updatedAt: tag.updatedAt
                // })),
                // vaccinations: dog.vaccinations.map(vaccination => Vaccination.createVaccination({
                //     id: vaccination.id, dogId: dog.id, name: vaccination.name, date: vaccination.date, nextDose: vaccination.nextDose, verified: vaccination.verified, createdAt: vaccination.createdAt, updatedAt: vaccination.updatedAt
                // })),
                // images: dog.images.map(image => DogImage.createImage({
                //     id: image.id, dogId: dog.id, url: image.url, status: image.status as ImageStatus
                // })),
                personality: [],
                vaccinations: [],
                // images: dog.images.length > 0 ? [DogImage.createImage({
                //     id: dog.images[0].id, dogId: dog.id, url: dog.images[0].url, status: dog.images[0].status as ImageStatus
                // })] : [],
                images: [],
                furLength: furLength,
                energyLevel: energyLevel,
                size: size,
                sex: sex,
                status: status,
            })});
    }

    async findAllByShelterId(shelterId: string): Promise<Dog[]> {
        const dogs = await this.prisma.dog.findMany({ where: { shelterId }, include: { images: true } });
        return dogs.map(dog => {
            const furLength = dog.furLength as FurLength;
            const energyLevel = dog.energyLevel as EnergyLevel;
            const size = dog.size as DogSize;
            const sex = dog.sex as DogSex;
            const status = dog.status as DogStatus;
            return Dog.createDog({
                ...dog,
                // personality: dog.personality.map(tag => PersonalityTag.createPersonalityTag({
                //     id: tag.id, dogId: dog.id, label: tag.label, category: tag.category as PersonalityCategory, createdAt: tag.createdAt, updatedAt: tag.updatedAt
                // })),
                // vaccinations: dog.vaccinations.map(vaccination => Vaccination.createVaccination({
                //     id: vaccination.id, dogId: dog.id, name: vaccination.name, date: vaccination.date, nextDose: vaccination.nextDose, verified: vaccination.verified, createdAt: vaccination.createdAt, updatedAt: vaccination.updatedAt
                // })),
                // images: dog.images.map(image => DogImage.createImage({
                //     id: image.id, dogId: dog.id, url: image.url, status: image.status as ImageStatus
                // })),
                personality: [],
                vaccinations: [],
                images: dog.images.length > 0 ? [DogImage.createImage({
                    id: dog.images[0].id, dogId: dog.id, url: dog.images[0].url, status: dog.images[0].status as ImageStatus
                })] : [],
                furLength: furLength,
                energyLevel: energyLevel,
                size: size,
                sex: sex,
                status: status,
            })});
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
}