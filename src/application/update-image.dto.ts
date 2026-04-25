import { IsEnum, IsString } from "class-validator";
import { ImageStatus } from "../domain/image.entity.js";

export class UpdateImageStatusDto {
    @IsString()
    imageId: string;
    @IsEnum(ImageStatus)
    status: ImageStatus;
}