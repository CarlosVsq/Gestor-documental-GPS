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
        rol: 'admin',
        contratistaId: 5,
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
        rol: 'colaborador',
        contratistaId: null,
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
