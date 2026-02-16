import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller.js';
import { DogService } from './application/dog.service.js';
import { PrismaService } from './infrastructure/prisma.service.js';
import { PrismaDogRepository } from './infrastructure/dog.repository.prisma.js';
import { DogRepository } from './domain/dog.repository.js';

@Module({
  imports: [ConfigModule.forRoot()],
  controllers: [AppController],
  providers: [DogService, PrismaService,
    {
      provide: DogRepository,      // Cuando alguien pida esto (el contrato)...
      useClass: PrismaDogRepository // ... dale esto (la implementación real).
    },

  ],
})
export class AppModule {}
