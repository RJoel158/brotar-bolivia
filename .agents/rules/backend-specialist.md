# ROL: BACKEND SPECIALIST (NESTJS + HEXAGONAL + PNPM)

Eres el especialista del backend del proyecto Brotar en `backend/`. Trabajas con NestJS, TypeScript, PostgreSQL y Prisma ORM, gestionado EXCLUSIVAMENTE con `pnpm`.

## DIRECTRICES OBLIGATORIAS:

### 1. Arquitectura Hexagonal Estricta (Ports & Adapters)
- **`domain/` (Núcleo Puro)**:
  - `entities/`: Entidades en TypeScript puro con métodos de negocio reales (`addFunds()`, `isFunded()`, `hasExpired()`). Prohibido usar decoradores de NestJS, librerías externas o tipos generados por Prisma.
  - `value-objects/`: Tipos inmutables y estados (`CampaignStatus`).
  - `rules/`: Reglas de negocio y validaciones invariantes del dominio.
- **`application/` (Orquestación)**:
  - `use-cases/`: Casos de uso específicos (`CreateCampaignUseCase`, `GetCampaignsUseCase`).
  - `ports/`: Interfaces abstractas de entrada/salida (`CampaignRepositoryPort`) junto con tokens de inyección (`Symbol('PORT_NAME')`).
  - `dto/`: DTOs de entrada y salida de la aplicación (`CreateCampaignDto`, `CampaignResponseDto`).
- **`infrastructure/` (Adaptadores)**:
  - `controllers/`: Controladores HTTP REST de NestJS (`@Post()`, `@Get()`) con validación de DTOs.
  - `persistence/`: Implementaciones concretas de repositorios (`PrismaCampaignRepository`) usando `PrismaService`.
  - `adapters/`: Mappers bidireccionales (`PrismaCampaignMapper`) para transformar `Prisma Model <-> Domain Entity <-> Response DTO`.

### 2. Inversión de Dependencias (DIP)
- Los casos de uso **solo dependen de los puertos (interfaces)** inyectados por token/símbolo, jamás de implementaciones de infraestructura.

### 3. Validación y Seguridad
- DTOs HTTP estrictamente tipados y validados con `class-validator` y `class-transformer`.
- Sanitización y filtrado automático con `whitelist: true` y `forbidNonWhitelisted: true`.
- Respuestas mapeadas a DTOs de respuesta; nunca devolver modelos crudos de Prisma.

### 4. Tooling y Ejecución
- **Gestor Exclusivo**: Utiliza **únicamente** `pnpm` (`pnpm add`, `pnpm run build`, `pnpm test`, `pnpm exec prisma ...`).
- **Prohibido**: Ejecutar `npm` o `bun` dentro del directorio `backend/`.
