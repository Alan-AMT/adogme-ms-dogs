import { Test, TestingModule } from '@nestjs/testing';
import { AppController } from './app.controller.js';
import { DogService } from './application/dog.service.js';
import { PrismaService } from './infrastructure/prisma.service.js';

describe('AppController', () => {
  let appController: AppController;

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [AppController],
      providers: [DogService, PrismaService],
    }).compile();

    appController = app.get<AppController>(AppController);
  });

  // describe('root', () => {
  //   it('should return "Hello World!"', () => {
  //     expect(appController.getHello()).toBe('Hello World!');
  //   });
  // });
});
