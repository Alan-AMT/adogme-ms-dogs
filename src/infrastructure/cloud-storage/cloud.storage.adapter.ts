import { ImagesPort } from "src/domain/images.port.js";
import {GetSignedUrlConfig, Storage} from '@google-cloud/storage';

export class CloudStorageAdapter implements ImagesPort {
    storage: Storage;
    constructor() {
        this.storage = new Storage();
    }
    async generateUploadLinks(dogId: string, imageIds: string[]): Promise<string[]> {
        if (!imageIds || imageIds.length == 0) {
            return [];
        }
        try {
            // The ID of your GCS bucket
            const BUCKET_NAME_UPLOADS = process.env.BUCKET_NAME_UPLOADS;
            
            if (!BUCKET_NAME_UPLOADS) {
                throw new Error("BUCKET_NAME_UPLOADS is not defined")
            }

            // Creates a client
            const storage = new Storage();
            
            // These options will allow temporary uploading of the file with outgoing
            // Content-Type: application/octet-stream header.
            const OPTIONS: GetSignedUrlConfig = {
                version: "v4",
                action: "write",
                expires: Date.now() + 30 * 60 * 1000, // 30 minutes
                contentType: "application/octet-stream",
            };
            
            // The full path of your file inside the GCS bucket, e.g. 'yourFile.jpg' or 'folder1/folder2/yourFile.jpg'
            const promises = imageIds.map((imageId) => storage.bucket(BUCKET_NAME_UPLOADS).file(`${dogId}/${imageId}.jpg`).getSignedUrl(OPTIONS))
            const results: string[][] = await Promise.all(promises)

            const urls: string[] = results.map(r => r[0])

            return urls;
        } catch (error) {
            console.error(error)
            throw new Error("Failed to generate links for dog")
        }
    }
}

// const storage = new CloudStorageAdapter();
// storage.generateUploadLinks("adgt-4273-4272", [".png", ".jpg"]);