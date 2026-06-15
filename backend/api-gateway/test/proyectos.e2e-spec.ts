import { INestApplication } from '@nestjs/common';
import { of, throwError } from 'rxjs';
import * as request from 'supertest';
import { buildTestApp, TestClients, tokens } from './helpers/app.helper';

describe('Proyectos (E2E)', () => {
  let app: INestApplication;
  let clients: TestClients;

  beforeAll(async () => {
    ({ app, clients } = await buildTestApp());
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ─── GET /api/proyectos ───────────────────────────────────────────────────

  describe('GET /api/proyectos', () => {
    it('401 sin token', async () => {
      await request(app.getHttpServer()).get('/api/proyectos').expect(401);
    });

    it('200 lista proyectos para un admin (sin filtro)', async () => {
      clients.mantenedores.send.mockReturnValue(
        of({ data: [{ id: 1, nombre: 'Proyecto Alpha', codigo: 'OBR-001' }], total: 1, page: 1, limit: 10 }),
      );

      await request(app.getHttpServer())
        .get('/api/proyectos')
        .set('Authorization', `Bearer ${tokens.admin}`)
        .expect(200);

      const [, payload] = clients.mantenedores.send.mock.calls[0];
      expect(payload.contratistaId).toBeUndefined();
    });

    it('200 filtra por contratistaId cuando el rol es contratista', async () => {
      clients.mantenedores.send.mockReturnValue(
        of({ data: [], total: 0, page: 1, limit: 10 }),
      );

      await request(app.getHttpServer())
        .get('/api/proyectos')
        .set('Authorization', `Bearer ${tokens.contratista}`)
        .expect(200);

      const [, payload] = clients.mantenedores.send.mock.calls[0];
      expect(payload.contratistaId).toBe(1);
    });
  });

  // ─── GET /api/proyectos/stats ─────────────────────────────────────────────

  describe('GET /api/proyectos/stats', () => {
    it('200 retorna estadísticas de proyectos', async () => {
      clients.mantenedores.send.mockReturnValue(
        of({ total: 10, enEjecucion: 4, finalizados: 6 }),
      );

      await request(app.getHttpServer())
        .get('/api/proyectos/stats')
        .set('Authorization', `Bearer ${tokens.supervisor}`)
        .expect(200);
    });
  });

  // ─── GET /api/proyectos/:id ───────────────────────────────────────────────

  describe('GET /api/proyectos/:id', () => {
    it('400 con id no numérico', async () => {
      await request(app.getHttpServer())
        .get('/api/proyectos/abc')
        .set('Authorization', `Bearer ${tokens.admin}`)
        .expect(400);
    });

    it('404 cuando el proyecto no existe', async () => {
      clients.mantenedores.send.mockReturnValue(
        throwError(() => ({ statusCode: 404, message: 'Proyecto no encontrado' })),
      );

      await request(app.getHttpServer())
        .get('/api/proyectos/999')
        .set('Authorization', `Bearer ${tokens.admin}`)
        .expect(404);
    });

    it('200 retorna el proyecto con su área y contratista', async () => {
      clients.mantenedores.send.mockReturnValue(
        of({
          id: 1,
          nombre: 'Proyecto Alpha',
          codigo: 'OBR-001',
          estadoProyecto: 'Ejecución',
          area: { id: 1, nombre: 'Área Obras' },
        }),
      );

      const res = await request(app.getHttpServer())
        .get('/api/proyectos/1')
        .set('Authorization', `Bearer ${tokens.admin}`)
        .expect(200);

      expect(res.body).toHaveProperty('codigo');
    });
  });

  // ─── POST /api/proyectos ──────────────────────────────────────────────────

  describe('POST /api/proyectos', () => {
    it('201 crea un proyecto vinculado a un área', async () => {
      clients.mantenedores.send.mockReturnValue(
        of({ id: 2, nombre: 'Proyecto Beta', codigo: 'OBR-002', areaId: 1 }),
      );

      const res = await request(app.getHttpServer())
        .post('/api/proyectos')
        .set('Authorization', `Bearer ${tokens.admin}`)
        .send({
          nombre: 'Proyecto Beta',
          areaId: 1,
          estadoProyecto: 'En Licitación',
          fechaInicio: '2026-01-01',
          fechaFin: '2026-12-31',
        })
        .expect(201);

      expect(res.body).toHaveProperty('codigo');
    });

    it('404 cuando el área no existe', async () => {
      clients.mantenedores.send.mockReturnValue(
        throwError(() => ({ statusCode: 404, message: 'Área no encontrada' })),
      );

      await request(app.getHttpServer())
        .post('/api/proyectos')
        .set('Authorization', `Bearer ${tokens.admin}`)
        .send({ nombre: 'Proyecto', areaId: 999, estadoProyecto: 'En Licitación', fechaInicio: '2026-01-01', fechaFin: '2026-12-31' })
        .expect(404);
    });
  });

  // ─── PUT /api/proyectos/:id ───────────────────────────────────────────────

  describe('PUT /api/proyectos/:id', () => {
    it('200 actualiza un proyecto', async () => {
      clients.mantenedores.send.mockReturnValue(
        of({ id: 1, nombre: 'Proyecto Alpha v2', estadoProyecto: 'Ejecución' }),
      );

      await request(app.getHttpServer())
        .put('/api/proyectos/1')
        .set('Authorization', `Bearer ${tokens.admin}`)
        .send({ estadoProyecto: 'Ejecución' })
        .expect(200);
    });
  });

  // ─── PATCH /api/proyectos/:id/toggle ─────────────────────────────────────

  describe('PATCH /api/proyectos/:id/toggle', () => {
    it('200 cambia el estado activo/inactivo', async () => {
      clients.mantenedores.send.mockReturnValue(of({ id: 1, activo: false }));

      await request(app.getHttpServer())
        .patch('/api/proyectos/1/toggle')
        .set('Authorization', `Bearer ${tokens.admin}`)
        .expect(200);
    });
  });
});
