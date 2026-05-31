/**
 * Constantes compartidas — ms-requerimientos
 */
export const DOCUMENTOS_PATTERNS = {
  CREATE: 'documentos.create',
  FIND_ALL: 'documentos.findAll',
  GET_FILE_PATH: 'documentos.getFilePath',
} as const;

export const REQUERIMIENTOS_PATTERNS = {
  CREATE: 'requerimientos.create',
  FIND_ALL: 'requerimientos.findAll',
  FIND_ONE: 'requerimientos.findOne',
  UPDATE_STATE: 'requerimientos.updateState',
} as const;

/** Patterns que este microservicio consume vía TCP del ms-almacenamiento. */
export const ALMACENAMIENTO_PATTERNS = {
  CREATE_EXPEDIENTE: 'almacenamiento.expediente.create',
  FIND_BY_REQUERIMIENTO: 'almacenamiento.findByRequerimiento',
} as const;

/** Token de inyección del cliente TCP hacia ms-almacenamiento */
export const ALMACENAMIENTO_CLIENT = 'ALMACENAMIENTO_SERVICE';
