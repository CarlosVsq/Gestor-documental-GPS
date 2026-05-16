import { INestApplication } from '@nestjs/common';
import { of, throwError } from 'rxjs';
import * as request from 'supertest';
import { buildTestApp, TestClients, tokens } from './helpers/app.helper';

describe('Categorías (E2E)', () => {
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

  // ─── GET /api/categorias ──────────────────────────────────────────────────

  describe('GET /api/categorias', () => {
    it('401 sin token', async () => {
      await request(app.getHttpServer()).get('/api/categorias').expect(401);
    });

    it('200 retorna listado paginado', async () => {
      clients.mantenedores.send.mockReturnValue(
        of({ data: [{ id: 1, nombre: 'Planos', activo: true }], total: 1, page: 1, limit: 10 }),
      );

      const res = await request(app.getHttpServer())
        .get('/api/categorias')
        .set('Authorization', `Bearer ${tokens.colaborador}`)
        .expect(200);

      expect(res.body).toHaveProperty('data');
    });

    it('aplica página 1 y limit 10 por defecto', async () => {
      clients.mantenedores.send.mockReturnValue(of({ data: [], total: 0, page: 1, limit: 10 }));

      await request(app.getHttpServer())
        .get('/api/categorias')
        .set('Authorization', `Bearer ${tokens.admin}`)
        .expect(200);

      const [, payload] = clients.mantenedores.send.mock.calls[0];
      expect(payload).toMatchObject({ page: 1, limit: 10 });
    });
  });

  // ─── GET /api/categorias/:id ──────────────────────────────────────────────

  describe('GET /api/categorias/:id', () => {
    it('400 con id no numérico', async () => {
      await request(app.getHttpServer())
        .get('/api/categorias/texto')
        .set('Authorization', `Bearer ${tokens.admin}`)
        .expect(400);
    });

    it('404 cuando la categoría no existe', async () => {
      clients.mantenedores.send.mockReturnValue(
        throwError(() => ({ statusCode: 404, message: 'Categoría no encontrada' })),
      );

      await request(app.getHttpServer())
        .get('/api/categorias/999')
        .set('Authorization', `Bearer ${tokens.admin}`)
        .expect(404);
    });

    it('200 cuando la categoría existe', async () => {
      clients.mantenedores.send.mockReturnValue(
        of({ id: 1, nombre: 'Planos', activo: true, subtipos: [] }),
      );

      await request(app.getHttpServer())
        .get('/api/categorias/1')
        .set('Authorization', `Bearer ${tokens.admin}`)
        .expect(200);
    });
  });

  // ─── POST /api/categorias ─────────────────────────────────────────────────

  describe('POST /api/categorias', () => {
    it('201 crea una categoría nueva', async () => {
      clients.mantenedores.send.mockReturnValue(
        of({ id: 2, nombre: 'Contratos', activo: true }),
      );

      const res = await request(app.getHttpServer())
        .post('/api/categorias')
        .set('Authorization', `Bearer ${tokens.admin}`)
        .send({ nombre: 'Contratos' })
        .expect(201);

      expect(res.body).toHaveProperty('id');
    });

    it('409 cuando el nombre ya está en uso', async () => {
      clients.mantenedores.send.mockReturnValue(
        throwError(() => ({ statusCode: 409, message: 'Ya existe una categoría con ese nombre' })),
      );

      await request(app.getHttpServer())
        .post('/api/categorias')
        .set('Authorization', `Bearer ${tokens.admin}`)
        .send({ nombre: 'Planos' })
        .expect(409);
    });
  });

  // ─── PUT /api/categorias/:id ──────────────────────────────────────────────

  describe('PUT /api/categorias/:id', () => {
    it('200 actualiza el nombre de una categoría', async () => {
      clients.mantenedores.send.mockReturnValue(
        of({ id: 1, nombre: 'Planos Arquitectónicos', activo: true }),
      );

      await request(app.getHttpServer())
        .put('/api/categorias/1')
        .set('Authorization', `Bearer ${tokens.admin}`)
        .send({ nombre: 'Planos Arquitectónicos' })
        .expect(200);
    });
  });

  // ─── PATCH /api/categorias/:id/toggle ────────────────────────────────────

  describe('PATCH /api/categorias/:id/toggle', () => {
    it('200 activa o desactiva una categoría', async () => {
      clients.mantenedores.send.mockReturnValue(of({ id: 1, activo: false }));

      await request(app.getHttpServer())
        .patch('/api/categorias/1/toggle')
        .set('Authorization', `Bearer ${tokens.admin}`)
        .expect(200);
    });

    it('409 cuando la categoría tiene subtipos activos', async () => {
      clients.mantenedores.send.mockReturnValue(
        throwError(() => ({ statusCode: 409, message: 'No se puede desactivar: tiene subtipos activos' })),
      );

      await request(app.getHttpServer())
        .patch('/api/categorias/1/toggle')
        .set('Authorization', `Bearer ${tokens.admin}`)
        .expect(409);
    });
  });
});
