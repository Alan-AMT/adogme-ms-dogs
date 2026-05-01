import { Body, Controller, Get, Param, Post, Put, UsePipes, ValidationPipe, UseGuards, Patch, Delete, Query} from '@nestjs/common';
import { DogFindAllCatalog, Dog as DogModel } from './domain/dog.entity.js';
import { CreateDogDto } from './application/create-dog.dto.js';
import { DogService } from './application/dog.service.js';
import { User } from './infrastructure/security/user.decorator.js';
import { Roles } from './infrastructure/security/roles.decorator.js';
import { UserAuthorizationGuard } from './infrastructure/security/user.authorization.guard.js';
import { UpdateDogDto } from './application/update-dog.dto.js';
import { UpdateImageStatusDto } from './application/update-image.dto.js';
import { GoogleOidcGuard } from './infrastructure/security/google-oidc.guard.js';
import { GetDogsCatalogDto } from './application/get-dogs-catalog.dto.js';

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
  ): Promise<{dog: DogModel, uploadUrls: string[]}> {
    return this.dogService.createDog(createDogDto, userOwnerId);
  }
  
  @UseGuards(UserAuthorizationGuard)
  @Put("dog/:id")
  @Roles('shelter')
  async updateDog(
    @Body() updateDogDto: UpdateDogDto,
    @Param('id') dogId: string,
    @User("sub") userOwnerId: string,
  ): Promise<{dog: DogModel, uploadUrls: string[]}> {
    return this.dogService.updateDog(updateDogDto, dogId, userOwnerId);

  }
  
  @UseGuards(UserAuthorizationGuard)
  @Delete("dog/:id")
  @Roles('shelter')
  async deleteDog(
    @Param('id') dogId: string,
    @User("sub") userOwnerId: string,
  ): Promise<void> {
    return this.dogService.deleteDog(dogId, userOwnerId);
  }

  @Get("dog/:id")
  async getDogById(
    @Param('id') dogId: string
  ): Promise<DogModel> {
    return this.dogService.findDogById(dogId);
  }
  
  @Get("dogs")
  async findAll(@Query() query: GetDogsCatalogDto): Promise<{data: DogFindAllCatalog[], total: number, page: number, totalPages: number, limit: number}> {
    return this.dogService.findAllCatalog(query);
  }

  @Get("dogs/shelter/:shelterId")
  async findAllByShelterId(
    @Param('shelterId') shelterId: string
  ): Promise<DogModel[]> {
    return this.dogService.findAllByShelterId(shelterId);
  }
  
  @UseGuards(GoogleOidcGuard)
  @Patch('images/status')
  updateImageStatus(
    @Body() updateImageStatusDto: UpdateImageStatusDto,
  ): Promise<void> {
    return this.dogService.updateImageStatus(updateImageStatusDto.imageId, updateImageStatusDto.status);
  }
}