import { ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { RolesGuard } from './roles.guard';
import { Role } from '../../common/constants';
import { ROLES_KEY } from '../decorators/roles.decorator';

function buildContext(userRol: string | null, requiredRoles: Role[] | undefined): ExecutionContext {
  const mockReflector = {
    getAllAndOverride: jest.fn().mockReturnValue(requiredRoles),
  } as unknown as Reflector;

  const guard = new RolesGuard(mockReflector);
  const mockRequest = { user: userRol ? { rol: userRol } : undefined };

  const context = {
    getHandler: jest.fn(),
    getClass: jest.fn(),
    switchToHttp: jest.fn().mockReturnValue({ getRequest: () => mockRequest }),
  } as unknown as ExecutionContext;

  return context;
}

describe('RolesGuard', () => {
  let reflector: jest.Mocked<Reflector>;
  let guard: RolesGuard;

  beforeEach(() => {
    reflector = { getAllAndOverride: jest.fn() } as unknown as jest.Mocked<Reflector>;
    guard = new RolesGuard(reflector);
  });

  it('permite el acceso cuando no hay roles requeridos en el endpoint', () => {
    reflector.getAllAndOverride.mockReturnValue(undefined);
    const context = buildContext('auditor', undefined);

    expect(guard.canActivate(context)).toBe(true);
  });

  it('permite el acceso cuando el usuario tiene el rol requerido', () => {
    reflector.getAllAndOverride.mockReturnValue([Role.ADMIN]);
    const mockRequest = { user: { rol: Role.ADMIN } };
    const context = {
      getHandler: jest.fn(),
      getClass: jest.fn(),
      switchToHttp: jest.fn().mockReturnValue({ getRequest: () => mockRequest }),
    } as unknown as ExecutionContext;

    expect(guard.canActivate(context)).toBe(true);
  });

  it('bloquea el acceso cuando el usuario no tiene el rol requerido', () => {
    reflector.getAllAndOverride.mockReturnValue([Role.ADMIN]);
    const mockRequest = { user: { rol: Role.COLABORADOR } };
    const context = {
      getHandler: jest.fn(),
      getClass: jest.fn(),
      switchToHttp: jest.fn().mockReturnValue({ getRequest: () => mockRequest }),
    } as unknown as ExecutionContext;

    expect(guard.canActivate(context)).toBe(false);
  });

  it('permite el acceso cuando el rol está en una lista de roles aceptados', () => {
    reflector.getAllAndOverride.mockReturnValue([Role.ADMIN, Role.SUPERVISOR]);
    const mockRequest = { user: { rol: Role.SUPERVISOR } };
    const context = {
      getHandler: jest.fn(),
      getClass: jest.fn(),
      switchToHttp: jest.fn().mockReturnValue({ getRequest: () => mockRequest }),
    } as unknown as ExecutionContext;

    expect(guard.canActivate(context)).toBe(true);
  });

  it('bloquea cuando user es undefined (no autenticado)', () => {
    reflector.getAllAndOverride.mockReturnValue([Role.ADMIN]);
    const mockRequest = { user: undefined };
    const context = {
      getHandler: jest.fn(),
      getClass: jest.fn(),
      switchToHttp: jest.fn().mockReturnValue({ getRequest: () => mockRequest }),
    } as unknown as ExecutionContext;

    expect(guard.canActivate(context)).toBe(false);
  });

  it('verifica que getAllAndOverride se llame con la clave correcta', () => {
    reflector.getAllAndOverride.mockReturnValue(undefined);
    const mockRequest = { user: { rol: Role.ADMIN } };
    const mockHandler = jest.fn();
    const mockClass = jest.fn();
    const context = {
      getHandler: jest.fn().mockReturnValue(mockHandler),
      getClass: jest.fn().mockReturnValue(mockClass),
      switchToHttp: jest.fn().mockReturnValue({ getRequest: () => mockRequest }),
    } as unknown as ExecutionContext;

    guard.canActivate(context);

    expect(reflector.getAllAndOverride).toHaveBeenCalledWith(ROLES_KEY, [mockHandler, mockClass]);
  });
});
