import { Test, TestingModule } from '@nestjs/testing';
import { jest } from '@jest/globals';
import { DogService } from './dog.service.js';
import { DogRepository } from '../domain/dog.repository.js';
import {
  Dog,
  DogSex,
  DogSize,
  DogStatus,
  EnergyLevel,
  FurLength,
  PersonalityCategory,
  PersonalityTag,
  Vaccination,
} from '../domain/dog.entity.js';
import {
  CreateDogDto,
  PersonalityDto,
  VaccinationDto,
} from './create-dog.dto.js';
import { UpdateDogDto } from './update-dog.dto.js';

// Mock UUID testing without mockModule to simply check expect.any(String)
class MockDogRepository implements DogRepository {
  async findAllCatalog(filters: any, page: number, limit: number): Promise<{ data: Dog[], total: number }> { return { data: [], total: 0 }; }

  findAllByShelterId(shelterId: string): Promise<Dog[]> {
    throw new Error('Method not implemented.');
  }
  public dogs: Map<string, Dog> = new Map();
  public personalityTags: Map<string, PersonalityTag> = new Map();
  public vaccinations: Map<string, Vaccination> = new Map();

  async createDog(dog: Dog): Promise<void> {
    this.dogs.set(dog.id, dog);
    // Simula que la base de datos almacena las relaciones (aunque en el service real la insercion en base de datos
    // a veces lo maneja en un solo query a prisma, vamos a guardar en memoria las partes si no estuviere).
  }

  async findAll(): Promise<Dog[]> {
    return Array.from(this.dogs.values());
  }

  async findDogById(id: string): Promise<Dog> {
    const dog = this.dogs.get(id);
    if (!dog) throw new Error('Dog not found');
    return dog;
  }

  async updateDog(dog: Dog): Promise<void> {
    if (!this.dogs.has(dog.id)) throw new Error('Dog not found');
    this.dogs.set(dog.id, dog);
  }

  async findPersonalityTagsByLabel(
    labels: string[],
  ): Promise<PersonalityTag[]> {
    return Array.from(this.personalityTags.values()).filter((tag) =>
      labels.includes(tag.label),
    );
  }

  async createPersonalityTags(tags: PersonalityTag[]): Promise<void> {
    tags.forEach((tag) => this.personalityTags.set(tag.id, tag));
  }

  async deleteAllDogVaccinations(dogId: string): Promise<void> {
    for (const [id, vac] of this.vaccinations.entries()) {
      if (vac.dogId === dogId) {
        this.vaccinations.delete(id);
      }
    }
  }

  async createAndLinkVaccinations(vaccinations: Vaccination[]): Promise<void> {
    vaccinations.forEach((vac) => this.vaccinations.set(vac.id, vac));
  }
}

