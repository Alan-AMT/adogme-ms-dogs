import { Injectable, Logger, NotFoundException, ForbiddenException, InternalServerErrorException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { DogRepository } from "../domain/dog.repository.js";
import { Dog, DogFindAllCatalog, DogStatus } from "../domain/dog.entity.js";
import { CreateDogDto, PersonalityDto, VaccinationDto } from "./create-dog.dto.js";
import { v4 as uuidv4 } from 'uuid';
import { UpdateDogDto } from "./update-dog.dto.js";
import { GetDogsCatalogDto } from "./get-dogs-catalog.dto.js";
import { GetShelterDogsDto } from "./get-shelter-dogs.dto.js";
import { UpdateDogsShelterDataDto } from "./update-dogs-shelter-data.dto.js";
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
                adoptionSpeed: dogMl.adoption_speed ?? null,
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

    async findAllCatalog(query: GetDogsCatalogDto): Promise<{data: DogFindAllCatalog[], total: number, page: number, totalPages: number, limit: number}> {
        this.logger.log('Fetching dogs catalog');
        try {
            const { page = 1, limit = 12, ...filters } = query;
            const { data, total } = await this.repository.findAllCatalog(filters, page, limit);

            const totalPages = Math.ceil(total / limit);

            if (page > totalPages) {
                return {
                    data: [],
                    total,
                    page,
                    totalPages,
                    limit
                };
            }

            return {
                data: data,
                total,
                page,
                totalPages,
                limit
            };

        } catch (error) {
            this.logger.error(`Failed to fetch dogs catalog: ${error.message}`, error.stack);
            throw new InternalServerErrorException('Failed to fetch dogs catalog');
        }
    }

    async findAllByShelterId(shelterId: string, query: GetShelterDogsDto): Promise<{data: DogFindAllCatalog[], total: number, page: number, totalPages: number, limit: number}> {
        this.logger.log(`Fetching dogs for shelter ${shelterId}`);
        try {
            const { page = 1, limit = 12, ...filters } = query;
            const { data, total } = await this.repository.findAllByShelterId(shelterId, filters, page, limit);
            const totalPages = Math.ceil(total / limit);

            if (page > totalPages) {
                return {
                    data: [],
                    total,
                    page,
                    totalPages,
                    limit
                };
            }

            return {
                data,
                total,
                page,
                totalPages,
                limit
            };
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

            
            const {adoptionFee, imagesToDelete, amountImagesToCreate, updatedMainImageId, ...dogData} = updateDogDto;

            const [dogTags, dogMl, newImages  ] = await Promise.all([
                this.createAndGetPersonalityTags(dogId, updateDogDto.personality ?? []),
                this.mlDogPort.updateMlDog(updateDogDto, adoptionFee ?? 0, dogId, dog.images.length + (amountImagesToCreate ?? 0) - (imagesToDelete?.length || 0)),
                this.getUpdatedAndSortedDogImages(dogId, dog.images, imagesToDelete, amountImagesToCreate ?? 0, updatedMainImageId)
            ]);


            const updatedDog = Dog.createDog({...dog, ...dogData, personality: dogTags,
                vaccinations: updateDogDto.vaccinations ? this.createVaccinationsDomainInstances(dogId, updateDogDto.vaccinations) : [],
                photo: newImages.length > 0 ? newImages[0].url : null,
                images: newImages,
                vector: dogMl.dog_vector,
                adoptionSpeed: dogMl.adoption_speed ?? null,
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

    async updateDogStatus(dogId: string, status: DogStatus, userOwnerId: string): Promise<void> {
        this.logger.log(`Attempting to update dog ${dogId} status to ${status} for owner ${userOwnerId}`);
        try {
            const dog = await this.repository.findDogById(dogId);
            if (!dog) {
                this.logger.warn(`Dog with id ${dogId} not found for status update`);
                throw new NotFoundException(`Dog with id ${dogId} not found`);
            }
            if (dog.userOwnerId !== userOwnerId) {
                this.logger.warn(`Owner ${userOwnerId} attempted to update dog ${dogId} status without permission`);
                throw new ForbiddenException('No puedes editar este perro');
            }

            await this.repository.updateDogStatus(dogId, status);
            this.logger.log(`Successfully updated dog ${dogId} status to ${status}`);
        } catch (error) {
            if (error instanceof NotFoundException || error instanceof ForbiddenException) throw error;
            this.logger.error(`Failed to update dog ${dogId} status: ${error.message}`, error.stack);
            throw new InternalServerErrorException('Failed to update dog status');
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

    async getUpdatedAndSortedDogImages(dogId: string, dogImages: DogImage[], imagesToDelete: string[] = [], amountImagesToCreate: number = 0, updatedMainImageId: string | null = null): Promise<DogImage[]> {
        // 1. Guard: prevent deleting the chosen main image
        if (updatedMainImageId && imagesToDelete.includes(updatedMainImageId)) {
            throw new Error("Main image cannot be deleted");
        }

        // 2. Create new images instances
        const newImages = this.createImagesDomainInstances(dogId, amountImagesToCreate);
        
        // 3. Filter remaining existing images
        const remainingImages = dogImages.filter(img => !imagesToDelete.includes(img.id));
        
        // 4. Guard: prevent dog from having 0 images
        if (newImages.length + remainingImages.length === 0) {
            throw new Error("Dog can not have 0 images");
        }

        // 5. Delete images
        if (imagesToDelete.length > 0) {
            await this.repository.deleteImagesByIds(imagesToDelete);
            this.eventEmitter.emit('images.deleted', dogId, imagesToDelete);
        }

        // 6. Resolve main image
        let newMainImage: DogImage | null = null;
        if (updatedMainImageId) {
            const found = remainingImages.find(img => img.id === updatedMainImageId);
            if (!found) {
                throw new Error("Invalid updatedMainImageId");
            }
            newMainImage = found;
        }

        // 7. Fallback logic (guarantee main image if possible)
        if (!newMainImage) {
            newMainImage =
                newImages[0] ??
                remainingImages[0] ??
                null;
        }

        // 8. Build final lists WITHOUT mutating
        const remainingWithoutMain = newMainImage
            ? remainingImages.filter(img => img.id !== newMainImage!.id)
            : remainingImages;

        const newWithoutMain = newMainImage
            ? newImages.filter(img => img.id !== newMainImage!.id)
            : newImages;

        // 9. Return ordered result
        return [
            ...(newMainImage ? [newMainImage] : []),
            ...remainingWithoutMain,
            ...newWithoutMain
        ];
    }

    async getPortraitDogs(): Promise<DogFindAllCatalog[]> {
        this.logger.log('Fetching portrait dogs (last 4 disponible)');
        try {
            return await this.repository.getPortraitDogs();
        } catch (error) {
            this.logger.error(`Failed to fetch portrait dogs: ${error.message}`, error.stack);
            throw new InternalServerErrorException('Failed to fetch portrait dogs');
        }
    }

    async getShelterStats(shelterId: string): Promise<{
        recentDogs: DogFindAllCatalog[],
        dogsByStatus: {
          disponible: number,
          en_proceso: number,
          adoptado: number,
          no_disponible: number,
        }
      }> {
        this.logger.log(`Fetching shelter stats for shelter ${shelterId}`);
        try {
            const [recentDogs, dogsByStatus] = await Promise.all([
                this.repository.findAllByShelterId(shelterId, {}, 1, 5),
                this.repository.getDogsCountByStatus(shelterId)
            ]);
            return {
                recentDogs: recentDogs.data,
                dogsByStatus
            };
        } catch (error) {
            this.logger.error(`Failed to fetch shelter stats: ${error.message}`, error.stack);
            throw new InternalServerErrorException('Failed to fetch shelter stats');
        }
    }

    async findDogsByIds(dogIds: string[]): Promise<DogFindAllCatalog[]> {
        this.logger.log(`Fetching dogs by ids: ${dogIds.join(', ')}`);
        try {
            return await this.repository.findDogsByIds(dogIds);
        } catch (error) {
            this.logger.error(`Failed to fetch dogs by ids: ${error.message}`, error.stack);
            throw new InternalServerErrorException('Failed to fetch dogs');
        }
    }

    async updateDogsShelterData(shelterId: string, dto: UpdateDogsShelterDataDto): Promise<void> {
        this.logger.log(`Updating shelter data for shelter ${shelterId}`);
        try {
            await this.repository.updateDogsShelterData(shelterId, dto.shelterName, dto.shelterLogo);
            this.logger.log(`Successfully updated shelter data for shelter ${shelterId}`);
        } catch (error) {
            this.logger.error(`Failed to update shelter data for shelter ${shelterId}: ${error.message}`, error.stack);
            throw new InternalServerErrorException('Failed to update shelter data for dogs');
        }
    }
}