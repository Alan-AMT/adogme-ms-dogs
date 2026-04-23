import { Test, TestingModule } from '@nestjs/testing';
import { DogService } from './dog.service.js';
import { PrismaDogRepository } from '../infrastructure/prisma/dog.repository.prisma.js';
import { PrismaService } from '../infrastructure/prisma/prisma.service.js';
import { DogRepository } from '../domain/dog.repository.js';
import { ConfigModule } from '@nestjs/config';
import { CreateDogDto } from './create-dog.dto.js';
import { DogSex, DogSize, DogStatus, EnergyLevel, FurLength, PersonalityCategory } from '../domain/dog.entity.js';
import { MlDogPort } from '../domain/ml.port.js';
import { MlDogAdapter } from '../infrastructure/ml-microservice/ml.adapter.js';

describe('DogService Integration (Prisma DB)', () => {
  let service: DogService;
  let prisma: PrismaService;

  // Usa valores reales que se encuentran típicamente en tu DB o
  // valores dummy que se puedan insertar si no hay validación de constraints FK muy estrictos.
  const userOwnerId = 'test-user-owner-id';
  const shelterId = 'test-shelter-id'; // Este podría fallar si tu BD exige que exista en otra tabla. Rellénalo si existe validación FK
  
  let createdDogId: string;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [ConfigModule.forRoot()],
      providers: [
        DogService,
        PrismaService,
        {
          provide: DogRepository,
          useClass: PrismaDogRepository, // Se bindea la interfaz al repository de Infraestructura
        },
        {
          provide: MlDogPort,
          useClass: MlDogAdapter
        }
      ],
    }).compile();

    service = module.get<DogService>(DogService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  afterAll(async () => {
    // Si bien mencionaste que tú manejarás la limpieza, me aseguro de cortar la conexión de Prisma para que Jest termine bien
    await prisma.$disconnect();
  });

  describe('createDog', () => {
    it('should insert a dog into the development DB and save relations', async () => {
      const createDto: CreateDogDto = {
        name: 'Firulais Integration test',
        breed: 'Mestizo',
        age: 3,
        shelterId: shelterId,
        weightKg: 15,
        sex: DogSex.macho,
        size: DogSize.mediano,
        energyLevel: EnergyLevel.alta,
        description: 'Un perro muy activo',
        personality: [{ label: 'Juguetón Int Test', category: PersonalityCategory.actividad }],
        goodWithKids: true,
        goodWithDogs: true,
        goodWithCats: false,
        sterilized: true,
        needsYard: true,
        isVaccinated: true,
        isDewormed: true,
        furLength: FurLength.corto,
        vaccinations: [
          { name: 'Rabia', date: new Date('2025-01-01').toISOString(), nextDose: null, verified: true }
        ],
        health: 'Saludable',
        photo: 'http://foto.com/firulais.jpg',
        breed2: null,
        shelterName: 'Refugio Amigo',
        shelterLogo: 'http://logo.com/refugio.png',
        adoptionFee: 100,
      };

      const result = await service.createDog(createDto, userOwnerId);
      createdDogId = result.id;

      expect(result).toBeDefined();
      expect(result.id).toBeDefined();
      expect(result.name).toBe('Firulais Integration test');

      // Comprobar que en Prisma el objeto fue creado realmente con sus tags y vacunas
      const persistedDog = await prisma.dog.findUnique({
        where: { id: createdDogId },
        include: { personality: true, vaccinations: true }
      });

      expect(persistedDog).toBeDefined();
      expect(persistedDog?.personality.length).toBeGreaterThanOrEqual(1);
      expect(persistedDog?.vaccinations).toHaveLength(1);
    });

    it('should create a dog without personality and without vaccinations', async () => {
      const createDto: CreateDogDto = {
        name: 'Firulais Sin Nada',
        breed: 'Mestizo',
        age: 1,
        shelterId: shelterId,
        weightKg: 10,
        sex: DogSex.macho,
        size: DogSize.pequeño,
        energyLevel: EnergyLevel.baja,
        description: 'Un perro tranquilo',
        personality: [],
        goodWithKids: true,
        goodWithDogs: true,
        goodWithCats: true,
        sterilized: true,
        needsYard: false,
        isVaccinated: false,
        isDewormed: false,
        furLength: FurLength.corto,
        vaccinations: [],
        health: 'Saludable',
        photo: '',
        breed2: null,
        shelterName: null,
        shelterLogo: null,
        adoptionFee: 100,
      };

      const result = await service.createDog(createDto, userOwnerId);
      expect(result).toBeDefined();
      expect(result.id).toBeDefined();

      const persistedDog = await prisma.dog.findUnique({
        where: { id: result.id },
        include: { personality: true, vaccinations: true }
      });
      expect(persistedDog?.personality).toHaveLength(0);
      expect(persistedDog?.vaccinations).toHaveLength(0);
    });

    it('should create a dog with 3 personality tags and no vaccinations', async () => {
      const createDto: CreateDogDto = {
        name: 'Dog Personalidad Libre',
        breed: 'Mestizo',
        age: 2,
        shelterId: shelterId,
        weightKg: 12,
        sex: DogSex.hembra,
        size: DogSize.mediano,
        energyLevel: EnergyLevel.alta,
        description: 'Perro muy amigable',
        personality: [
          { label: 'Juguetón Int Test', category: PersonalityCategory.actividad }, 
          { label: 'Travieso Int Test', category: PersonalityCategory.caracter }, 
          { label: 'Timido Int Test', category: PersonalityCategory.socializacion }
        ],
        goodWithKids: true,
        goodWithDogs: true,
        goodWithCats: true,
        sterilized: true,
        needsYard: true,
        isVaccinated: true,
        isDewormed: true,
        furLength: FurLength.mediano,
        vaccinations: [],
        health: 'Sano',
        photo: '',
        breed2: null,
        shelterName: null,
        shelterLogo: null,
        adoptionFee: 100,
      };

      const result = await service.createDog(createDto, userOwnerId);
      expect(result).toBeDefined();

      const persistedDog = await prisma.dog.findUnique({
        where: { id: result.id },
        include: { personality: true }
      });
      expect(persistedDog?.personality.length).toBeGreaterThanOrEqual(3);
    });
  });

  describe('findAll', () => {
    it('should list multiple dogs including the newly created one', async () => {
      const result = await service.findAll();
      
      expect(result.length).toBeGreaterThan(0);
      const newDogInList = result.find(d => d.id === createdDogId);
      expect(newDogInList).toBeDefined();
      expect(newDogInList?.name).toBe('Firulais Integration test');
    });
  });

  describe('updateDog', () => {
    it('should update a dog changing all values, leaving vaccinations and personality empty', async () => {
      const allDogs = await service.findAll();
      if (allDogs.length > 0) {
        const dogToUpdate = allDogs[0];
        
        const updateDto = {
          name: 'Firulais Actualizado Vacio',
          breed: 'Pug',
          age: 4,
          shelterId: shelterId,
          weightKg: 8,
          sex: DogSex.macho,
          size: DogSize.pequeño,
          energyLevel: EnergyLevel.baja,
          description: 'Pug modificado sin nada',
          personality: [],
          goodWithKids: false,
          goodWithDogs: false,
          goodWithCats: false,
          sterilized: true,
          needsYard: false,
          isVaccinated: false,
          isDewormed: false,
          furLength: FurLength.corto,
          vaccinations: [],
          health: 'Regular',
          photo: '',
          breed2: null,
          shelterName: null,
          shelterLogo: null,
          adoptionFee: 100,
        };

        const result = await service.updateDog(updateDto, dogToUpdate.id, userOwnerId);
        expect(result.name).toBe('Firulais Actualizado Vacio');
        
        const persistedDog = await prisma.dog.findUnique({
          where: { id: dogToUpdate.id },
          include: { personality: true, vaccinations: true }
        });
        
        expect(persistedDog?.name).toBe('Firulais Actualizado Vacio');
        expect(persistedDog?.personality).toHaveLength(0);
        expect(persistedDog?.vaccinations).toHaveLength(0);
      }
    });

    it('should update a dog setting 3 vaccines and 4 personality tags', async () => {
      const allDogs = await service.findAll();
      if (allDogs.length > 0) {
        const dogToUpdate = allDogs[0];

        const updateDto = {
          name: 'Firulais Full Equipado',
          breed: 'Pastor',
          age: 2,
          shelterId: shelterId,
          weightKg: 20,
          sex: DogSex.hembra,
          size: DogSize.grande,
          energyLevel: EnergyLevel.muy_alta,
          description: 'Pastor con historial completo',
          personality: [
            { label: 'Juguetón Int Test', category: PersonalityCategory.actividad }, 
            { label: 'Travieso Int Test', category: PersonalityCategory.caracter }, 
            { label: 'Timido Int Test', category: PersonalityCategory.socializacion },
            { label: 'Sin entrenamiento Int Test', category: PersonalityCategory.entrenamiento }
          ],
          goodWithKids: true,
          goodWithDogs: true,
          goodWithCats: true,
          sterilized: false,
          needsYard: true,
          isVaccinated: true,
          isDewormed: true,
          furLength: FurLength.largo,
          vaccinations: [
            { name: 'Vacuna 1', date: new Date('2025-01-01').toISOString(), nextDose: null, verified: true },
            { name: 'Vacuna 2', date: new Date('2025-02-01').toISOString(), nextDose: null, verified: true },
            { name: 'Vacuna 3', date: new Date('2025-03-01').toISOString(), nextDose: null, verified: true }
          ],
          health: 'Excelente',
          photo: '',
          breed2: null,
          shelterName: null,
          shelterLogo: null,
          adoptionFee: 100,
        };

        const result = await service.updateDog(updateDto, dogToUpdate.id, userOwnerId);
        expect(result.name).toBe('Firulais Full Equipado');
        
        const persistedDog = await prisma.dog.findUnique({
          where: { id: dogToUpdate.id },
          include: { personality: true, vaccinations: true }
        });
        
        expect(persistedDog).toBeDefined();
        // Puede que existieran otras personalidades si las combinaste, pero mínimo deben estar estas 4
        expect(persistedDog?.personality.length).toBeGreaterThanOrEqual(4);
        expect(persistedDog?.vaccinations).toHaveLength(3);
      }
    });
  });
});
