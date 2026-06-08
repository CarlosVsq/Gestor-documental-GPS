/**
 * Constantes compartidas — API Gateway
 * Contiene TODOS los patrones TCP, roles y permisos porque el gateway
 * se comunica con todos los servicios.
 */
export enum Role {
  ADMIN = 'admin',
  SUPERVISOR = 'supervisor',
  GERENTE = 'gerente',
  COLABORADOR = 'colaborador',
  AUDITOR = 'auditor',
  CONTRATISTA = 'contratista',
}

/**
 * Permisos granulares del sistema — HU-17
 * Espejo del enum en ms-auth/common/constants.ts
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

export const SERVICE_NAMES = {
  AUTH: 'AUTH_SERVICE',
  MANTENEDORES: 'MANTENEDORES_SERVICE',
  REQUERIMIENTOS: 'REQUERIMIENTOS_SERVICE',
  ALMACENAMIENTO: 'ALMACENAMIENTO_SERVICE',
  AUDITORIA: 'AUDITORIA_SERVICE',
} as const;

export const AUTH_PATTERNS = {
  LOGIN: 'auth.login',
  PROFILE: 'auth.profile',
  FIND_ALL_USERS: 'auth.users.findAll',
  FIND_ONE_USER: 'auth.users.findOne',
  CREATE_USER: 'auth.users.create',
  UPDATE_USER: 'auth.users.update',
  TOGGLE_USER: 'auth.users.toggle',
  SEED_ADMIN: 'auth.seedAdmin',
  VALIDATE_USER: 'auth.validateUser',
  // HU-10/HU-17: Nuevos patterns
  VERIFY_JWT: 'auth.verifyJwt',
  GET_ROLE_PERMISSIONS: 'auth.role.getPermissions',
  FIND_ALL_ROLES: 'auth.roles.findAll',
} as const;

export const CONTRATISTAS_PATTERNS = {
  CREATE: 'contratistas.create',
  FIND_ALL: 'contratistas.findAll',
  FIND_ONE: 'contratistas.findOne',
  UPDATE: 'contratistas.update',
  TOGGLE: 'contratistas.toggle',
  STATS: 'contratistas.stats',
} as const;

export const AREAS_PATTERNS = {
  CREATE: 'areas.create',
  FIND_ALL: 'areas.findAll',
  FIND_ONE: 'areas.findOne',
  UPDATE: 'areas.update',
  TOGGLE: 'areas.toggle',
  STATS: 'areas.stats',
} as const;

export const PROYECTOS_PATTERNS = {
  CREATE: 'proyectos.create',
  FIND_ALL: 'proyectos.findAll',
  FIND_ONE: 'proyectos.findOne',
  UPDATE: 'proyectos.update',
  TOGGLE: 'proyectos.toggle',
  STATS: 'proyectos.stats',
} as const;


export const CATEGORIAS_PATTERNS = {
  CREATE: 'categorias.create',
  FIND_ALL: 'categorias.findAll',
  FIND_ONE: 'categorias.findOne',
  UPDATE: 'categorias.update',
  TOGGLE: 'categorias.toggle',
} as const;

export const SUBTIPOS_PATTERNS = {
  CREATE: 'subtipos.create',
  FIND_ALL: 'subtipos.findAll',
  FIND_ONE: 'subtipos.findOne',
  UPDATE: 'subtipos.update',
  TOGGLE: 'subtipos.toggle',
} as const;

export const REQUERIMIENTOS_PATTERNS = {
  CREATE: 'requerimientos.create',
  FIND_ALL: 'requerimientos.findAll',
  FIND_ONE: 'requerimientos.findOne',
  UPDATE_STATE: 'requerimientos.updateState',
} as const;

export const ALMACENAMIENTO_PATTERNS = {
  // Documentos
  UPLOAD: 'almacenamiento.upload',
  UPLOAD_BULK: 'almacenamiento.uploadBulk',
  DOWNLOAD: 'almacenamiento.download',
  FIND_ALL: 'almacenamiento.findAll',
  FIND_ONE: 'almacenamiento.findOne',
  FIND_BY_REQUERIMIENTO: 'almacenamiento.findByRequerimiento',
  SEARCH: 'almacenamiento.search',
  DELETE: 'almacenamiento.delete',
  UPDATE_ESTADO: 'almacenamiento.documento.updateEstado',
  FIRMAR_DOCUMENTO: 'almacenamiento.documento.firmar',
  // Expedientes
  CREATE_EXPEDIENTE: 'almacenamiento.expediente.create',
  GET_TREE: 'almacenamiento.expediente.tree',
  // PDF
  GENERATE_PDF: 'almacenamiento.pdf.generate',
  GENERATE_REPORTE_CIERRE: 'almacenamiento.pdf.reporteCierre',
} as const;

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
