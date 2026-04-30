export abstract class ImagesPort {
    abstract generateUploadLinks(dogId: string, imageExtensions: string[]): Promise<string[]>;
    abstract deleteImages(dogId: string): Promise<void>;
}