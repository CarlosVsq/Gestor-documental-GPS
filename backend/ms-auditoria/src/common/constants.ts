export const AUDITORIA_PATTERNS = {
  REGISTRAR: 'auditoria.registrar',
  FIND_RECIENTES: 'auditoria.findRecientes',
  FIND_BY_ENTIDAD: 'auditoria.findByEntidad',
  FIND_BY_REQUERIMIENTO: 'auditoria.findByRequerimiento',
} as const;

/**
 * Patterns de Notificaciones — HU-34/HU-35
 */
export const NOTIFICACIONES_PATTERNS = {
  CREAR: 'notificaciones.crear',
  FIND_BY_USUARIO: 'notificaciones.findByUsuario',
  CONTAR_NO_LEIDAS: 'notificaciones.contarNoLeidas',
  MARCAR_LEIDA: 'notificaciones.marcarLeida',
  MARCAR_TODAS_LEIDAS: 'notificaciones.marcarTodasLeidas',
} as const;

export enum AccionAuditoria {
  CREATE = 'CREATE',
  UPDATE = 'UPDATE',
  DELETE = 'DELETE',
  APPROVE = 'APPROVE',
  SIGN = 'SIGN',
  STATE_CHANGE = 'STATE_CHANGE',
  CLOSE_REPORT = 'CLOSE_REPORT',
  LOGIN = 'LOGIN',
}

/**
 * Tipos de notificación — HU-34/HU-35
 */
export enum TipoNotificacion {
  DOCUMENT_UPLOADED = 'DOCUMENT_UPLOADED',
  STATE_CHANGED = 'STATE_CHANGED',
  REQUIREMENT_CLOSED = 'REQUIREMENT_CLOSED',
  USER_ASSIGNED = 'USER_ASSIGNED',
}
