import { authHeaders } from './auth';

const API_BASE = '/api/almacenamiento';

export type EstadoDocumento = 'BORRADOR' | 'OFICIAL' | 'OBSOLETO';

function multipartHeaders(): Record<string, string> {
  const h = authHeaders();
  delete h['Content-Type'];
  return h;
}

// Tipos MIME permitidos (sincronizado con ALLOWED_MIME_TYPES del backend)
// Para agregar tipos: edita también la variable ALLOWED_MIME_TYPES en .env
export const ALLOWED_MIME_TYPES = [
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // .docx
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',       // .xlsx
  'application/msword',                                                        // .doc
  'image/png',
  'image/jpeg',
  'image/gif',
  'image/webp',
];

export const ALLOWED_EXTENSIONS = '.pdf,.docx,.xlsx,.doc,.png,.jpg,.jpeg,.gif,.webp';

export interface Documento {
  id: number;
  nombreOriginal: string;
  nombreStorage: string;
  pathSeaweed: string;
  mimeType: string;
  tamañoBytes: number;
  sha256Hash: string | null;
  requerimientoId: number;
  estadoDocumento: EstadoDocumento;
  version: number;
  autorId: number;
  creadoPor: string;
  creadoEn: string;
  // Campos heredados del requerimiento (en búsqueda)
  codigoTicket?: string;
  tituloRequerimiento?: string;
  proyectoId?: number;
  areaId?: number;
  contratistaId?: number;
  categoriaId?: number;
}

export interface UploadResult {
  exitosos: Documento[];
  errores: Array<{ nombreOriginal: string; motivo: string }>;
}

export interface SearchFiltros {
  q?: string;
  contratistaId?: number;
  proyectoId?: number;
  areaId?: number;
  categoriaId?: number;
  requerimientoId?: number;
  estadoDocumento?: EstadoDocumento;
  page?: number;
  limit?: number;
}

export interface TreeNode {
  contratistaId: number;
  contratistaNombre?: string;
  areaId: number;
  areaNombre?: string;
  proyectoId: number;
  proyectoNombre?: string;
  requerimientoId: number;
  codigoTicket: string;
  titulo: string;
  totalDocumentos: number;
}

