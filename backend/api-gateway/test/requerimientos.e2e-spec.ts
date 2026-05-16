import { INestApplication } from '@nestjs/common';
import { of, throwError } from 'rxjs';
import * as request from 'supertest';
import { buildTestApp, TestClients, tokens } from './helpers/app.helper';

describe('Requerimientos (E2E)', () => {
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

  // ─── GET /api/requerimientos ──────────────────────────────────────────────

  describe('GET /api/requerimientos', () => {
    it('401 sin token', async () => {
      await request(app.getHttpServer()).get('/api/requerimientos').expect(401);
    });

    it('200 lista requerimientos para admin (sin filtro de contratistaId)', async () => {
      clients.requerimientos.send.mockReturnValue(
        of({ data: [{ id: 1, titulo: 'Req Alpha', estado: 'PENDIENTE' }], total: 1, page: 1, limit: 10 }),
      );

      await request(app.getHttpServer())
        .get('/api/requerimientos')
        .set('Authorization', `Bearer ${tokens.admin}`)
        .expect(200);

      const [, payload] = clients.requerimientos.send.mock.calls[0];
      expect(payload.filtros.contratistaId).toBeUndefined();
    });

    it('200 filtra automáticamente por contratistaId para rol contratista', async () => {
      clients.requerimientos.send.mockReturnValue(
        of({ data: [], total: 0, page: 1, limit: 10 }),
      );

      await request(app.getHttpServer())
        .get('/api/requerimientos')
        .set('Authorization', `Bearer ${tokens.contratista}`)
        .expect(200);

      const [, payload] = clients.requerimientos.send.mock.calls[0];
      expect(payload.filtros.contratistaId).toBe(1);
    });

    it('200 acepta filtros opcionales en query string', async () => {
      clients.requerimientos.send.mockReturnValue(
        of({ data: [], total: 0, page: 1, limit: 10 }),
      );

      await request(app.getHttpServer())
        .get('/api/requerimientos?estado=PENDIENTE&prioridad=ALTA&proyectoId=2&areaId=3')
        .set('Authorization', `Bearer ${tokens.supervisor}`)
        .expect(200);

      const [, payload] = clients.requerimientos.send.mock.calls[0];
      expect(payload.filtros).toMatchObject({
        estado: 'PENDIENTE',
        prioridad: 'ALTA',
        proyectoId: 2,
        areaId: 3,
      });
    });
  });

  // ─── GET /api/requerimientos/:id ──────────────────────────────────────────

  describe('GET /api/requerimientos/:id', () => {
    it('400 con id no numérico', async () => {
      await request(app.getHttpServer())
        .get('/api/requerimientos/abc')
        .set('Authorization', `Bearer ${tokens.admin}`)
        .expect(400);
    });

    it('404 cuando el requerimiento no existe', async () => {
      clients.requerimientos.send.mockReturnValue(
        throwError(() => ({ statusCode: 404, message: 'Requerimiento no encontrado' })),
      );

      await request(app.getHttpServer())
        .get('/api/requerimientos/999')
        .set('Authorization', `Bearer ${tokens.admin}`)
        .expect(404);
    });

    it('200 retorna el detalle del requerimiento', async () => {
      clients.requerimientos.send.mockReturnValue(
        of({ id: 1, titulo: 'Req Alpha', estado: 'PENDIENTE', prioridad: 'ALTA' }),
      );

      const res = await request(app.getHttpServer())
        .get('/api/requerimientos/1')
        .set('Authorization', `Bearer ${tokens.supervisor}`)
        .expect(200);

      expect(res.body).toHaveProperty('titulo');
    });
  });

  // ─── POST /api/requerimientos ─────────────────────────────────────────────

  describe('POST /api/requerimientos', () => {
    it('401 sin token', async () => {
      await request(app.getHttpServer())
        .post('/api/requerimientos')
        .send({ titulo: 'Test' })
        .expect(401);
    });

    it('201 crea un nuevo requerimiento e inyecta usuarioCreadorId del JWT', async () => {
      clients.requerimientos.send.mockReturnValue(
        of({ id: 5, titulo: 'Nuevo Req', estado: 'PENDIENTE' }),
      );

      const res = await request(app.getHttpServer())
        .post('/api/requerimientos')
        .set('Authorization', `Bearer ${tokens.colaborador}`)
        .send({ titulo: 'Nuevo Req', proyectoId: 1, prioridad: 'MEDIA' })
        .expect(201);

      expect(res.body).toHaveProperty('id');

      const [, payload] = clients.requerimientos.send.mock.calls[0];
      expect(payload.usuarioCreadorId).toBe(3);
    });
  });

  // ─── PATCH /api/requerimientos/:id/estado ─────────────────────────────────

  describe('PATCH /api/requerimientos/:id/estado', () => {
    it('200 actualiza el estado de un requerimiento', async () => {
      clients.requerimientos.send.mockReturnValue(
        of({ id: 1, estado: 'EN_REVISION' }),
      );

      await request(app.getHttpServer())
        .patch('/api/requerimientos/1/estado')
        .set('Authorization', `Bearer ${tokens.supervisor}`)
        .send({ estado: 'EN_REVISION' })
        .expect(200);
    });

    it('404 cuando el requerimiento no existe', async () => {
      clients.requerimientos.send.mockReturnValue(
        throwError(() => ({ statusCode: 404, message: 'Requerimiento no encontrado' })),
      );

      await request(app.getHttpServer())
        .patch('/api/requerimientos/999/estado')
        .set('Authorization', `Bearer ${tokens.supervisor}`)
        .send({ estado: 'EN_REVISION' })
        .expect(404);
    });
  });
});
