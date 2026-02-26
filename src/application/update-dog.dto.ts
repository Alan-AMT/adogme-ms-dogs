// src/dogs/application/dtos/update-dog.dto.ts
import { PartialType } from '@nestjs/mapped-types';
import { CreateDogDto } from './create-dog.dto.js';

export class UpdateDogDto extends PartialType(CreateDogDto) {}