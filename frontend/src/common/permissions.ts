/**
 * Permisos granulares del sistema — HU-17
 * Espejo de backend/api-gateway/src/common/constants.ts
 */
export enum Permission {
  // Usuarios
  MANAGE_USERS = 'manage_users',

  // Mantenedores
  MANAGE_MANTENEDORES = 'manage_mantenedores',

  // Requerimientos
  READ_ALL_REQUERIMIENTOS = 'read_all_requerimientos',
  CREATE_REQUERIMIENTO = 'create_requerimiento',
  CHANGE_REQUERIMIENTO_STATE = 'change_requerimiento_state',
  CLOSE_REQUERIMIENTO = 'close_requerimiento',

  // Documentos
  UPLOAD_DOCUMENT = 'upload_document',
  DOWNLOAD_DOCUMENT = 'download_document',
  SIGN_DOCUMENT = 'sign_document',
  DELETE_DOCUMENT = 'delete_document',

  // Auditoría y Reportes
  READ_AUDIT_LOG = 'read_audit_log',
  VIEW_REPORTS = 'view_reports',

  // Sistema
  CONFIGURE_SYSTEM = 'configure_system',
}

/**
 * Verifica si el usuario tiene al menos uno de los permisos requeridos.
 */
export function hasAnyPermission(userPermissions: string[] | undefined, required: string[]): boolean {
  if (!required || required.length === 0) return true;
  if (!userPermissions) return false;
  return required.some(p => userPermissions.includes(p));
}
