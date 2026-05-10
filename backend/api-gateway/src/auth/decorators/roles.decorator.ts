import { SetMetadata } from '@nestjs/common';
import { Role } from '../../common/constants';

/**
 * Decorador @Roles() — HU-25
 * Etiqueta un endpoint con los roles requeridos para acceder.
 */
export const ROLES_KEY = 'roles';
export const Roles = (...roles: Role[]) => SetMetadata(ROLES_KEY, roles);
