import { Injectable } from "@nestjs/common";
import { DogRepository } from "../domain/dog.repository.js";
import { Dog, DogStatus } from "../domain/dog.entity.js";
import { CreateDogDto, PersonalityDto, VaccinationDto } from "./create-dog.dto.js";
import { v4 as uuidv4 } from 'uuid';
import { UpdateDogDto } from "./update-dog.dto.js";
import { MlDogPort } from "../domain/ml.port.js";
import { ImagesPort } from "../domain/images.port.js";
import { ImageStatus, Image as DogImage } from "../domain/image.entity.js";
import { Vaccination } from "../domain/vaccination.entity.js";
import { PersonalityTag } from "../domain/personalityTag.entity.js";

@Injectable()
export class DogService {
    constructor(private readonly repository: DogRepository, private readonly mlDogPort: MlDogPort, private readonly imagesPort: ImagesPort) { }

    async createDog(createDogDto: CreateDogDto, userOwnerId: string): Promise<{ dog: Dog, uploadUrls: string[] }> {
        const date = new Date();
        const dogId = uuidv4();
        const { adoptionFee, amountImages, ...dogData } = createDogDto;
        const imageInstances = this.createImagesDomainInstances(dogId, createDogDto.amountImages ?? 0);
        const [dogTags, dogMl, uploadUrls] = await Promise.all([
            this.createAndGetPersonalityTags(dogId, createDogDto.personality),
            this.mlDogPort.createMlDog(createDogDto, adoptionFee ?? 0, dogId),
            this.imagesPort.generateUploadLinks(dogId, imageInstances.map(image => image.id))
        ]);
        const dogToCreate = Dog.createDog({
            id: dogId,
            ...dogData,
            userOwnerId: userOwnerId,
            personality: dogTags,
            status: DogStatus.disponible,
            vaccinations: this.createVaccinationsDomainInstances(dogId, createDogDto.vaccinations),
            images: imageInstances,
            vector: dogMl.dog_vector,
            updatedAt: date,
            createdAt: date,
        })
        await this.repository.createDog(dogToCreate);
        return {dog: dogToCreate, uploadUrls};
    }

    async findAll(): Promise<Dog[]> {
        return this.repository.findAll();
    }

    async findAllByShelterId(shelterId: string): Promise<Dog[]> {
        return this.repository.findAllByShelterId(shelterId);
    }

    async findDogById(dogId: string): Promise<Dog> {
        return this.repository.findDogById(dogId);
    }
    
    async updateDog(updateDogDto: UpdateDogDto, dogId: string, userOwnerId: string): Promise<Dog> {
        const dog = await this.repository.findDogById(dogId);
        if (dog.userOwnerId !== userOwnerId) {
            throw new Error('No puedes editar este perro');
        }
        const {adoptionFee, amountImages, ...dogData} = updateDogDto;
        // const [dogTags, dogMl, uploadUrls] = await Promise.all([
        const [dogTags, dogMl ] = await Promise.all([
            this.createAndGetPersonalityTags(dogId, updateDogDto.personality ?? []),
            this.mlDogPort.updateMlDog(updateDogDto, adoptionFee ?? 0, dogId),
            // this.imagesPort.generateUploadLinks(dogId, updateDogDto.imageExtensions ?? [])
        ]);
        const updatedDog = Dog.createDog({...dog, ...dogData, personality: dogTags,
            vaccinations: updateDogDto.vaccinations ? this.createVaccinationsDomainInstances(dogId, updateDogDto.vaccinations) : [],
            vector: dogMl.dog_vector,
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

    createImagesDomainInstances(dogId: string, amountImages: number): DogImage[] {
        const BUCKET_NAME_PUBLIC = process.env.BUCKET_NAME_PUBLIC;
        let images: DogImage[] = [];
        for(let i = 0; i < amountImages; i++) {
            const imageId = uuidv4();
            images.push(DogImage.createImage({
                id: imageId,
                dogId: dogId,
                status: ImageStatus.pending,
                url: `https://storage.googleapis.com/${BUCKET_NAME_PUBLIC}/${dogId}/${imageId}.jpg`,
            }))
        }
        return images;
    }

    async updateImageStatus(imageId: string, status: ImageStatus): Promise<void> {
        if(status == ImageStatus.accepted) {
            await this.repository.updateImageStatus(imageId, ImageStatus.accepted);
        } else if(status == ImageStatus.pending) {
            await this.repository.updateImageStatus(imageId, ImageStatus.pending);
        } else {
            await this.repository.deleteImage(imageId);
        }
    }
}