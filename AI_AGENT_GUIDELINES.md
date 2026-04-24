# Hexagonal Architecture Guidelines for NestJS

This repository follows a strict Hexagonal Architecture pattern using NestJS, Prisma, and Class-Validator. When creating new endpoints or features, follow the flow described below carefully.

## 1. Domain Layer (`src/domain/`)
The domain layer is the core of the application. It contains business models (entities) and the definition of outgoing ports (abstract repositories).

- **Entities**: Create your entity file (e.g., `feature.entity.ts`). It should be a class representing the true business model.
- **Repository Interface**: Create an abstract repository class (e.g., `feature.repository.ts`). This acts as the port that the application layer will use to communicate with the database adapter.

## 2. Application Layer (`src/application/`)
This layer handles the use cases and business logic.

- **DTOs**: Create your Data Transfer Objects (e.g., `create-feature.dto.ts`) using `class-validator` to strictly type and validate the incoming payload for the endpoint.
- **Service**: Create your `@Injectable()` service (e.g., `feature.service.ts`) containing the core business logic.
  - **Dependencies**: The service should have the abstract repository (`FeatureRepository`) injected.
  - **Entity Creation**: On create operations, the service function should create a new instance of the entity. You need to generate a new UUID (using the appropriate library), and set required metadata such as creation and update dates directly within the entity instance, along with filling the DTO fields.
  - **Repository Interaction**: The service then passes the entity instance to the repository to be saved. The repository should save the instance but **not return anything**.
  - **Response**: The service should then return the instantiated entity back down to the controller.
  - **Entity Query**: On query operations, the service function should query the repository and return domain entity objects (created from the repository response).

## 3. Infrastructure Layer (`src/infrastructure/`)
This layer handles external adapters, such as the database (Prisma).

- **Prisma Repository**: Create an implementation of the abstract repository (e.g., `feature.repository.prisma.ts`) that uses Prisma to interact with the database. This implements the previously created repository abstract class.

## 4. Presentation / Controllers
- **Controller**: Modify or create controllers to handle HTTP requests (e.g., `POST /feature`). 
- The controller will only receive the request, validate the payload via the DTO, pass the data to the appropriate service function, and return the result logic computed by the service.

## API Error Handling & Logging
- Keep the API expressive on errors! Since this application runs in the cloud, make sure any exception handling is clear.
- Use explicit `try/catch` blocks.
- Throw appropiate HTTP status codes using NestJS exceptions (e.g., `BadRequestException`, `NotFoundException`, `InternalServerErrorException`) so that the API is expressive.
- Print detailed and useful logs for errors, allowing quick debugging in cloud logs.

---

### Example End-to-End Workflow: `create-applicant`

1. **Schema**: Add the model to `schema.prisma`.
2. **DTO**: Create `src/application/create-applicant.dto.ts`.
3. **Domain**: Create `src/domain/applicant.entity.ts` and abstract `src/domain/applicants.repository.ts`.
4. **Adapter**: Create `src/infrastructure/applicants.repository.prisma.ts` realizing `ApplicantsRepository`.
5. **Service**: Create `src/application/applicants.service.ts` (`@Injectable()`). Inject `ApplicantsRepository`. Inside `createApplicant()`, instantiate the `Applicant` entity, generate a UUID, populate DTO fields and dates, pass to the repository, and return the entity.
6. **Controller**: Ensure the controller (e.g., `POST /applicant`) calls `ApplicantsService.createApplicant()`.

---
