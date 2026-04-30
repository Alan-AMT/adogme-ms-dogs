import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { ImagesPort } from '../domain/images.port.js';
import { MlDogPort } from '../domain/ml.port.js';

@Injectable()
export class DogEventsListener {
  private readonly logger = new Logger(DogEventsListener.name);

  constructor(
    private readonly imagesPort: ImagesPort,
    private readonly mlDogPort: MlDogPort
  ) {}

  @OnEvent('images.deleted', { async: true })
  async handleImageDeletion(dogId: string, imageIds: string[]) {
    // Safety check
    if (!imageIds || imageIds.length === 0) return;

    const maxRetries = 2; // 1 initial attempt + 2 retries = 3 total attempts
    
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        await this.imagesPort.deleteImagesByIds(dogId, imageIds);
        
        // If it succeeds, log it and EXIT the function
        this.logger.log(`Successfully deleted ${imageIds.length} images from bucket.`);
        return; 
        
      } catch (error) {
        if (attempt === maxRetries) {
          // If we've exhausted all retries, log it as an error
          this.logger.error(`Failed to delete images after ${maxRetries} retries: ${error.message}`, error.stack);
          return;
        }
        
        this.logger.warn(`Attempt ${attempt + 1} to delete images failed. Retrying in 2 seconds...`);
        
        // Wait for 2000 milliseconds (2 seconds) before the loop continues to the next attempt
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }
  }

  @OnEvent('dog.deleted', { async: true })
  async handleDogDeleted(dogId: string) {
    // Safety check
    if (!dogId) return;

    const maxRetries = 2; 

    // 1. Delete ML Dog
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        await this.mlDogPort.deleteMlDog(dogId);
        this.logger.log(`Successfully deleted ML dog ${dogId}`);
        break; // Success, exit this loop
      } catch (error) {
        if (attempt === maxRetries) {
          this.logger.error(`Failed to delete ML dog after ${maxRetries} retries: ${error.message}`, error.stack);
        } else {
          this.logger.warn(`Attempt ${attempt + 1} to delete ML dog failed. Retrying in 2 seconds...`);
          await new Promise(resolve => setTimeout(resolve, 2000));
        }
      }
    }
    
    // 2. Delete Dog Images
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        await this.imagesPort.deleteDogImages(dogId);
        this.logger.log(`Successfully deleted all images for dog ${dogId}`);
        break; // Success, exit this loop
      } catch (error) {
        if (attempt === maxRetries) {
          this.logger.error(`Failed to delete images after ${maxRetries} retries: ${error.message}`, error.stack);
        } else {
          this.logger.warn(`Attempt ${attempt + 1} to delete images failed. Retrying in 2 seconds...`);
          await new Promise(resolve => setTimeout(resolve, 2000));
        }
      }
    }
  }
}
