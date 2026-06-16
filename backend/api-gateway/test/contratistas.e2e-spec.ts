import { INestApplication } from '@nestjs/common';
import { of, throwError } from 'rxjs';
import * as request from 'supertest';
import { buildTestApp, TestClients, tokens } from './helpers/app.helper';

describe('Contratistas (E2E)', () => {
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

  // ─── GET /api/contratistas ────────────────────────────────────────────────

  describe('GET /api/contratistas', () => {
    it('401 sin token', async () => {
      await request(app.getHttpServer()).get('/api/contratistas').expect(401);
    });

    it('200 con listado paginado', async () => {
      clients.mantenedores.send.mockReturnValue(
        of({ data: [{ id: 1, nombre: 'Constructora Andes', rut: '12345678-9' }], total: 1, page: 1, limit: 10 }),
      );

      const res = await request(app.getHttpServer())
        .get('/api/contratistas')
        .set('Authorization', `Bearer ${tokens.admin}`)
        .expect(200);

      expect(res.body).toHaveProperty('data');
      expect(res.body).toHaveProperty('total');
    });

    it('200 respeta los parámetros de paginación', async () => {
      clients.mantenedores.send.mockReturnValue(
        of({ data: [], total: 0, page: 2, limit: 5 }),
      );

      await request(app.getHttpServer())
        .get('/api/contratistas?page=2&limit=5')
        .set('Authorization', `Bearer ${tokens.admin}`)
        .expect(200);

      const [, payload] = clients.mantenedores.send.mock.calls[0];
      expect(payload).toMatchObject({ page: 2, limit: 5 });
    });
  });

  // ─── GET /api/contratistas/stats ──────────────────────────────────────────

  describe('GET /api/contratistas/stats', () => {
    it('200 retorna estadísticas', async () => {
      clients.mantenedores.send.mockReturnValue(
        of({ total: 10, activos: 8, inactivos: 2 }),
      );

      const res = await request(app.getHttpServer())
        .get('/api/contratistas/stats')
        .set('Authorization', `Bearer ${tokens.supervisor}`)
        .expect(200);

      expect(res.body).toHaveProperty('total');
    });
  });

  // ─── GET /api/contratistas/:id ────────────────────────────────────────────

  describe('GET /api/contratistas/:id', () => {
    it('400 con id no numérico (ParseIntPipe)', async () => {
      await request(app.getHttpServer())
        .get('/api/contratistas/no-es-numero')
        .set('Authorization', `Bearer ${tokens.admin}`)
        .expect(400);
    });

    it('404 cuando el contratista no existe', async () => {
      clients.mantenedores.send.mockReturnValue(
        throwError(() => ({ statusCode: 404, message: 'Contratista no encontrado' })),
      );

      const res = await request(app.getHttpServer())
        .get('/api/contratistas/999')
        .set('Authorization', `Bearer ${tokens.admin}`)
        .expect(404);

      expect(res.body.message).toContain('no encontrado');
    });

    it('200 cuando el contratista existe', async () => {
      clients.mantenedores.send.mockReturnValue(
        of({ id: 1, nombre: 'Constructora Andes', rut: '12345678-9', activo: true }),
      );

      const res = await request(app.getHttpServer())
        .get('/api/contratistas/1')
        .set('Authorization', `Bearer ${tokens.admin}`)
        .expect(200);

      expect(res.body).toHaveProperty('id', 1);
    });
  });

  // ─── POST /api/contratistas ───────────────────────────────────────────────

  describe('POST /api/contratistas', () => {
    it('201 crea un contratista nuevo', async () => {
      clients.mantenedores.send.mockReturnValue(
        of({ id: 2, nombre: 'Nueva SA', rut: '98765432-1' }),
      );

      const res = await request(app.getHttpServer())
        .post('/api/contratistas')
        .set('Authorization', `Bearer ${tokens.admin}`)
        .send({ nombre: 'Nueva SA', rut: '98765432-1' })
        .expect(201);

      expect(res.body).toHaveProperty('id');
    });

    it('409 cuando el RUT ya está registrado', async () => {
      clients.mantenedores.send.mockReturnValue(
        throwError(() => ({ statusCode: 409, message: 'Ya existe un contratista con ese RUT' })),
      );

      await request(app.getHttpServer())
        .post('/api/contratistas')
        .set('Authorization', `Bearer ${tokens.admin}`)
        .send({ nombre: 'Duplicado SA', rut: '12345678-9' })
        .expect(409);
    });
  });

  // ─── PUT /api/contratistas/:id ────────────────────────────────────────────

  describe('PUT /api/contratistas/:id', () => {
    it('200 actualiza un contratista', async () => {
      clients.mantenedores.send.mockReturnValue(
        of({ id: 1, nombre: 'Constructora Andes Actualizada', rut: '12345678-9' }),
      );

      await request(app.getHttpServer())
        .put('/api/contratistas/1')
        .set('Authorization', `Bearer ${tokens.admin}`)
        .send({ nombre: 'Constructora Andes Actualizada' })
        .expect(200);
    });

    it('404 al actualizar un contratista inexistente', async () => {
      clients.mantenedores.send.mockReturnValue(
        throwError(() => ({ statusCode: 404, message: 'Contratista no encontrado' })),
      );

      await request(app.getHttpServer())
        .put('/api/contratistas/999')
        .set('Authorization', `Bearer ${tokens.admin}`)
        .send({ nombre: 'Inexistente' })
        .expect(404);
    });
  });

  // ─── PATCH /api/contratistas/:id/toggle ──────────────────────────────────

  describe('PATCH /api/contratistas/:id/toggle', () => {
    it('200 cambia el estado activo/inactivo', async () => {
      clients.mantenedores.send.mockReturnValue(
        of({ id: 1, activo: false }),
      );

      await request(app.getHttpServer())
        .patch('/api/contratistas/1/toggle')
        .set('Authorization', `Bearer ${tokens.admin}`)
        .expect(200);
    });
  });
});
