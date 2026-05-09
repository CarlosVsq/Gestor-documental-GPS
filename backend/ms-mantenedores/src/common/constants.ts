/**
 * Constantes compartidas — ms-mantenedores
 */
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
