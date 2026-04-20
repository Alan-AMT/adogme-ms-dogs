import { Body, Controller, Get, Param, Post, Put, UsePipes, ValidationPipe, UseGuards} from '@nestjs/common';
import { Dog as DogModel } from './domain/dog.entity.js';
import { CreateDogDto } from './application/create-dog.dto.js';
import { DogService } from './application/dog.service.js';
import { User } from './infrastructure/security/user.decorator.js';
import { Roles } from './infrastructure/security/roles.decorator.js';
import { UserAuthorizationGuard } from './infrastructure/security/user.authorization.guard.js';
import { UpdateDogDto } from './application/update-dog.dto.js';

@Controller('dogs-ms')
@UsePipes(new ValidationPipe({ transform: true }))
export class AppController {
  constructor(private readonly dogService: DogService) {}
  
  @UseGuards(UserAuthorizationGuard)
  @Post('dog')
  @Roles('shelter')
  async createDog(
    @Body() createDogDto: CreateDogDto,
    @User("sub") userOwnerId: string,
  ): Promise<DogModel> {
    return this.dogService.createDog(createDogDto, userOwnerId);
  }
  
  @UseGuards(UserAuthorizationGuard)
  @Put("dog/:id")
  @Roles('shelter')
  async updateDog(
    @Body() updateDogDto: UpdateDogDto,
    @Param('id') dogId: string
  ): Promise<DogModel> {
    return this.dogService.updateDog(updateDogDto, dogId);
  }

  @Get("dog/:dogId")
  async getDogById(
    @Param('dogId') dogId: string
  ): Promise<DogModel> {
    return this.dogService.findDogById(dogId);
  }
  
  @Get("dogs")
  async findAll(): Promise<DogModel[]> {
    return this.dogService.findAll();
  }

  @Get("dogs/shelter/:shelterId")
  async findAllByShelterId(
    @Param('shelterId') shelterId: string
  ): Promise<DogModel[]> {
    return this.dogService.findAllByShelterId(shelterId);
  }
  
  @UseGuards(UserAuthorizationGuard)
  @Get("guard")
  @Roles('applicant')
  async guardTest(
    @User("sub") userId: string,
    @User("role") userRole: string,
  ): Promise<string> {
    return `You are a adopter: ${userId} and your role is ${userRole}`;
  }
}