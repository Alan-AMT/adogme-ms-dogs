export abstract class ImagesPort {
    abstract generateUploadLinks(dogId: string, imageIds: string[]): Promise<string[]>;
    abstract deleteDogImages(dogId: string): Promise<void>;
    abstract deleteImagesByIds(dogId: string, imageIds: string[]): Promise<void>;
}