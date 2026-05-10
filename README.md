# SGD - Sistema de Gestión Documental

## Proyecto

Sistema de gestión documental desarrollado como "Hola Mundo" para la asignatura **Gestión de Proyectos de Software** — Universidad del Bío-Bío, 2026.

## Stack Tecnológico

| Capa | Tecnología | Versión |
|------|------------|---------|
| Frontend | React + Vite | React 18 |
| Backend | NestJS + TypeScript (Microservicios) | NestJS 10 |
| Base de Datos | PostgreSQL | 15 |
| Caché | Redis | 7 |
| ORM | TypeORM | 0.3 |
| Comunicación | TCP (@nestjs/microservices) | - |
| Docs API | Swagger / OpenAPI (centralizado en Gateway) | 7 |
| Contenedores | Docker + Docker Compose | - |

## Arquitectura de Microservicios

```
Frontend (React) → HTTP → API Gateway (:3000) → TCP → ms-auth (:3001)
                                                    → ms-mantenedores (:3002)
                                                    → ms-documentos (:3003)
                                                    → ms-requerimientos (:3004)
```

| Servicio | Puerto | Transporte | Responsabilidad |
|----------|--------|------------|-----------------|
| `api-gateway` | 3000 | HTTP | Punto de entrada, Swagger, JWT, CORS, Agregación |
| `ms-auth` | 3001 | TCP | Login, JWT, CRUD usuarios |
| `ms-mantenedores` | 3002 | TCP | Contratistas, Áreas, Proyectos |
| `ms-documentos` | 3003 | TCP | Gestión documental y archivos físicos |
| `ms-requerimientos` | 3004 | TCP | Gestión de requerimientos (tickets) y estados |

> **Nota de Arquitectura**: Cada microservicio es **100% independiente** y aislado. No existen dependencias de carpetas físicas como `shared/`. Cada servicio define sus constantes y configuraciones internamente en su carpeta `src/common/constants.ts`. El orquestador (`api-gateway`) se encarga de la agregación de datos (API Composition) cruzando información de múltiples microservicios si es necesario.

## 🚀 Inicio Rápido

### Opción 1: Docker Compose (recomendado)

```bash
# 1. Configurar variables de entorno
cp .env.example .env

# 2. Levantar todo el stack
docker compose up --build
```

- Frontend: http://localhost:8040
- Backend API: http://localhost:8040/api
- Swagger Docs: http://localhost:8040/api/docs

### Opción 2: Desarrollo local

```bash
# 1. Instalar dependencias de cada servicio aisladamente
cd backend/api-gateway && npm install
cd ../ms-auth && npm install
cd ../ms-mantenedores && npm install
cd ../ms-documentos && npm install
cd ../ms-requerimientos && npm install

# 2. Instalar frontend
cd ../../frontend && npm install
```

```bash
# Terminal 1 — ms-auth
cd backend/ms-auth && npm run start:dev

# Terminal 2 — ms-mantenedores
cd backend/ms-mantenedores && npm run start:dev

# Terminal 3 — ms-documentos
cd backend/ms-documentos && npm run start:dev

# Terminal 4 — ms-requerimientos
cd backend/ms-requerimientos && npm run start:dev

# Terminal 5 — API Gateway
cd backend/api-gateway && npm run start:dev

# Terminal 6 — Frontend
cd frontend && npm run dev
```

> **Nota:** Para desarrollo local necesitas PostgreSQL corriendo en `localhost:5432` con la base de datos `sgd_db`. Sin PostgreSQL, los servicios usarán SQLite automáticamente.

## Estructura del Proyecto

```
├── backend/
│   ├── api-gateway/         # Gateway HTTP (Swagger, JWT, CORS, Composición)
│   ├── ms-auth/             # Microservicio de autenticación
│   ├── ms-mantenedores/     # Microservicio de mantenedores
│   ├── ms-documentos/       # Microservicio de documentos
│   └── ms-requerimientos/   # Microservicio de requerimientos (tickets)
├── frontend/                # React + Vite
├── docker-compose.yml
├── .env.example
└── guia_microservicios.md   # Guía oficial para crear nuevos microservicios
```
## HU Totalmente Listas

- **HU-01: CRUD de Contratistas**
- **HU-02: CRUD de Áreas**
- **HU-03: CRUD de Proyectos**
- **HU-04: CRUD de Categorias**
- **HU-05: CRUD de Subtipos**
- **HU-06: Integridad Jerárquica**
- **HU-07: Carga de Documentos**
- **HU-14: Requerimientos cambian de estado.**
- **HU-15: Bandeja de tareas con requerimientos pendientes.** (Verificar posteriormente con el frontend final)
- **HU-25: Login de Usuarios**
- **HU-26: Gestión de Usuarios internos**
- **HU-28: Colaborador con formulario de requerimiento con campos predefinidos.** (Verificar posteriormente con el frontend final)

- **HU-N1: Crear Requerimiento**
- **HU-N2: Clasificar Requerimiento mediante Categoría y Subtipo**
- **HU-N3: Control de Visibilidad por Contratista**




  
## Equipo

- Diego Alamos Vallejos
- Marcelo Cid Cisternas
- Carlos Vasquez Rodriguez
