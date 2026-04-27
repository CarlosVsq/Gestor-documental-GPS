/**
 * API Client para Áreas (HU-02)
 * Comunica el frontend con el backend NestJS
 */

const API_BASE = '/api/areas';

export interface Area {
  id: number;
  nombre: string;
  descripcion?: string;
  contratistaId: number;
  activo: boolean;
  contratista?: {
    id: number;
    nombre: string;
    rut: string;
  };
  creadoPor: string;
  actualizadoPor: string;
  creadoEn: string;
  actualizadoEn: string;
}

export interface CreateAreaDto {
  nombre: string;
  descripcion?: string;
  contratistaId: number;
}

export interface AreasResponse {
  data: Area[];
  total: number;
}

export interface AreaStats {
  total: number;
  activas: number;
  inactivas: number;
}

export const areasApi = {
  async getAll(page = 1, limit = 10): Promise<AreasResponse> {
    const res = await fetch(`${API_BASE}?page=${page}&limit=${limit}`);
    if (!res.ok) throw new Error('Error al obtener áreas');
    return res.json();
  },

  async getOne(id: number): Promise<Area> {
    const res = await fetch(`${API_BASE}/${id}`);
    if (!res.ok) throw new Error('Área no encontrada');
    return res.json();
  },

  async create(data: CreateAreaDto): Promise<Area> {
    const res = await fetch(API_BASE, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.message || 'Error al crear área');
    }
    return res.json();
  },

  async update(id: number, data: Partial<CreateAreaDto>): Promise<Area> {
    const res = await fetch(`${API_BASE}/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.message || 'Error al actualizar área');
    }
    return res.json();
  },

  async delete(id: number): Promise<void> {
    const res = await fetch(`${API_BASE}/${id}`, { method: 'DELETE' });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.message || 'Error al eliminar área');
    }
  },

  async getStats(): Promise<AreaStats> {
    const res = await fetch(`${API_BASE}/stats`);
    if (!res.ok) throw new Error('Error al obtener estadísticas');
    return res.json();
  },
};
