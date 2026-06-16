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

// HU-33: documento para el panel de Actividad Reciente
export interface DocumentoReciente {
  id: number;
  nombreOriginal: string;
  mimeType: string;
  estadoDocumento: EstadoDocumento;
  autorId: number;
  creadoPor: string;
  creadoEn: string;
  requerimientoId: number;
  codigoTicket?: string;
  tituloRequerimiento?: string;
  contratistaId?: number;
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

export interface AlmacenamientoStats {
  byCategoria: Array<{ categoriaId: number; count: number }>;
  bySubtipo: Array<{ subtipoId: number; count: number }>;
  total: number;
}

export const almacenamientoApi = {
  /**
   * HU-33: Documentos más recientes para el panel de Actividad Reciente.
   */
  async getRecientes(limit = 20): Promise<DocumentoReciente[]> {
    const res = await fetch(`${API_BASE}/recientes?limit=${limit}`, {
      headers: authHeaders(),
    });
    if (!res.ok) throw new Error('Error al obtener la actividad reciente');
    return res.json();
  },

  /**
   * HU-21: Distribución de documentos por categoría/subtipo (página Reportes).
   */
  async getStats(filtros?: { proyectoId?: number; desde?: string; hasta?: string }): Promise<AlmacenamientoStats> {
    const params = new URLSearchParams();
    if (filtros?.proyectoId) params.append('proyectoId', String(filtros.proyectoId));
    if (filtros?.desde) params.append('desde', filtros.desde);
    if (filtros?.hasta) params.append('hasta', filtros.hasta);
    const res = await fetch(`${API_BASE}/stats?${params}`, { headers: authHeaders() });
    if (!res.ok) throw new Error('Error al obtener estadísticas de documentos');
    return res.json();
  },

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
   * HU-N8: Generar y archivar el reporte de auditoría de cierre del requerimiento.
   * Solo supervisor/admin/gerente. El reporte se guarda como documento OFICIAL
   * en el expediente del requerimiento.
   */
  async generarReporteCierre(
    requerimientoId: number,
  ): Promise<{ documentoId: number; sha256Hash: string }> {
    const res = await fetch(`${API_BASE}/reporte-cierre/${requerimientoId}`, {
      method: 'POST',
      headers: authHeaders(),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ message: 'Error generando el reporte de cierre' }));
      throw new Error(err.message || 'Error generando el reporte de cierre');
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
   * El PDF firmado reemplaza al original en el sistema y se registra quién
   * firmó y cuándo (firmadoEn/firmadoPorId).
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

  async exportStats(filtros?: { proyectoId?: number; desde?: string; hasta?: string }): Promise<void> {
    const params = new URLSearchParams();
    if (filtros?.proyectoId) params.set('proyectoId', String(filtros.proyectoId));
    if (filtros?.desde) params.set('desde', filtros.desde);
    if (filtros?.hasta) params.set('hasta', filtros.hasta);
    const url = `${API_BASE}/stats/export${params.toString() ? `?${params}` : ''}`;
    const res = await fetch(url, { headers: authHeaders() });
    if (!res.ok) throw new Error('Error al exportar a Excel');
    const blob = await res.blob();
    const disposition = res.headers.get('content-disposition') || '';
    const match = disposition.match(/filename="?([^"]+)"?/);
    const filename = match ? decodeURIComponent(match[1]) : 'distribucion-documentos.xlsx';
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(link.href);
  },
};
