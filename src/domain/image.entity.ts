export class Image {
    constructor(
        public readonly id: string,
        public readonly dogId: string,
        public readonly url: string,
        public readonly status: ImageStatus,
    ) { }

    public static createImage(imageData: { id: string; dogId: string; url: string; status: ImageStatus }): Image {
        return new Image(
            imageData.id,
            imageData.dogId,
            imageData.url,
            imageData.status
        );
    }
}

export enum ImageStatus {
    pending = 'pending',
    accepted = 'accepted',
    rejected = 'rejected',
}
