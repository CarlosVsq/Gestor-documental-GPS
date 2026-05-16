import { INestApplication } from '@nestjs/common';
import { of, throwError } from 'rxjs';
import * as request from 'supertest';
import { buildTestApp, TestClients, tokens } from './helpers/app.helper';

describe('Áreas (E2E)', () => {
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

  // ─── GET /api/areas ───────────────────────────────────────────────────────

  describe('GET /api/areas', () => {
    it('401 sin token', async () => {
      await request(app.getHttpServer()).get('/api/areas').expect(401);
    });

    it('200 lista áreas para rol admin (sin filtro de contratistaId)', async () => {
      clients.mantenedores.send.mockReturnValue(
        of({ data: [{ id: 1, nombre: 'Área Obras', contratistaId: 1 }], total: 1, page: 1, limit: 10 }),
      );

      await request(app.getHttpServer())
        .get('/api/areas')
        .set('Authorization', `Bearer ${tokens.admin}`)
        .expect(200);

      const [, payload] = clients.mantenedores.send.mock.calls[0];
      expect(payload.contratistaId).toBeUndefined();
    });

    it('200 filtra por contratistaId cuando el rol es contratista', async () => {
      clients.mantenedores.send.mockReturnValue(
        of({ data: [{ id: 1, nombre: 'Área Obras', contratistaId: 1 }], total: 1, page: 1, limit: 10 }),
      );

      await request(app.getHttpServer())
        .get('/api/areas')
        .set('Authorization', `Bearer ${tokens.contratista}`)
        .expect(200);

      const [, payload] = clients.mantenedores.send.mock.calls[0];
      expect(payload.contratistaId).toBe(1);
    });
  });

  // ─── GET /api/areas/stats ─────────────────────────────────────────────────

  describe('GET /api/areas/stats', () => {
    it('200 retorna estadísticas de áreas', async () => {
      clients.mantenedores.send.mockReturnValue(of({ total: 5, activas: 4 }));

      await request(app.getHttpServer())
        .get('/api/areas/stats')
        .set('Authorization', `Bearer ${tokens.supervisor}`)
        .expect(200);
    });
  });

  // ─── GET /api/areas/:id ───────────────────────────────────────────────────

  describe('GET /api/areas/:id', () => {
    it('400 con id no numérico', async () => {
      await request(app.getHttpServer())
        .get('/api/areas/invalido')
        .set('Authorization', `Bearer ${tokens.admin}`)
        .expect(400);
    });

    it('404 cuando el área no existe', async () => {
      clients.mantenedores.send.mockReturnValue(
        throwError(() => ({ statusCode: 404, message: 'Área no encontrada' })),
      );

      await request(app.getHttpServer())
        .get('/api/areas/999')
        .set('Authorization', `Bearer ${tokens.admin}`)
        .expect(404);
    });

    it('200 cuando el área existe', async () => {
      clients.mantenedores.send.mockReturnValue(
        of({ id: 1, nombre: 'Área Obras', activo: true, contratistaId: 1 }),
      );

      await request(app.getHttpServer())
        .get('/api/areas/1')
        .set('Authorization', `Bearer ${tokens.admin}`)
        .expect(200);
    });
  });

  // ─── POST /api/areas ──────────────────────────────────────────────────────

  describe('POST /api/areas', () => {
    it('201 crea un área asociada a un contratista', async () => {
      clients.mantenedores.send.mockReturnValue(
        of({ id: 2, nombre: 'Área Nueva', contratistaId: 1 }),
      );

      const res = await request(app.getHttpServer())
        .post('/api/areas')
        .set('Authorization', `Bearer ${tokens.admin}`)
        .send({ nombre: 'Área Nueva', contratistaId: 1 })
        .expect(201);

      expect(res.body).toHaveProperty('id');
    });

    it('404 cuando el contratista asociado no existe', async () => {
      clients.mantenedores.send.mockReturnValue(
        throwError(() => ({ statusCode: 404, message: 'Contratista no encontrado' })),
      );

      await request(app.getHttpServer())
        .post('/api/areas')
        .set('Authorization', `Bearer ${tokens.admin}`)
        .send({ nombre: 'Área Nueva', contratistaId: 999 })
        .expect(404);
    });

    it('409 cuando ya existe un área con ese nombre para el contratista', async () => {
      clients.mantenedores.send.mockReturnValue(
        throwError(() => ({ statusCode: 409, message: 'Ya existe un área con ese nombre' })),
      );

      await request(app.getHttpServer())
        .post('/api/areas')
        .set('Authorization', `Bearer ${tokens.admin}`)
        .send({ nombre: 'Área Obras', contratistaId: 1 })
        .expect(409);
    });
  });

  // ─── PATCH /api/areas/:id/toggle ─────────────────────────────────────────

  describe('PATCH /api/areas/:id/toggle', () => {
    it('200 activa o desactiva un área', async () => {
      clients.mantenedores.send.mockReturnValue(of({ id: 1, activo: false }));

      await request(app.getHttpServer())
        .patch('/api/areas/1/toggle')
        .set('Authorization', `Bearer ${tokens.admin}`)
        .expect(200);
    });

    it('409 cuando el área tiene proyectos activos asociados', async () => {
      clients.mantenedores.send.mockReturnValue(
        throwError(() => ({ statusCode: 409, message: 'No se puede desactivar: tiene proyectos asociados' })),
      );

      const res = await request(app.getHttpServer())
        .patch('/api/areas/1/toggle')
        .set('Authorization', `Bearer ${tokens.admin}`)
        .expect(409);

      expect(res.body.message).toContain('proyectos');
    });
  });
});
