import { INestApplication } from '@nestjs/common';
import { of, throwError } from 'rxjs';
import * as request from 'supertest';
import { buildTestApp, TestClients, tokens } from './helpers/app.helper';

describe('Subtipos (E2E)', () => {
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

  describe('GET /api/subtipos', () => {
    it('401 sin token', async () => {
      await request(app.getHttpServer()).get('/api/subtipos').expect(401);
    });

    it('200 retorna listado paginado de subtipos', async () => {
      clients.mantenedores.send.mockReturnValue(
        of({ data: [{ id: 1, nombre: 'Plano de Planta', categoriaId: 1 }], total: 1, page: 1, limit: 10 }),
      );

      const res = await request(app.getHttpServer())
        .get('/api/subtipos')
        .set('Authorization', `Bearer ${tokens.colaborador}`)
        .expect(200);

      expect(res.body).toHaveProperty('data');
    });
  });

  describe('GET /api/subtipos/:id', () => {
    it('400 con id no numérico', async () => {
      await request(app.getHttpServer())
        .get('/api/subtipos/abc')
        .set('Authorization', `Bearer ${tokens.admin}`)
        .expect(400);
    });

    it('404 cuando el subtipo no existe', async () => {
      clients.mantenedores.send.mockReturnValue(
        throwError(() => ({ statusCode: 404, message: 'Subtipo no encontrado' })),
      );

      await request(app.getHttpServer())
        .get('/api/subtipos/999')
        .set('Authorization', `Bearer ${tokens.admin}`)
        .expect(404);
    });

    it('200 cuando el subtipo existe', async () => {
      clients.mantenedores.send.mockReturnValue(
        of({ id: 1, nombre: 'Plano de Planta', categoriaId: 1, activo: true }),
      );

      await request(app.getHttpServer())
        .get('/api/subtipos/1')
        .set('Authorization', `Bearer ${tokens.admin}`)
        .expect(200);
    });
  });

  describe('POST /api/subtipos', () => {
    it('201 crea un subtipo vinculado a una categoría', async () => {
      clients.mantenedores.send.mockReturnValue(
        of({ id: 2, nombre: 'Plano de Corte', categoriaId: 1 }),
      );

      const res = await request(app.getHttpServer())
        .post('/api/subtipos')
        .set('Authorization', `Bearer ${tokens.admin}`)
        .send({ nombre: 'Plano de Corte', categoriaId: 1 })
        .expect(201);

      expect(res.body).toHaveProperty('id');
    });

    it('404 cuando la categoría padre no existe', async () => {
      clients.mantenedores.send.mockReturnValue(
        throwError(() => ({ statusCode: 404, message: 'Categoría no encontrada' })),
      );

      await request(app.getHttpServer())
        .post('/api/subtipos')
        .set('Authorization', `Bearer ${tokens.admin}`)
        .send({ nombre: 'Subtipo huérfano', categoriaId: 999 })
        .expect(404);
    });

    it('409 cuando el nombre ya existe en esa categoría', async () => {
      clients.mantenedores.send.mockReturnValue(
        throwError(() => ({ statusCode: 409, message: 'Ya existe un subtipo con ese nombre' })),
      );

      await request(app.getHttpServer())
        .post('/api/subtipos')
        .set('Authorization', `Bearer ${tokens.admin}`)
        .send({ nombre: 'Plano de Planta', categoriaId: 1 })
        .expect(409);
    });
  });

  describe('PUT /api/subtipos/:id', () => {
    it('200 actualiza el nombre de un subtipo', async () => {
      clients.mantenedores.send.mockReturnValue(
        of({ id: 1, nombre: 'Plano de Planta Actualizado' }),
      );

      await request(app.getHttpServer())
        .put('/api/subtipos/1')
        .set('Authorization', `Bearer ${tokens.admin}`)
        .send({ nombre: 'Plano de Planta Actualizado' })
        .expect(200);
    });
  });

  describe('PATCH /api/subtipos/:id/toggle', () => {
    it('200 activa o desactiva un subtipo', async () => {
      clients.mantenedores.send.mockReturnValue(of({ id: 1, activo: false }));

      await request(app.getHttpServer())
        .patch('/api/subtipos/1/toggle')
        .set('Authorization', `Bearer ${tokens.admin}`)
        .expect(200);
    });
  });
});
