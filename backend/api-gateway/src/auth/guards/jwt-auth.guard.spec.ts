import { JwtAuthGuard } from './jwt-auth.guard';
import { UnauthorizedException } from '@nestjs/common';

describe('JwtAuthGuard', () => {
  let guard: JwtAuthGuard;

  beforeEach(() => {
    guard = new JwtAuthGuard();
  });

  describe('handleRequest', () => {
    it('debe retornar el usuario si no hay error', () => {
      const user = { id: 1, email: 'test@example.com', rol: 'admin' };
      const result = guard.handleRequest(null, user, null, {});

      expect(result).toEqual(user);
    });

    it('debe lanzar UnauthorizedException si no hay usuario', () => {
      expect(() => {
        guard.handleRequest(null, null, null, {});
      }).toThrow(UnauthorizedException);
    });

    it('debe lanzar UnauthorizedException si hay error', () => {
      const error = new Error('Auth error');

      expect(() => {
        guard.handleRequest(error, null, null, {});
      }).toThrow(UnauthorizedException);
    });

    it('debe retornar mensaje "Token expirado" para TokenExpiredError', () => {
      const info = { name: 'TokenExpiredError', message: 'jwt expired' };

      expect(() => {
        guard.handleRequest(null, null, info, {});
      }).toThrow(new UnauthorizedException('Token expirado'));
    });

    it('debe retornar mensaje "Token inválido" para JsonWebTokenError', () => {
      const info = { name: 'JsonWebTokenError', message: 'invalid token' };

      expect(() => {
        guard.handleRequest(null, null, info, {});
      }).toThrow(new UnauthorizedException('Token inválido'));
    });

    it('debe retornar mensaje "Token de autenticación requerido" si no hay header Authorization', () => {
      const info = { message: 'No auth token' };

      expect(() => {
        guard.handleRequest(null, null, info, {});
      }).toThrow(
        new UnauthorizedException('Token de autenticación requerido'),
      );
    });
  });
});
