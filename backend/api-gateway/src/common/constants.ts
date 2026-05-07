/**
 * Constantes compartidas — API Gateway
 * Contiene TODOS los patrones TCP y roles porque el gateway se comunica con todos los servicios.
 */
export enum Role {
  ADMIN = 'admin',
  SUPERVISOR = 'supervisor',
  GERENTE = 'gerente',
  COLABORADOR = 'colaborador',
  AUDITOR = 'auditor',
  CONTRATISTA = 'contratista',
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

export const DOCUMENTOS_PATTERNS = {
  CREATE: 'documentos.create',
  FIND_ALL: 'documentos.findAll',
  GET_FILE_PATH: 'documentos.getFilePath',
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
