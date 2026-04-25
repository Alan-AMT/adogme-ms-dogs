// src/dogs/application/dtos/create-dog.dto.ts
import { IsString, IsInt, Min, IsNumber, IsBoolean, IsOptional, IsEnum, IsArray, ValidateNested } from 'class-validator';
import { DogSex, DogSize, EnergyLevel, FurLength } from '../domain/dog.entity.js';
import { PersonalityCategory } from '../domain/personalityTag.entity.js';
import { Type } from 'class-transformer';
export class CreateDogDto {
  @IsString()
  name: string;

  @IsString()
  breed: string;

  @IsInt()
  @Min(0)
  age: number;

  @IsString()
  shelterId: string;

  @IsNumber()
  @IsOptional()
  weightKg: number | null = null;

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

  @IsOptional()
  @IsString()
  breed2: string | null = null;

  @IsOptional()
  @IsString()
  shelterName: string | null = null;

  @IsOptional()
  @IsString()
  shelterLogo: string | null = null;

  @IsOptional()
  @IsNumber()
  adoptionFee: number | null = null;

  @IsOptional()
  @IsInt()
  amountImages: number | null = null;
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

  @IsOptional()
  @IsString()
  nextDose: string | null = null;

  @IsBoolean()
  verified: boolean;
}