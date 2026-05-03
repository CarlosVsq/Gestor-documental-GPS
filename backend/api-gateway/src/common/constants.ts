/**
 * Constantes compartidas — API Gateway
 * Contiene TODOS los patrones TCP y roles porque el gateway se comunica con todos los servicios.
 */
export enum Role {
  ADMIN = 'admin',
  EDITOR = 'editor',
}

export const SERVICE_NAMES = {
  AUTH: 'AUTH_SERVICE',
  MANTENEDORES: 'MANTENEDORES_SERVICE',
  DOCUMENTOS: 'DOCUMENTOS_SERVICE',
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
} as const;

export const CONTRATISTAS_PATTERNS = {
  CREATE: 'contratistas.create',
  FIND_ALL: 'contratistas.findAll',
  FIND_ONE: 'contratistas.findOne',
  UPDATE: 'contratistas.update',
  REMOVE: 'contratistas.remove',
  STATS: 'contratistas.stats',
} as const;

export const AREAS_PATTERNS = {
  CREATE: 'areas.create',
  FIND_ALL: 'areas.findAll',
  FIND_ONE: 'areas.findOne',
  UPDATE: 'areas.update',
  REMOVE: 'areas.remove',
  STATS: 'areas.stats',
} as const;

export const PROYECTOS_PATTERNS = {
  CREATE: 'proyectos.create',
  FIND_ALL: 'proyectos.findAll',
  FIND_ONE: 'proyectos.findOne',
  UPDATE: 'proyectos.update',
  REMOVE: 'proyectos.remove',
  STATS: 'proyectos.stats',
} as const;

export const DOCUMENTOS_PATTERNS = {
  CREATE: 'documentos.create',
  FIND_ALL: 'documentos.findAll',
  GET_FILE_PATH: 'documentos.getFilePath',
} as const;
