import { authHeaders } from './auth';

const API_BASE = '/api/requerimientos';

export enum EstadoRequerimiento {
  ABIERTO = 'Abierto',
  EN_PROGRESO = 'En Progreso',
  CERRADO = 'Cerrado',
}

export interface Requerimiento {
  id: number;
  titulo: string;
  descripcion: string;
  estado: EstadoRequerimiento;
  proyectoId: number;
  areaId: number;
  contratistaId: number;
  categoriaId: number;
  subtipoId: number;
  creadoEn: string;
  actualizadoEn: string;
}

export interface CreateRequerimientoDto {
  titulo: string;
  descripcion?: string;
  proyectoId: number;
  areaId: number;
  contratistaId: number;
  categoriaId: number;
  subtipoId: number;
}

export const requerimientosApi = {
  findAll: async (page = 1, limit = 10): Promise<{ data: Requerimiento[]; total: number }> => {
    const res = await fetch(`${API_BASE}?page=${page}&limit=${limit}`, { headers: authHeaders() });
    if (!res.ok) throw new Error('Error al obtener requerimientos');
    return res.json();
  },
  create: async (data: CreateRequerimientoDto): Promise<Requerimiento> => {
    const res = await fetch(API_BASE, { method: 'POST', headers: authHeaders(), body: JSON.stringify(data) });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || 'Error al crear requerimiento');
    }
    return res.json();
  },
  updateState: async (id: number, estado: EstadoRequerimiento): Promise<Requerimiento> => {
    const res = await fetch(`${API_BASE}/${id}/estado`, {
      method: 'PATCH',
      headers: authHeaders(),
      body: JSON.stringify({ estado }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || 'Error al actualizar estado');
    }
    return res.json();
  },
};
