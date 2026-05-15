/**
 * Constantes compartidas — ms-almacenamiento
 * Puerto TCP: 3003 (reemplaza ms-documentos)
 */

// ─── Patrones propios del servicio ─────────────────────────────────────────
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
  // PDF inmutable
  GENERATE_PDF: 'almacenamiento.pdf.generate',
} as const;

// ─── Tipos de archivo permitidos ────────────────────────────────────────────
// Para modificar la lista de extensiones/MIME permitidos, cambia la variable de
// entorno ALLOWED_MIME_TYPES (separada por comas) o edita el array por defecto.
export const DEFAULT_ALLOWED_MIME_TYPES = [
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // .docx
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',       // .xlsx
  'application/msword',                                                        // .doc
  'application/vnd.ms-excel',                                                  // .xls
  'image/png',
  'image/jpeg',
  'image/gif',
  'image/webp',
];

// Tamaño máximo en bytes (configurable via env MAX_FILE_SIZE_MB, default 50)
export const getMaxFileSizeBytes = (): number => {
  const mb = parseInt(process.env.MAX_FILE_SIZE_MB || '50', 10);
  return mb * 1024 * 1024;
};

// Estados de documento
export enum EstadoDocumento {
  BORRADOR = 'BORRADOR',
  OFICIAL = 'OFICIAL',
  OBSOLETO = 'OBSOLETO',
}
