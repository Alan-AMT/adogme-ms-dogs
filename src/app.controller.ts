import { Body, Controller, Get, Post, UsePipes, ValidationPipe} from '@nestjs/common';
import { Dog as DogModel } from './domain/dog.entity.js';
import { CreateDogDto } from './application/create-dog.dto.js';
import { DogService } from './application/dog.service.js';
import { User } from './infrastructure/security/user.decorator.js';
import { Roles } from './infrastructure/security/roles.decorator.js';

@Controller()
@UsePipes(new ValidationPipe({ transform: true }))
export class AppController {
  constructor(private readonly dogService: DogService) {}

  @Post('dog')
  @Roles('SHELTER')
  async createDog(
    @Body() createDogDto: CreateDogDto,
    @User("sub") shelterId: string,
  ): Promise<DogModel> {
    return this.dogService.createDog(createDogDto, shelterId);
  }

  @Get("dogs")
  async findAll(): Promise<DogModel[]> {
    return this.dogService.findAll();
  }

  @Get("guard")
  @Roles('SHELTER')
  async guardTest(
    @User("sub") userId: string,
    @User("role") userRole: string,
  ): Promise<string> {
    return `You are a adopter: ${userId} and your role is ${userRole}`;
  }
}