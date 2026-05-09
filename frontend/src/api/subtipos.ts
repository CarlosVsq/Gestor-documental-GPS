import { authHeaders } from './auth';
import type { Categoria } from './categorias';

const API_BASE = '/api/subtipos';

export interface Subtipo {
  id: number;
  nombre: string;
  descripcion: string;
  categoriaId: number;
  categoria?: Categoria;
  activo: boolean;
  creadoEn: string;
  actualizadoEn: string;
}

export interface CreateSubtipoDto {
  nombre: string;
  descripcion?: string;
  categoriaId: number;
}

export const subtiposApi = {
  findAll: async (page = 1, limit = 10, categoriaId?: number): Promise<{ data: Subtipo[]; total: number }> => {
    const params = new URLSearchParams({ page: page.toString(), limit: limit.toString() });
    if (categoriaId !== undefined) {
      params.append('categoriaId', categoriaId.toString());
    }
    const res = await fetch(`${API_BASE}?${params.toString()}`, { headers: authHeaders() });
    if (!res.ok) throw new Error('Error al obtener subtipos');
    return res.json();
  },
  create: async (data: CreateSubtipoDto): Promise<Subtipo> => {
    const res = await fetch(API_BASE, { method: 'POST', headers: authHeaders(), body: JSON.stringify(data) });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || 'Error al crear subtipo');
    }
    return res.json();
  },
  update: async (id: number, data: Partial<CreateSubtipoDto>): Promise<Subtipo> => {
    const res = await fetch(`${API_BASE}/${id}`, { method: 'PUT', headers: authHeaders(), body: JSON.stringify(data) });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || 'Error al actualizar subtipo');
    }
    return res.json();
  },
  toggle: async (id: number): Promise<{ activo: boolean }> => {
    const res = await fetch(`${API_BASE}/${id}/toggle`, { method: 'PATCH', headers: authHeaders() });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || 'Error al cambiar estado');
    }
    return res.json();
  },
};
