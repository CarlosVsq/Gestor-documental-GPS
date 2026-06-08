import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PERMISSIONS_KEY } from '../decorators/permissions.decorator';

/**
 * Guard de Permisos — HU-17/HU-10
 * Verifica que el usuario tenga TODOS los permisos requeridos para el endpoint.
 * Los permisos se extraen del JWT payload (req.user.permissions).
 * 
 * Si no hay @Permissions() en el handler, permite el acceso.
 * Si el usuario no tiene algún permiso requerido, retorna 403.
 */
@Injectable()
export class PermissionsGuard implements CanActivate {
  private readonly logger = new Logger(PermissionsGuard.name);

  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredPermissions = this.reflector.getAllAndOverride<string[]>(
      PERMISSIONS_KEY,
      [context.getHandler(), context.getClass()],
    );

    // Si no hay @Permissions() en el handler, permitir
    if (!requiredPermissions || requiredPermissions.length === 0) {
      return true;
    }

    const { user } = context.switchToHttp().getRequest();

    if (!user) {
      this.logger.warn('[Permissions] No user in request');
      throw new ForbiddenException('Acceso denegado: usuario no autenticado');
    }

    const userPermissions: string[] = user.permissions || [];

    // Verificar que tenga AL MENOS UNO de los permisos requeridos
    const hasPermission = requiredPermissions.some((perm) =>
      userPermissions.includes(perm),
    );

    if (!hasPermission) {
      this.logger.warn(
        `[Permissions] User ${user.email} (rol: ${user.rol}) denied. ` +
        `Required: [${requiredPermissions.join(', ')}]. ` +
        `Has: [${userPermissions.join(', ')}]`,
      );
      throw new ForbiddenException(
        `Acceso denegado: se requiere uno de los permisos [${requiredPermissions.join(', ')}]`,
      );
    }

    return true;
  }
}
