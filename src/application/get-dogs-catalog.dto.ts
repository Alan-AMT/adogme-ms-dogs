import { IsOptional, IsString, IsEnum, IsBoolean, IsNumber, Min } from 'class-validator';
import { Type, Transform } from 'class-transformer';
import { DogSize, DogSex, EnergyLevel } from '../domain/dog.entity.js';

export enum AgeCategory {
  cachorro = 'cachorro',
  joven = 'joven',
  adulto = 'adulto',
  senior = 'senior',
}

export class GetDogsCatalogDto {
  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsString()
  breed?: string;

  @IsOptional()
  @IsEnum(DogSize)
  size?: DogSize;

  @IsOptional()
  @IsEnum(DogSex)
  sex?: DogSex;

  @IsOptional()
  @IsEnum(AgeCategory)
  ageCategory?: AgeCategory;

  @IsOptional()
  @IsEnum(EnergyLevel)
  energyLevel?: EnergyLevel;

  @IsOptional()
  @Transform(({ value }) => {
    if (value === undefined || value === null) return undefined;
    return value === 'true';
  })
  @IsBoolean()
  goodWithKids?: boolean;

  @IsOptional()
  @Transform(({ value }) => {
    if (value === undefined || value === null) return undefined;
    return value === 'true';
  })
  @IsBoolean()
  goodWithDogs?: boolean;

  @IsOptional()
  @IsString()
  shelterId?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  limit?: number = 12;
}
