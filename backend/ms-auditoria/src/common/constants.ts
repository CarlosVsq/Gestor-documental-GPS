export const AUDITORIA_PATTERNS = {
  REGISTRAR: 'auditoria.registrar',
  FIND_RECIENTES: 'auditoria.findRecientes',
  FIND_BY_ENTIDAD: 'auditoria.findByEntidad',
  FIND_BY_REQUERIMIENTO: 'auditoria.findByRequerimiento',
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
