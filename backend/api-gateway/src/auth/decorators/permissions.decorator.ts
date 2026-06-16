import { SetMetadata } from '@nestjs/common';

/**
 * Decorador @Permissions() — HU-17/HU-10
 * Etiqueta un endpoint con los permisos granulares requeridos para acceder.
 * Se usa en conjunto con PermissionsGuard.
 * 
 * @example
 * @Permissions(Permission.UPLOAD_DOCUMENT, Permission.SIGN_DOCUMENT)
 * async uploadAndSign() { ... }
 */
export const PERMISSIONS_KEY = 'permissions';
export const Permissions = (...permissions: string[]) =>
  SetMetadata(PERMISSIONS_KEY, permissions);
