import { JwtStrategy } from './jwt.strategy';
import { UnauthorizedException } from '@nestjs/common';

describe('JwtStrategy', () => {
  let strategy: JwtStrategy;

  beforeEach(() => {
    strategy = new JwtStrategy();
  });

  describe('validate', () => {
    it('debe retornar un usuario válido cuando el payload es correcto', async () => {
      const payload = {
        sub: 1,
        email: 'test@example.com',
        rol: 'admin',
        contratistaId: 5,
      };

      const result = await strategy.validate(payload);

      expect(result).toEqual({
        id: 1,
        email: 'test@example.com',
        nombre: null,
        rol: 'admin',
        permissions: [],
        contratistaId: 5,
        jti: null,
      });
    });

    it('debe asignar null a contratistaId si no viene en el payload', async () => {
      const payload = {
        sub: 2,
        email: 'collaborator@example.com',
        rol: 'colaborador',
      };

      const result = await strategy.validate(payload);

      expect(result).toEqual({
        id: 2,
        email: 'collaborator@example.com',
        nombre: null,
        rol: 'colaborador',
        permissions: [],
        contratistaId: null,
        jti: null,
      });
    });

    it('debe propagar nombre, permissions y jti cuando vienen en el payload (HU-17/HU-10)', async () => {
      const payload = {
        sub: 3,
        email: 'admin@example.com',
        nombre: 'Admin SGD',
        rol: 'admin',
        permissions: ['documento.crear', 'documento.firmar'],
        jti: 'token-uuid-123',
      };

      const result = await strategy.validate(payload);

      expect(result).toEqual({
        id: 3,
        email: 'admin@example.com',
        nombre: 'Admin SGD',
        rol: 'admin',
        permissions: ['documento.crear', 'documento.firmar'],
        contratistaId: null,
        jti: 'token-uuid-123',
      });
    });

    it('debe lanzar UnauthorizedException si el payload no tiene sub', async () => {
      const invalidPayload = {
        email: 'test@example.com',
        rol: 'admin',
      } as any;

      await expect(strategy.validate(invalidPayload)).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('debe lanzar UnauthorizedException si el payload es null', async () => {
      await expect(strategy.validate(null as any)).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('debe lanzar UnauthorizedException si el payload es undefined', async () => {
      await expect(strategy.validate(undefined as any)).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });
});
