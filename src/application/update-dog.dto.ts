// src/dogs/application/dtos/update-dog.dto.ts
import { CreateDogDto } from './create-dog.dto.js';
import { IsOptional, IsArray, IsUUID } from 'class-validator';

//Endpoint is Put object will be completely replaced
//except for imagesToDelete which will be deleted, and imagesToCreate which will be uploaded

export class UpdateDogDto extends CreateDogDto {
    @IsOptional()
    @IsArray()
    @IsUUID("all", { each: true })
    imagesToDelete?: string[];

    @IsOptional()
    @IsUUID("all")
    updatedMainImageId?: string | null = null;
}