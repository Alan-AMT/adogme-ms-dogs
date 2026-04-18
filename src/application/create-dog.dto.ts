// src/dogs/application/dtos/create-dog.dto.ts
import { IsString, IsInt, Min, Max, IsNumber, IsBoolean, IsOptional, IsEnum, IsArray, ValidateNested } from 'class-validator';
import { DogSex, DogSize, EnergyLevel, FurLength, PersonalityCategory } from '../domain/dog.entity.js';
import { Type } from 'class-transformer';
export class CreateDogDto {
  @IsString()
  name: string;

  @IsString()
  breed: string;

  @IsInt()
  @Min(0)
  @Max(25)
  age: number;

  @IsString()
  shelterId: string;

  @IsNumber()
  weightKg: number;

  @IsEnum(DogSex)
  sex: DogSex;

  @IsEnum(DogSize)
  size: DogSize;

  @IsEnum(EnergyLevel)
  energyLevel: EnergyLevel;

  @IsString()
  description: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PersonalityDto)
  personality: PersonalityDto[];

  @IsBoolean()
  goodWithKids: boolean;

  @IsBoolean()
  goodWithDogs: boolean;

  @IsBoolean()
  goodWithCats: boolean;

  @IsBoolean()
  sterilized: boolean;

  @IsBoolean()
  needsYard: boolean;

  @IsBoolean()
  isVaccinated: boolean;

  @IsBoolean()
  isDewormed: boolean;

  @IsEnum(FurLength)
  furLength: FurLength;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => VaccinationDto)
  vaccinations: VaccinationDto[];

  @IsString()
  health: string;

  @IsString()
  photo: string;

  @IsString()
  @IsOptional()
  breed2: string;

  @IsString()
  @IsOptional()
  shelterName: string;

  @IsString()
  @IsOptional()
  shelterLogo: string;

}

export class PersonalityDto {
  @IsString()
  label: string;

  @IsEnum(PersonalityCategory)
  category: PersonalityCategory;
}

export class VaccinationDto {
  @IsString()
  name: string;

  @IsString()
  date: string;

  @IsString()
  @IsOptional()
  nextDose: string;

  @IsBoolean()
  verified: boolean;
}