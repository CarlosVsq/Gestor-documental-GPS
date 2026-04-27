# SGD - Sistema de Gestión Documental

## Proyecto

Sistema de gestión documental desarrollado como "Hola Mundo" para la asignatura **Gestión de Proyectos de Software** — Universidad del Bío-Bío, 2026.

## Stack Tecnológico

| Capa | Tecnología | Versión |
|------|------------|---------|
| Frontend | React + Vite | React 18 |
| Backend | NestJS + TypeScript | NestJS 10 |
| Base de Datos | PostgreSQL | 15 |
| Caché | Redis | 7 |
| ORM | TypeORM | 0.3 |
| Testing | Jest | 29 |
| Docs API | Swagger / OpenAPI | 7 |
| Contenedores | Docker + Docker Compose | - |
| CI/CD | GitHub Actions + GHCR | - |

## 🚀 Inicio Rápido

### Opción 1: Docker Compose (recomendado)

```bash
docker-compose up --build
```

- Frontend: http://localhost
- Backend API: http://localhost:3000/api
- Swagger Docs: http://localhost:3000/api/docs

### Opción 2: Desarrollo local

```bash
# Terminal 1 — Backend
cd backend
npm install
npm run start:dev

# Terminal 2 — Frontend
cd frontend
npm install
npm run dev
```

> **Nota:** Necesitas PostgreSQL corriendo en `localhost:5432` con la base de datos `sgd_db`.

## Tests

```bash
cd backend
npm run test
```

## Historia de Usuario Implementada

**HU-01: CRUD de Contratistas**
**HU-02: CRUD de Áreas**
**HU-03: CRUD de Proyectos**
**HU-06: Carga de Documentos**
**HU-18: Login de Usuarios**

## Equipo

- Diego Alamos Vallejos
- Marcelo Cid Cisternas
- Carlos Vasquez Rodriguez
