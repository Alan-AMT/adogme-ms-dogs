import { Image } from "./image.entity.js";
import { Vaccination } from "./vaccination.entity.js";
import { PersonalityTag } from "./personalityTag.entity.js";

export enum DogStatus {
    disponible = 'disponible',
    en_proceso = 'en_proceso',
    adoptado = 'adoptado',
    no_disponible = 'no_disponible',
}

export enum DogSex {
    macho = 'macho',
    hembra = 'hembra',
}

export enum DogSize {
    pequeño = 'pequeño',
    mediano = 'mediano',
    grande = 'grande',
    gigante = 'gigante',
}

export enum EnergyLevel {
    baja = 'baja',
    moderada = 'moderada',
    alta = 'alta',
    muy_alta = 'muy_alta',
}

export enum FurLength {
    corto = 'corto',
    mediano = 'mediano',
    largo = 'largo',
}

export class Dog {
    private constructor(
        public readonly id: string,
        public readonly userOwnerId: string,
        public readonly shelterId: string,
        public readonly status: DogStatus,
        public name: string,
        public breed: string,
        public age: number,
        public readonly sex: DogSex,
        public readonly size: DogSize,
        public readonly energyLevel: EnergyLevel,
        public readonly description: string,
        public readonly personality: PersonalityTag[],
        public readonly goodWithKids: boolean,
        public readonly goodWithDogs: boolean,
        public readonly goodWithCats: boolean,
        public readonly sterilized: boolean,
        public readonly needsYard: boolean,
        public readonly isVaccinated: boolean, 
        public readonly isDewormed: boolean, 
        public readonly furLength: FurLength,   
        public readonly vaccinations: Vaccination[],
        public readonly health: string,
        public readonly updatedAt: Date,
        public readonly createdAt: Date,
        public readonly weightKg: number | null,
        public readonly photo: string | null, // URL principal
        public readonly breed2: string | null,
        public readonly shelterName: string | null,
        public readonly shelterLogo: string | null,
        public readonly vector: number[],
        public readonly images: Image[],
    ) { }

    public static createDog(dogData: { id: string; userOwnerId: string; name: string; breed: string; age: number; createdAt: Date; updatedAt: Date; shelterId: string, status: DogStatus, weightKg: number | null, sex: DogSex, size: DogSize, energyLevel: EnergyLevel, description: string, personality: PersonalityTag[], goodWithKids: boolean, goodWithDogs: boolean, goodWithCats: boolean, sterilized: boolean, needsYard: boolean, isVaccinated: boolean, isDewormed: boolean, furLength: FurLength, vaccinations: Vaccination[], health: string, photo: string | null, breed2: string | null, shelterName: string | null, shelterLogo: string | null, vector: number[], images: Image[] }): Dog {
        return new Dog(
            dogData.id,
            dogData.userOwnerId,
            dogData.shelterId,
            dogData.status,
            dogData.name,
            dogData.breed,
            dogData.age,
            dogData.sex,
            dogData.size,
            dogData.energyLevel,
            dogData.description,
            dogData.personality,
            dogData.goodWithKids,
            dogData.goodWithDogs,
            dogData.goodWithCats,
            dogData.sterilized,
            dogData.needsYard,
            dogData.isVaccinated,
            dogData.isDewormed,
            dogData.furLength,
            dogData.vaccinations,
            dogData.health,
            dogData.updatedAt,
            dogData.createdAt,
            dogData.weightKg,
            dogData.photo,
            dogData.breed2,
            dogData.shelterName,
            dogData.shelterLogo,
            dogData.vector,
            dogData.images,
        );
    }
}

export type DogFindAllCatalog = Pick<Dog, "id" | "shelterId" | "name" | "age" | "breed" | "size" | "sex" | "energyLevel" | "status" | "photo" | "goodWithKids" | "goodWithDogs" | "needsYard" | "shelterName">