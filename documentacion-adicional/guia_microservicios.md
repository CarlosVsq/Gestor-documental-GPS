# Guía: Cómo Crear Nuevos Microservicios en el SGD

> Esta guía te enseña paso a paso cómo crear un nuevo microservicio NestJS con transporte TCP, conectarlo al API Gateway, y desplegarlo con Docker. 

---

## Arquitectura Actual

```
Frontend (React) → HTTP → API Gateway (:3000) → TCP → Microservicios aislados
                                                  ├── ms-auth           (:3001)
                                                  ├── ms-mantenedores   (:3002)
                                                  ├── ms-documentos     (:3003)
                                                  └── ms-requerimientos (:3004)
```

**Conceptos clave:**
- **API Gateway**: Único punto de entrada HTTP. Maneja CORS, Swagger, JWT, almacenamiento local inicial de archivos, y realiza **API Composition** (ej. junta un Documento con su respectivo Autor haciendo 2 llamadas TCP).
- **Microservicio Aislado**: Son servicios 100% autocontenidos. No comparten carpetas físicas entre ellos. Solo se comunican vía TCP.
- **Constantes Locales**: Cada servicio define sus propios patrones TCP y enums en su respectivo `src/common/constants.ts`. 
- **RpcException**: En microservicios se usa `RpcException` en vez de `HttpException`. El Gateway traduce estos errores para el cliente.

---

## Receta: Crear un Nuevo Microservicio

### Paso 1: Crear la estructura base del microservicio

El enfoque más limpio es usar el CLI de Nest para generar la estructura dentro de `backend/` y configurar el `package.json` para instalar `@nestjs/microservices`.

```
backend/ms-categorias/
├── src/
│   ├── main.ts
│   ├── app.module.ts
│   ├── common/
│   │   └── constants.ts               ← Constantes y patrones TCP locales
│   ├── categorias/
│   │   ├── categorias.controller.ts   ← @MessagePattern
│   │   ├── categorias.service.ts      ← Lógica de negocio y RpcException
│   │   ├── categorias.module.ts
│   │   ├── categoria.entity.ts
│   │   └── dto/
│   │       ├── create-categoria.dto.ts
│   │       └── update-categoria.dto.ts
├── package.json
├── tsconfig.json
└── Dockerfile
```

### Paso 2: Definir Patrones Locales (`src/common/constants.ts`)

Dentro de tu nuevo microservicio (`backend/ms-categorias/src/common/constants.ts`):

```typescript
// Patrones TCP para este servicio
export const CATEGORIAS_PATTERNS = {
  CREATE: 'categorias.create',
  FIND_ALL: 'categorias.findAll',
  FIND_ONE: 'categorias.findOne',
  UPDATE: 'categorias.update',
  REMOVE: 'categorias.remove',
} as const;
```

### Paso 3: Configurar el `main.ts` (Servidor TCP)

```typescript
import { NestFactory } from '@nestjs/core';
import { Transport, MicroserviceOptions } from '@nestjs/microservices';
import { AppModule } from './app.module';
import { Logger } from '@nestjs/common';

async function bootstrap() {
  const logger = new Logger('ms-categorias');
  const app = await NestFactory.createMicroservice<MicroserviceOptions>(
    AppModule,
    {
      transport: Transport.TCP,
      options: { host: '0.0.0.0', port: 3004 }, // ← PUERTO ÚNICO PARA CADA MS
    },
  );
  await app.listen();
  logger.log('📁 ms-categorias escuchando en TCP :3004');
}
bootstrap();
```

### Paso 4: El Service (lógica y excepciones)

```typescript
import { Injectable } from '@nestjs/common';
import { RpcException } from '@nestjs/microservices';
// ... importaciones TypeORM

@Injectable()
export class CategoriasService {
  // ... constructor ...

  async findOne(id: number): Promise<Categoria> {
    const item = await this.repo.findOne({ where: { id } });
    if (!item) {
      // IMPORTANTE: Se usa RpcException y se envía el statusCode
      throw new RpcException({ statusCode: 404, message: `Categoría #${id} no encontrada` });
    }
    return item;
  }
}
```

### Paso 5: El Controller (Patrones)

```typescript
import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { CategoriasService } from './categorias.service';
import { CATEGORIAS_PATTERNS } from '../common/constants';

@Controller()
export class CategoriasController {
  constructor(private readonly categoriasService: CategoriasService) {}

  @MessagePattern(CATEGORIAS_PATTERNS.CREATE)
  async create(@Payload() createDto: any) {
    return this.categoriasService.create(createDto);
  }
}
```

### Paso 6: Actualizar el API Gateway

El API Gateway necesita conocer los patrones TCP y el nombre del nuevo servicio para poder hablarle.

1. **Agrega las constantes** en `backend/api-gateway/src/common/constants.ts`:
   ```typescript
   export const SERVICE_NAMES = {
     // ... otros
     CATEGORIAS: 'CATEGORIAS_SERVICE',
   } as const;

   export const CATEGORIAS_PATTERNS = {
     CREATE: 'categorias.create',
     // ...
   } as const;
   ```

2. **Registra el cliente** en `backend/api-gateway/src/common/tcp-clients.module.ts`:
   ```typescript
   ClientsModule.register([
     // ... otros clientes
     {
       name: SERVICE_NAMES.CATEGORIAS,
       transport: Transport.TCP,
       options: {
         host: process.env.CATEGORIAS_SERVICE_HOST || 'ms-categorias',
         port: parseInt(process.env.CATEGORIAS_SERVICE_PORT, 10) || 3004,
       },
     },
   ])
   ```

3. **Crea el Controller Proxy** en `backend/api-gateway/src/categorias/categorias-gateway.controller.ts`:
   ```typescript
   import { Controller, Post, Body, Inject, HttpException } from '@nestjs/common';
   import { ClientProxy } from '@nestjs/microservices';
   import { firstValueFrom } from 'rxjs';
   import { SERVICE_NAMES, CATEGORIAS_PATTERNS } from '../common/constants';

   @Controller('categorias')
   export class CategoriasGatewayController {
     constructor(
       @Inject(SERVICE_NAMES.CATEGORIAS) private readonly client: ClientProxy,
     ) {}

     @Post()
     async create(@Body() dto: any) {
       try {
         return await firstValueFrom(this.client.send(CATEGORIAS_PATTERNS.CREATE, dto));
       } catch (error) {
         // TRADUCCIÓN: Convertir RpcException a HttpException HTTP para el frontend
         throw new HttpException(error.message, error.statusCode || 500);
       }
     }
   }
   ```

### Paso 7: El Dockerfile

Como ahora cada microservicio es independiente, el Dockerfile es simple y directo. Crea `backend/ms-categorias/Dockerfile`:

```dockerfile
# ms-categorias Dockerfile
FROM node:20-alpine AS builder

