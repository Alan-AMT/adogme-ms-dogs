import { ImagesPort } from "src/domain/images.port.js";
import { GetSignedUrlConfig, Storage } from '@google-cloud/storage';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class CloudStorageAdapter implements ImagesPort {
    storage: Storage;
    constructor(private readonly configService: ConfigService) {
        this.storage = new Storage();
    }
    async generateUploadLinks(dogId: string, imageIds: string[]): Promise<string[]> {
        if (!imageIds || imageIds.length == 0) {
            return [];
        }
        try {
            // The ID of your GCS bucket
            const BUCKET_NAME_UPLOADS = this.configService.get<string>('BUCKET_NAME_UPLOADS');
            
            if (!BUCKET_NAME_UPLOADS) {
                throw new Error("BUCKET_NAME_UPLOADS is not defined in the environment config")
            }

            // Creates a client
            const storage = new Storage();
            
            const OPTIONS: GetSignedUrlConfig = {
                version: "v4",
                action: "write",
                expires: Date.now() + 30 * 60 * 1000, // 30 minutes
                contentType: "image/*",
            };
            
            // The full path of your file inside the GCS bucket, e.g. 'yourFile.jpg' or 'folder1/folder2/yourFile.jpg'
            const promises = imageIds.map((imageId) => storage.bucket(BUCKET_NAME_UPLOADS).file(`${dogId}/${imageId}.jpg`).getSignedUrl(OPTIONS))
            const results: string[][] = await Promise.all(promises)

            const urls: string[] = results.map(r => r[0])

            return urls;
        } catch (error) {
            console.error(error)
            throw new Error("Failed to generate links for dog" + error.message)
        }
    }

    async deleteDogImages(dogId: string): Promise<void> {
        if (!dogId) {
            return;
        }
        try {
            const BUCKET_NAME_PUBLIC = this.configService.get<string>('BUCKET_NAME_PUBLIC');
            
            if (!BUCKET_NAME_PUBLIC) {
                throw new Error("BUCKET_NAME_PUBLIC is not defined in the environment config")
            }

            // Creates a client
            const storage = new Storage();
            
            const [files] = await storage.bucket(BUCKET_NAME_PUBLIC).getFiles({ prefix: dogId });
            const deletePromises = files.map(file => file.delete());
            await Promise.all(deletePromises);
        } catch (error) {
            console.error(error)
            throw new Error("Failed to delete images for dog: " + error.message)
        }
    }

    async deleteImagesByIds(dogId: string, imageIds: string[]): Promise<void> {
        if (!dogId) {
            return;
        }
        try {
            const BUCKET_NAME_PUBLIC = this.configService.get<string>('BUCKET_NAME_PUBLIC');
            
            if (!BUCKET_NAME_PUBLIC) {
                throw new Error("BUCKET_NAME_PUBLIC is not defined in the environment config")
            }
            const storage = new Storage();
            const promises = imageIds.map((imageId) => storage.bucket(BUCKET_NAME_PUBLIC).file(`${dogId}/${imageId}.jpg`).delete())
            await Promise.all(promises)
        } catch (error) {
            console.error(error)
            throw new Error("Failed to delete image for dog: " + error.message)
        }
    }
}