import { IsString, IsNotEmpty, IsOptional } from 'class-validator';

export class UpdateDogsShelterDataDto {
  @IsString()
  @IsNotEmpty()
  @IsOptional()
  shelterName?: string;

  @IsString()
  @IsNotEmpty()
  @IsOptional()
  shelterLogo?: string;
}
