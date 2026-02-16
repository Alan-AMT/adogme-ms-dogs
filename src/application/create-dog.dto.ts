// src/dogs/application/dtos/create-dog.dto.ts
import { IsString, IsInt, Min, Max } from 'class-validator';

export class CreateDogDto {
  @IsString()
  name: string;

  @IsString()
  breed: string;

  @IsInt()
  @Min(0)
  @Max(20)
  age: number;

}