export const almacenamientoApi = {
  /**
   * HU-07: Subir un documento individual
   */
  async upload(
    file: File,
    requerimientoId: number,
    storagePath?: string,
  ): Promise<Documento> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('requerimientoId', requerimientoId.toString());
    if (storagePath) formData.append('storagePath', storagePath);

    const res = await fetch(`${API_BASE}/upload`, {
      method: 'POST',
      headers: multipartHeaders(),
      body: formData,
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({ message: 'Error al subir archivo' }));
      throw new Error(err.message || 'Error al subir archivo');
    }
    return res.json();
  },

  /**
   * HU-08: Carga masiva de documentos
   */
  async uploadBulk(
    files: File[],
    requerimientoId: number,
    storagePath?: string,
    onProgress?: (loaded: number, total: number) => void,
  ): Promise<UploadResult> {
    const formData = new FormData();
    files.forEach((f) => formData.append('files', f));
    formData.append('requerimientoId', requerimientoId.toString());
    if (storagePath) formData.append('storagePath', storagePath);

    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.open('POST', `${API_BASE}/upload-bulk`);

      Object.entries(multipartHeaders()).forEach(([k, v]) => xhr.setRequestHeader(k, v as string));

      xhr.upload.addEventListener('progress', (e) => {
        if (e.lengthComputable && onProgress) onProgress(e.loaded, e.total);
      });

      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          resolve(JSON.parse(xhr.responseText));
        } else {
          const err = JSON.parse(xhr.responseText || '{}');
          reject(new Error(err.message || 'Error en carga masiva'));
        }
      };

      xhr.onerror = () => reject(new Error('Error de red'));
      xhr.send(formData);
    });
  },

  /**
   * Descarga un documento
   */
  async downloadBlob(id: number): Promise<{ blob: Blob; filename: string }> {
    const res = await fetch(`${API_BASE}/${id}/download`, {
      headers: authHeaders(),
    });
    if (!res.ok) throw new Error('Error al descargar documento');

    const disposition = res.headers.get('content-disposition') || '';
    const match = disposition.match(/filename="?([^"]+)"?/);
    const filename = match ? decodeURIComponent(match[1]) : 'documento';

    return { blob: await res.blob(), filename };
  },

  /**
   * Obtener documentos de un requerimiento
   */
  async getByRequerimiento(requerimientoId: number): Promise<Documento[]> {
    const res = await fetch(`${API_BASE}/requerimiento/${requerimientoId}`, {
      headers: authHeaders(),
    });
    if (!res.ok) throw new Error('Error al obtener documentos');
    return res.json();
  },

  /**
   * HU-31: Búsqueda por metadatos
   */
  async search(filtros: SearchFiltros): Promise<{ data: Documento[]; total: number }> {
    const cleanFiltros = Object.fromEntries(
      Object.entries(filtros).filter(([, v]) => v != null && v !== ''),
    );
    const params = new URLSearchParams(cleanFiltros as any);
    const res = await fetch(`${API_BASE}/search?${params}`, {
      headers: authHeaders(),
    });
    if (!res.ok) throw new Error('Error en búsqueda');
    return res.json();
  },

  /**
   * HU-32: Árbol jerárquico
   */
  async getTree(): Promise<TreeNode[]> {
    const res = await fetch(`${API_BASE}/tree`, {
      headers: authHeaders(),
    });
    if (!res.ok) throw new Error('Error al obtener árbol');
    return res.json();
  },

  /**
   * HU-29: Generar PDF inmutable de cierre
   */
  async generatePdf(
    requerimientoId: number,
    storagePath: string,
    firmaBase64?: string,
  ): Promise<{ documentoId: number; sha256Hash: string }> {
    const res = await fetch(`${API_BASE}/pdf/${requerimientoId}`, {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify({ storagePath, firmaBase64 }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ message: 'Error generando PDF' }));
      throw new Error(err.message || 'Error generando PDF');
    }
    return res.json();
  },

  /**
   * Eliminar documento
   */
  async delete(id: number): Promise<void> {
    const res = await fetch(`${API_BASE}/${id}`, {
      method: 'DELETE',
      headers: authHeaders(),
    });
    if (!res.ok) throw new Error('Error al eliminar documento');
  },

  /**
   * Cambiar estado de documento: BORRADOR → OFICIAL → OBSOLETO
   */
  async updateEstado(id: number, estado: EstadoDocumento): Promise<Documento> {
    const res = await fetch(`${API_BASE}/${id}/estado`, {
      method: 'PATCH',
      headers: authHeaders(),
      body: JSON.stringify({ estado }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ message: 'Error al actualizar estado' }));
      throw new Error(err.message || 'Error al actualizar estado');
    }
    return res.json();
  },

  /**
   * HU-11: Estampar firma en un PDF y descargar el resultado.
   * No se guarda en el sistema — el documento original queda intacto.
   */
  async firmarDocumento(
    id: number,
    firmaBase64: string,
    posicion?: {
      pagina?: number;
      xPct?: number;
      yPct?: number;
      anchoPct?: number;
      altoPct?: number;
    },
  ): Promise<{ blob: Blob; filename: string }> {
    const res = await fetch(`${API_BASE}/${id}/firmar`, {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify({ firmaBase64, ...(posicion || {}) }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ message: 'Error al firmar documento' }));
      throw new Error(err.message || 'Error al firmar documento');
    }
    const disposition = res.headers.get('content-disposition') || '';
    const match = disposition.match(/filename="?([^"]+)"?/);
    const filename = match ? decodeURIComponent(match[1]) : 'documento_firmado.pdf';
    return { blob: await res.blob(), filename };
  },
};
