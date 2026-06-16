import { INestApplication } from '@nestjs/common';
import { of, throwError, TimeoutError } from 'rxjs';
import * as request from 'supertest';
import { buildTestApp, TestClients, tokens } from './helpers/app.helper';

describe('Auth (E2E)', () => {
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

  // ─── POST /api/auth/login ─────────────────────────────────────────────────

  describe('POST /api/auth/login', () => {
    it('200 con access_token cuando las credenciales son válidas', async () => {
      clients.auth.send.mockReturnValue(
        of({ access_token: 'jwt-token', user: { id: 1, email: 'admin@sgd.cl', rol: 'admin' } }),
      );

      const res = await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({ email: 'admin@sgd.cl', password: 'admin123' })
        .expect(200);

      expect(res.body).toHaveProperty('access_token');
    });

    it('401 cuando el microservicio rechaza las credenciales', async () => {
      clients.auth.send.mockReturnValue(
        throwError(() => ({ statusCode: 401, message: 'Credenciales inválidas' })),
      );

      const res = await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({ email: 'malo@sgd.cl', password: 'wrong' })
        .expect(401);

      expect(res.body.message).toContain('Credenciales');
    });

    it('503 cuando ms-auth no responde (timeout)', async () => {
      clients.auth.send.mockReturnValue(
        throwError(() => new TimeoutError()),
      );

      await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({ email: 'admin@sgd.cl', password: 'admin123' })
        .expect(503);
    });
  });

  // ─── GET /api/auth/profile ────────────────────────────────────────────────

  describe('GET /api/auth/profile', () => {
    it('401 sin header Authorization', async () => {
      await request(app.getHttpServer()).get('/api/auth/profile').expect(401);
    });

    it('401 con token malformado', async () => {
      await request(app.getHttpServer())
        .get('/api/auth/profile')
        .set('Authorization', 'Bearer token-invalido')
        .expect(401);
    });

    it('200 con JWT válido', async () => {
      clients.auth.send.mockReturnValue(
        of({ id: 1, email: 'admin@sgd.cl', rol: 'admin' }),
      );

      const res = await request(app.getHttpServer())
        .get('/api/auth/profile')
        .set('Authorization', `Bearer ${tokens.admin}`)
        .expect(200);

      expect(res.body).toHaveProperty('email', 'admin@sgd.cl');
    });
  });

  // ─── GET /api/auth/users (solo admin) ────────────────────────────────────

  describe('GET /api/auth/users', () => {
    it('401 sin token', async () => {
      await request(app.getHttpServer()).get('/api/auth/users').expect(401);
    });

    it('403 con rol supervisor (no es admin)', async () => {
      await request(app.getHttpServer())
        .get('/api/auth/users')
        .set('Authorization', `Bearer ${tokens.supervisor}`)
        .expect(403);
    });

    it('403 con rol colaborador', async () => {
      await request(app.getHttpServer())
        .get('/api/auth/users')
        .set('Authorization', `Bearer ${tokens.colaborador}`)
        .expect(403);
    });

    it('200 con rol admin', async () => {
      clients.auth.send.mockReturnValue(
        of([{ id: 1, email: 'admin@sgd.cl', rol: 'admin' }]),
      );

      const res = await request(app.getHttpServer())
        .get('/api/auth/users')
        .set('Authorization', `Bearer ${tokens.admin}`)
        .expect(200);

      expect(Array.isArray(res.body)).toBe(true);
    });
  });

  // ─── GET /api/auth/users/:id ──────────────────────────────────────────────

  describe('GET /api/auth/users/:id', () => {
    it('400 cuando el id no es un número (ParseIntPipe)', async () => {
      await request(app.getHttpServer())
        .get('/api/auth/users/abc')
        .set('Authorization', `Bearer ${tokens.admin}`)
        .expect(400);
    });

    it('404 cuando el usuario no existe', async () => {
      clients.auth.send.mockReturnValue(
        throwError(() => ({ statusCode: 404, message: 'Usuario no encontrado' })),
      );

      const res = await request(app.getHttpServer())
        .get('/api/auth/users/999')
        .set('Authorization', `Bearer ${tokens.admin}`)
        .expect(404);

      expect(res.body.message).toContain('no encontrado');
    });

    it('200 cuando el usuario existe', async () => {
      clients.auth.send.mockReturnValue(
        of({ id: 2, email: 'supervisor@sgd.cl', rol: 'supervisor' }),
      );

      await request(app.getHttpServer())
        .get('/api/auth/users/2')
        .set('Authorization', `Bearer ${tokens.admin}`)
        .expect(200);
    });
  });

  // ─── POST /api/auth/users (solo admin) ───────────────────────────────────

  describe('POST /api/auth/users', () => {
    it('403 con rol supervisor', async () => {
      await request(app.getHttpServer())
        .post('/api/auth/users')
        .set('Authorization', `Bearer ${tokens.supervisor}`)
        .send({ email: 'nuevo@sgd.cl', password: 'Pass1234!', rol: 'colaborador' })
        .expect(403);
    });

    it('201 crea usuario siendo admin', async () => {
      clients.auth.send.mockReturnValue(
        of({ id: 10, email: 'nuevo@sgd.cl', rol: 'colaborador' }),
      );

      await request(app.getHttpServer())
        .post('/api/auth/users')
        .set('Authorization', `Bearer ${tokens.admin}`)
        .send({ email: 'nuevo@sgd.cl', password: 'Pass1234!', rol: 'colaborador' })
        .expect(201);
    });

    it('409 cuando el email ya está registrado', async () => {
      clients.auth.send.mockReturnValue(
        throwError(() => ({ statusCode: 409, message: 'Email ya registrado' })),
      );

      const res = await request(app.getHttpServer())
        .post('/api/auth/users')
        .set('Authorization', `Bearer ${tokens.admin}`)
        .send({ email: 'admin@sgd.cl', password: 'Pass1234!', rol: 'colaborador' })
        .expect(409);

      expect(res.body.message).toContain('registrado');
    });
  });

  // ─── PATCH /api/auth/users/:id/toggle (solo admin) ───────────────────────

  describe('PATCH /api/auth/users/:id/toggle', () => {
    it('403 con rol auditor', async () => {
      await request(app.getHttpServer())
        .patch('/api/auth/users/2/toggle')
        .set('Authorization', `Bearer ${tokens.auditor}`)
        .expect(403);
    });

    it('200 activa/desactiva usuario siendo admin', async () => {
      clients.auth.send.mockReturnValue(of({ id: 2, activo: false }));

      await request(app.getHttpServer())
        .patch('/api/auth/users/2/toggle')
        .set('Authorization', `Bearer ${tokens.admin}`)
        .expect(200);
    });
  });
});
