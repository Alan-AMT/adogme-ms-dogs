import { IsEnum, IsNotEmpty } from 'class-validator';
import { DogStatus } from '../domain/dog.entity.js';

export class UpdateDogStatusDto {
    @IsNotEmpty()
    @IsEnum(DogStatus)
    status: DogStatus;
}
