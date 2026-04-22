import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller.js';
import { DogService } from './application/dog.service.js';
import { PrismaService } from './infrastructure/prisma/prisma.service.js';
import { DogRepository } from './domain/dog.repository.js';
import { PrismaDogRepository } from './infrastructure/prisma/dog.repository.prisma.js';
import { MlDogPort } from './domain/ml.port.js';
import { MlDogAdapter } from './infrastructure/ml-microservice/ml.adapter.js';

@Module({
  imports: [ConfigModule.forRoot()],
  controllers: [AppController],
  providers: [DogService, PrismaService,
    {
      provide: DogRepository,      // Cuando alguien pida esto (el contrato)...
      useClass: PrismaDogRepository // ... dale esto (la implementación real).
    },
    {
      provide: MlDogPort,
      useClass: MlDogAdapter
    }
  ],
})
export class AppModule {}