describe('DogService', () => {
  let service: DogService;
  let repository: MockDogRepository;

  const userOwnerId = 'mock-user-owner-id';
  const shelterId = 'mock-shelter-id';

  beforeEach(async () => {
    repository = new MockDogRepository();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DogService,
        {
          provide: DogRepository,
          useValue: repository,
        },
      ],
    }).compile();

    service = module.get<DogService>(DogService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createVaccinationsDomainInstances', () => {
    it('should map dtos to Vaccination entities correctly', () => {
      const dogId = 'dog-id';
      const dto: VaccinationDto[] = [
        {
          name: 'Rabia',
          date: new Date('2025-01-01').toISOString(),
          nextDose: new Date('2026-01-01').toISOString(),
          verified: true,
        },
      ];

      const result = service.createVaccinationsDomainInstances(dogId, dto);
      expect(result).toHaveLength(1);
      expect(result[0]).toBeInstanceOf(Vaccination);
      expect(result[0].name).toBe('Rabia');
      expect(result[0].dogId).toBe(dogId);
      expect(result[0].id).toEqual(expect.any(String));
    });
  });

  describe('createAndGetPersonalityTags', () => {
    it('should create only non-existing tags and return all', async () => {
      const dogId = 'dog-id';
      const existingTag = PersonalityTag.createPersonalityTag({
        id: 'existing-id',
        dogId: null,
        label: 'Juguetón',
        category: PersonalityCategory.actividad,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      repository.personalityTags.set(existingTag.id, existingTag);

      const dtoTags: PersonalityDto[] = [
        { label: 'Juguetón', category: PersonalityCategory.actividad }, // Existe
        { label: 'Tranquilo', category: PersonalityCategory.caracter }, // No existe
      ];

      const spyCreate = jest.spyOn(repository, 'createPersonalityTags');

      const result = await service.createAndGetPersonalityTags(dogId, dtoTags);

      expect(result).toHaveLength(2);
      expect(result.some((t) => t.id === 'existing-id')).toBeTruthy();
      expect(
        result.some((t) => typeof t.id === 'string' && t.id !== 'existing-id'),
      ).toBeTruthy();
      expect(spyCreate).toHaveBeenCalledTimes(1);
      const createdArg = spyCreate.mock.calls[0][0];
      expect(createdArg).toHaveLength(1);
      expect(createdArg[0].label).toBe('Tranquilo');
    });
  });

  describe('createDog', () => {
    it('should correctly process Dto and call repository.createDog', async () => {
      const createDto: CreateDogDto = {
        name: 'Firulais',
        breed: 'Mestizo',
        age: 3,
        shelterId: shelterId,
        weightKg: 15,
        sex: DogSex.macho,
        size: DogSize.mediano,
        energyLevel: EnergyLevel.alta,
        description: 'Un perro muy activo',
        personality: [
          { label: 'Juguetón', category: PersonalityCategory.actividad },
        ],
        goodWithKids: true,
        goodWithDogs: true,
        goodWithCats: false,
        sterilized: true,
        needsYard: true,
        isVaccinated: true,
        isDewormed: true,
        furLength: FurLength.corto,
        vaccinations: [],
        health: 'Saludable',
        photo: 'http://foto.com/firulais.jpg',
        breed2: null,
        shelterName: 'Refugio Amigo',
        shelterLogo: 'http://logo.com/refugio.png',
        adoptionFee: 100,
      };

      const spyCreateRepo = jest.spyOn(repository, 'createDog');

      const result = await service.createDog(createDto, userOwnerId);

      expect(result).toBeInstanceOf(Dog);
      expect(result.id).toEqual(expect.any(String));
      expect(result.status).toBe(DogStatus.disponible);
      expect(spyCreateRepo).toHaveBeenCalledWith(result);
    });
  });

  describe('findAll', () => {
    it('should return all dogs from repository', async () => {
      // Setup
      const d = Dog.createDog({
        id: '1',
        userOwnerId,
        shelterId,
        status: DogStatus.disponible,
        name: 'Dog 1',
        breed: 'B1',
        age: 1,
        sex: DogSex.macho,
        size: DogSize.mediano,
        energyLevel: EnergyLevel.alta,
        description: 'D1',
        personality: [],
        goodWithKids: true,
        goodWithDogs: true,
        goodWithCats: true,
        sterilized: false,
        needsYard: false,
        isVaccinated: false,
        isDewormed: false,
        furLength: FurLength.corto,
        vaccinations: [],
        health: 'H1',
        photo: null,
        breed2: null,
        shelterName: null,
        shelterLogo: null,
        weightKg: 10,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      repository.dogs.set(d.id, d);

      const result = await service.findAll();
      expect(result).toHaveLength(1);
      expect(result[0]).toBe(d);
    });
  });

  describe('updateDog', () => {
    it('should update dog properties and call repository.updateDog', async () => {
      // Setup existing
      const existingDogId = 'existing-dog';
      const existingDog = Dog.createDog({
        id: existingDogId,
        userOwnerId,
        shelterId,
        status: DogStatus.disponible,
        name: 'DogOld',
        breed: 'B1',
        age: 1,
        sex: DogSex.macho,
        size: DogSize.mediano,
        energyLevel: EnergyLevel.alta,
        description: 'D1',
        personality: [],
        goodWithKids: true,
        goodWithDogs: true,
        goodWithCats: true,
        sterilized: false,
        needsYard: false,
        isVaccinated: false,
        isDewormed: false,
        furLength: FurLength.corto,
        vaccinations: [],
        health: 'H1',
        photo: null,
        breed2: null,
        shelterName: null,
        shelterLogo: null,
        weightKg: 10,
        createdAt: new Date(),
        updatedAt: new Date('2020-01-01'),
      });
      repository.dogs.set(existingDogId, existingDog);

      const updateDto: UpdateDogDto = {
        name: 'DogNew', // Campo cambiado
        breed: 'B1',
        age: 2, // Campo cambiado
        shelterId,
        weightKg: 10,
        sex: DogSex.macho,
        size: DogSize.mediano,
        energyLevel: EnergyLevel.alta,
        description: 'D1',
        personality: [
          { label: 'Tranquilo', category: PersonalityCategory.caracter },
        ], // Campo cambiado (Tag)
        goodWithKids: true,
        goodWithDogs: true,
        goodWithCats: true,
        sterilized: false,
        needsYard: false,
        isVaccinated: false,
        isDewormed: false,
        furLength: FurLength.corto,
        vaccinations: [],
        health: 'H1',
        photo: 'http://foto.com/nuevo.jpg',
        breed2: null,
        shelterName: null,
        shelterLogo: null,
        adoptionFee: 100,
      };

      const spyUpdateRepo = jest.spyOn(repository, 'updateDog');

      const result = await service.updateDog(updateDto, existingDogId, userOwnerId);

      expect(result.id).toBe(existingDogId);
      expect(result.name).toBe('DogNew');
      expect(result.age).toBe(2);
      expect(result.personality).toHaveLength(1); // Nuevo tag asignado
      expect(spyUpdateRepo).toHaveBeenCalledWith(result);
    });
  });
});
