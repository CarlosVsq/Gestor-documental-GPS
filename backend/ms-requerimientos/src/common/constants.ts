/**
 * Constantes compartidas — ms-documentos
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
