import { Body, Controller, Get, Post, UsePipes, ValidationPipe} from '@nestjs/common';
// import { DogService } from './dog.service.js';
// import { Dog as DogModel } from './generated/prisma/client.js';
import { Dog as DogModel } from './domain/dog.entity.js';
import { CreateDogDto } from './application/create-dog.dto.js';
import { DogService } from './application/dog.service.js';

@Controller()
@UsePipes(new ValidationPipe({ transform: true }))
export class AppController {
  constructor(private readonly dogService: DogService) {}

  @Post('dog')
  async createDog(
    @Body() createDogDto: CreateDogDto
  ): Promise<DogModel> {
    return this.dogService.createDog(createDogDto);
  }

  @Get("dogs")
  async findAll(): Promise<DogModel[]> {
    return this.dogService.findAll();
  }
}