import { IsArray, IsString, ArrayNotEmpty } from 'class-validator';
import { Transform } from 'class-transformer';

export class GetDogsByIdsDto {
  @Transform(({ value }) => Array.isArray(value) ? value : [value])
  @IsArray()
  @ArrayNotEmpty()
  @IsString({ each: true })
  dogIds: string[];
}
