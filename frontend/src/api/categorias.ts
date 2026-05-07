import { authHeaders } from './auth';

const API_BASE = '/api/categorias';

export interface Categoria {
  id: number;
  nombre: string;
  descripcion: string;
  activo: boolean;
  creadoEn: string;
  actualizadoEn: string;
}

export interface CreateCategoriaDto {
  nombre: string;
  descripcion?: string;
}

export const categoriasApi = {
  findAll: async (page = 1, limit = 10): Promise<{ data: Categoria[]; total: number }> => {
    const res = await fetch(`${API_BASE}?page=${page}&limit=${limit}`, {
      headers: authHeaders(),
    });
    if (!res.ok) throw new Error('Error al obtener categorias');
    return res.json();
  },
  create: async (data: CreateCategoriaDto): Promise<Categoria> => {
    const res = await fetch(API_BASE, {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || 'Error al crear categoria');
    }
    return res.json();
  },
  update: async (id: number, data: Partial<CreateCategoriaDto>): Promise<Categoria> => {
    const res = await fetch(`${API_BASE}/${id}`, {
      method: 'PUT',
      headers: authHeaders(),
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || 'Error al actualizar categoria');
    }
    return res.json();
  },
  toggle: async (id: number): Promise<{ activo: boolean }> => {
    const res = await fetch(`${API_BASE}/${id}/toggle`, {
      method: 'PATCH',
      headers: authHeaders(),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || 'Error al cambiar estado');
    }
    return res.json();
  },
};
