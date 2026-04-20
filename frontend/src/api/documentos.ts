import { authHeaders } from './auth';

export interface DocumentoRecord {
  id: number;
  nombreOriginal: string;
  storageId: string;
  mimeType: string;
  tamañoBytes: number;
  creadoEn: string;
  autor: {
    id: number;
    nombre: string;
    email: string;
  };
}

const API_BASE = '/api/documentos';

export const documentosApi = {
  /**
   * Obtiene la lista histórica de todos los documentos subidos
   */
  getAll: async (): Promise<DocumentoRecord[]> => {
    const res = await fetch(API_BASE, { headers: authHeaders() });
    if (!res.ok) throw new Error('Error al obtener documentos');
    return res.json();
  },

  /**
   * Sube un nuevo documento técnico usando FormData
   */
  upload: async (file: File): Promise<DocumentoRecord> => {
    const formData = new FormData();
    formData.append('file', file);

    const headers = authHeaders();
    // IMPORTANTE: Al subir FormData con fetch, NO debemos forzar Content-Type.
    // El navegador agrega automáticamente el límite (boundary).
    delete headers['Content-Type'];

    const res = await fetch(`${API_BASE}/upload`, {
      method: 'POST',
      headers,
      body: formData,
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({ message: 'Error de conexión' }));
      throw new Error(err.message || 'Error al subir el documento');
    }

    return res.json();
  },

  /**
   * Descarga el documento como un Blob enviando el JWT
   */
  downloadBlob: async (id: number): Promise<Blob> => {
    const res = await fetch(`${API_BASE}/${id}/download`, { headers: authHeaders() });
    if (!res.ok) throw new Error('Error al descargar documento');
    return res.blob();
  }
};
