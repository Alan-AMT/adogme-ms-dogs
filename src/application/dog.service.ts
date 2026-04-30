import { Injectable, Logger, NotFoundException, ForbiddenException, InternalServerErrorException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
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
import { EventEmitter2 } from "@nestjs/event-emitter";

@Injectable()
export class DogService {
    private readonly logger = new Logger(DogService.name);

    constructor(
        private readonly repository: DogRepository, 
        private readonly mlDogPort: MlDogPort, 
        private readonly imagesPort: ImagesPort,
        private readonly configService: ConfigService,
        private eventEmitter: EventEmitter2
    ) { }

    async createDog(createDogDto: CreateDogDto, userOwnerId: string): Promise<{ dog: Dog, uploadUrls: string[] }> {
        this.logger.log(`Initiating dog creation for owner ${userOwnerId}`);
        try {
            const date = new Date();
            const dogId = uuidv4();
            const { adoptionFee, amountImagesToCreate, ...dogData } = createDogDto;
            const imageInstances = this.createImagesDomainInstances(dogId, createDogDto.amountImagesToCreate ?? 0);
            const [dogTags, dogMl, uploadUrls] = await Promise.all([
                this.createAndGetPersonalityTags(dogId, createDogDto.personality),
                this.mlDogPort.createMlDog(createDogDto, adoptionFee ?? 0, dogId),
                this.imagesPort.generateUploadLinks(dogId, imageInstances.map(image => image.id))
            ]);
            const dogToCreate = Dog.createDog({
                id: dogId,
                ...dogData,
                photo: imageInstances.length > 0 ? imageInstances[0].url : null,
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
            this.logger.log(`Successfully created dog with id ${dogId}`);
            return {dog: dogToCreate, uploadUrls};
        } catch (error) {
            this.logger.error(`Failed to create dog: ${error.message}`, error.stack);
            throw new InternalServerErrorException('Failed to create dog profile');
        }
    }

    async findAll(): Promise<Dog[]> {
        this.logger.log('Fetching all dogs');
        try {
            return await this.repository.findAll();
        } catch (error) {
            this.logger.error(`Failed to fetch all dogs: ${error.message}`, error.stack);
            throw new InternalServerErrorException('Failed to fetch dogs');
        }
    }

    async findAllByShelterId(shelterId: string): Promise<Dog[]> {
        this.logger.log(`Fetching dogs for shelter ${shelterId}`);
        try {
            return await this.repository.findAllByShelterId(shelterId);
        } catch (error) {
            this.logger.error(`Failed to fetch dogs for shelter ${shelterId}: ${error.message}`, error.stack);
            throw new InternalServerErrorException('Failed to fetch shelter dogs');
        }
    }

    async findDogById(dogId: string): Promise<Dog> {
        this.logger.log(`Fetching dog with id ${dogId}`);
        try {
            const dog = await this.repository.findDogById(dogId);
            if (!dog) {
                this.logger.warn(`Dog with id ${dogId} not found`);
                throw new NotFoundException(`Dog with id ${dogId} not found`);
            }
            return dog;
        } catch (error) {
            if (error instanceof NotFoundException) throw error;
            this.logger.error(`Failed to fetch dog ${dogId}: ${error.message}`, error.stack);
            throw new InternalServerErrorException('Failed to fetch dog details');
        }
    }
    
    async updateDog(updateDogDto: UpdateDogDto, dogId: string, userOwnerId: string): Promise<{dog: Dog, uploadUrls: string[]}> {
        this.logger.log(`Attempting to update dog ${dogId} for owner ${userOwnerId}`);
        try {
            const dog = await this.repository.findDogById(dogId);
            if (!dog) {
                this.logger.warn(`Dog with id ${dogId} not found for update`);
                throw new NotFoundException(`Dog with id ${dogId} not found`);
            }
            if (dog.userOwnerId !== userOwnerId) {
                this.logger.warn(`Owner ${userOwnerId} attempted to update dog ${dogId} without permission`);
                throw new ForbiddenException('No puedes editar este perro');
            }

            
            const {adoptionFee, imagesToDelete, amountImagesToCreate, ...dogData} = updateDogDto;

            const [dogTags, dogMl, newImages  ] = await Promise.all([
                this.createAndGetPersonalityTags(dogId, updateDogDto.personality ?? []),
                this.mlDogPort.updateMlDog(updateDogDto, adoptionFee ?? 0, dogId, dog.images.length + (amountImagesToCreate ?? 0) - (imagesToDelete?.length || 0)),
                this.getUpdatedDogImages(dogId, dog.images, imagesToDelete, amountImagesToCreate ?? 0)
            ]);


            const updatedDog = Dog.createDog({...dog, ...dogData, personality: dogTags,
                vaccinations: updateDogDto.vaccinations ? this.createVaccinationsDomainInstances(dogId, updateDogDto.vaccinations) : [],
                images: newImages,
                vector: dogMl.dog_vector,
                updatedAt: new Date()});
            const [uploadUrls, _] = await Promise.all([
                this.imagesPort.generateUploadLinks(dogId, newImages.filter(image => !dog.images.map(dogImage => dogImage.id).includes(image.id)).map(image => image.id)),
                this.repository.updateDog(updatedDog)
            ]);
            this.logger.log(`Successfully updated dog ${dogId}`);
            return {dog: updatedDog, uploadUrls};
        } catch (error) {
            if (error instanceof NotFoundException || error instanceof ForbiddenException) throw error;
            this.logger.error(`Failed to update dog ${dogId}: ${error.message}`, error.stack);
            throw new InternalServerErrorException('Failed to update dog profile');
        }
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
        const BUCKET_NAME_PUBLIC = this.configService.get<string>('BUCKET_NAME_PUBLIC');
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
        this.logger.log(`Updating image status for image ${imageId} to ${status}`);
        try {
            if(status == ImageStatus.accepted) {
                await this.repository.updateImageStatus(imageId, ImageStatus.accepted);
            } else if(status == ImageStatus.pending) {
                await this.repository.updateImageStatus(imageId, ImageStatus.pending);
            } else {
                await this.repository.deleteImagesByIds([imageId]);
            }
            this.logger.log(`Successfully updated image status for ${imageId}`);
        } catch (error) {
            this.logger.error(`Failed to update image status for ${imageId}: ${error.message}`, error.stack);
            throw new InternalServerErrorException('Failed to update image status');
        }
    }

    async deleteDog(dogId: string, userOwnerId: string): Promise<void> {
        try {
            const dog = await this.repository.findDogById(dogId);
            if (!dog) {
                this.logger.warn(`Dog with id ${dogId} not found for deletion`);
                throw new NotFoundException(`No se encontro un perro con id ${dogId}`);
            }
            if (dog.userOwnerId !== userOwnerId) {
                this.logger.warn(`Owner ${userOwnerId} attempted to delete dog ${dogId} without permission`);
                throw new ForbiddenException('No puedes eliminar este perro');
            }
            await this.repository.deleteDog(dogId);
            this.eventEmitter.emit('dog.deleted', dogId);
            this.logger.log(`Successfully deleted dog ${dogId}`);
        } catch (error) {
            if (error instanceof NotFoundException || error instanceof ForbiddenException) throw error;
            this.logger.error(`Failed to delete dog ${dogId}: ${error.message}`, error.stack);
            throw new InternalServerErrorException('Error al eliminar perro');
        }
    }

    async getUpdatedDogImages(dogId: string, dogImages: DogImage[], imagesToDelete: string[] = [], amountImagesToCreate: number = 0): Promise<DogImage[]> {
        if (imagesToDelete && imagesToDelete.length > 0) {
            await this.repository.deleteImagesByIds(imagesToDelete);
            this.eventEmitter.emit('images.deleted', dogId, imagesToDelete);
        }
        const newImages = this.createImagesDomainInstances(dogId, amountImagesToCreate);
        const remainingImages = dogImages.filter(img => !(imagesToDelete || []).includes(img.id));
        return [...remainingImages, ...newImages];
    }
}