import { Body, Controller, Get, Param, Post, Put, UsePipes, ValidationPipe} from '@nestjs/common';
import { Dog as DogModel } from './domain/dog.entity.js';
import { CreateDogDto } from './application/create-dog.dto.js';
import { DogService } from './application/dog.service.js';
import { User } from './infrastructure/security/user.decorator.js';
import { Roles } from './infrastructure/security/roles.decorator.js';
import { UseGuards } from '@nestjs/common';
// import { RolesGuard } from './infrastructure/security/roles.guard.js';
import { UserAuthorizationGuard } from './infrastructure/security/user.authorization.guard.js';
import { UpdateDogDto } from './application/update-dog.dto.js';

@Controller()
@UsePipes(new ValidationPipe({ transform: true }))
export class AppController {
  constructor(private readonly dogService: DogService) {}
  
  @UseGuards(UserAuthorizationGuard)
  @Post('dog')
  @Roles('SHELTER')
  async createDog(
    @Body() createDogDto: CreateDogDto,
    @User("sub") shelterId: string,
  ): Promise<DogModel> {
    return this.dogService.createDog(createDogDto, shelterId);
  }
  
  @UseGuards(UserAuthorizationGuard)
  @Put("dog/:id")
  @Roles('SHELTER')
  async updateDog(
    @Body() updateDogDto: UpdateDogDto,
    @Param('id') dogId: string
  ): Promise<DogModel> {
    return this.dogService.updateDog(updateDogDto, dogId);
  }
  
  @Get("dogs")
  async findAll(): Promise<DogModel[]> {
    return this.dogService.findAll();
  }
  
  @UseGuards(UserAuthorizationGuard)
  @Get("guard")
  @Roles('ADOPTER')
  async guardTest(
    @User("sub") userId: string,
    @User("role") userRole: string,
  ): Promise<string> {
    return `You are a adopter: ${userId} and your role is ${userRole}`;
  }
}