WORKDIR /app
COPY ms-categorias/package*.json ./
RUN npm install
COPY ms-categorias/ ./
RUN npm run build

# Producción
FROM node:20-alpine
WORKDIR /app
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY ms-categorias/package*.json ./

CMD ["node", "dist/main"]
```

### Paso 8: Agregar a `docker-compose.yml`

> **Importante:** El CI tiene un job `validate-compose` que revisa automáticamente que todo directorio `backend/<nombre>/` con `Dockerfile` y `package.json` tenga una entrada correspondiente en `docker-compose.yml`. Si olvidas este paso, el pipeline falla con un error como:
> ```
> ERROR: Los siguientes microservicios no están en docker-compose.yml:
>  - ms-nuevo
> ```

#### Puertos TCP asignados

Cada microservicio necesita un puerto único. Usa el siguiente como referencia:

| Microservicio       | Puerto TCP |
|---------------------|-----------|
| ms-auth             | 3001      |
| ms-mantenedores     | 3002      |
| ms-documentos       | 3003      |
| ms-requerimientos   | 3004      |
| **ms-nuevo**        | **3005**  |

#### Entrada en `docker-compose.yml`

Agrega el bloque del nuevo microservicio antes del bloque `api-gateway`. El formato obligatorio es:

```yaml
  # --- Microservicio Nuevo (TCP :3005) ---
  ms-nuevo:
    image: ghcr.io/carlosvsq/gestor-documental-gps/ms-nuevo:latest
    build:
      context: ./backend
      dockerfile: ms-nuevo/Dockerfile
      network: host
    container_name: sgd-ms-nuevo
    env_file:
      - .env
    environment:
      DB_HOST: ${DB_HOST}
      DB_PORT: ${DB_PORT}
      DB_USERNAME: ${DB_USERNAME}
      DB_PASSWORD: ${DB_PASSWORD}
      DB_DATABASE: ${DB_DATABASE}
    depends_on:
      postgres:
        condition: service_healthy
    networks:
      - sgd-network
```

Luego en el bloque `api-gateway`, agrega las variables de entorno y la dependencia:

```yaml
  api-gateway:
    environment:
      # ... variables existentes ...
      NUEVO_SERVICE_HOST: ms-nuevo
      NUEVO_SERVICE_PORT: 3005
    depends_on:
      # ... dependencias existentes ...
      - ms-nuevo
```

> **Por qué `image:` y `build:` juntos?** En desarrollo local se usa `docker compose up --build` (usa `build:`). En producción el CD hace `docker-compose pull` y `docker-compose up` (usa `image:` de GHCR). Ambos deben estar presentes.

---

## Patrón de Orquestación (API Composition)

Dado que cada base de datos está separada (o al menos sus tablas), a menudo un microservicio **no** tiene toda la información. 

Por ejemplo, `ms-documentos` no conoce los datos del usuario, solo el `autorId`.
Para resolver esto, **el API Gateway hace las uniones (JOINs)**. 

Si requieres unir datos, inyecta dos clientes TCP en tu gateway:

```typescript
// En el Gateway
constructor(
  @Inject(SERVICE_NAMES.DOCUMENTOS) private readonly docClient: ClientProxy,
  @Inject(SERVICE_NAMES.AUTH) private readonly authClient: ClientProxy,
) {}

@Get()
async findAll() {
  const docs = await firstValueFrom(this.docClient.send(DOCUMENTOS_PATTERNS.FIND_ALL, {}));
  const users = await firstValueFrom(this.authClient.send(AUTH_PATTERNS.FIND_ALL_USERS, {}));
  
  // Cruzar la información en memoria
  return docs.map(doc => ({
    ...doc,
    autor: users.find(u => u.id === doc.autorId)
  }));
}
```

## Resumen de Reglas de Oro

1. **NO EXPORTAR/COMPARTIR CARPETAS:** Los microservicios son asilados. No uses cosas de tipo `../../shared`. Es mejor copiar la constante o crear un paquete `npm`.
2. **Gateway es el Jefe HTTP:** Solo el Gateway tiene Swagger, Interceptors, Guards de Autenticación HTTP o Multer.
3. **Manejo de Errores RpcException:** Los microservicios lanzan `new RpcException({ statusCode: 400, message: 'Bad' })` y el Gateway lo recibe como un error y debe hacer `throw new HttpException(error.message, error.statusCode)`.
4. **Construcción en Docker:** El `build context` de Docker es siempre la carpeta `backend/`, y cada `Dockerfile` copia solo su respectiva carpeta interna para mantener un caché óptimo.
