/**
 * API Client para Contratistas
 * Comunica el frontend con el backend NestJS
 */

const API_BASE = '/api/contratistas';

export interface Contratista {
  id: number;
  nombre: string;
  rut: string;
  email: string;
  telefono?: string;
  activo: boolean;
  creadoPor: string;
  actualizadoPor: string;
  creadoEn: string;
  actualizadoEn: string;
}

export interface CreateContratistaDto {
  nombre: string;
  rut: string;
  email: string;
  telefono?: string;
}

export interface ContratistasResponse {
  data: Contratista[];
  total: number;
}

export interface ContratistaStats {
  total: number;
  activos: number;
  inactivos: number;
}

export const contratistasApi = {
  async getAll(page = 1, limit = 10): Promise<ContratistasResponse> {
    const res = await fetch(`${API_BASE}?page=${page}&limit=${limit}`);
    if (!res.ok) throw new Error('Error al obtener contratistas');
    return res.json();
  },

  async getOne(id: number): Promise<Contratista> {
    const res = await fetch(`${API_BASE}/${id}`);
    if (!res.ok) throw new Error('Contratista no encontrado');
    return res.json();
  },

  async create(data: CreateContratistaDto): Promise<Contratista> {
    const res = await fetch(API_BASE, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.message || 'Error al crear contratista');
    }
    return res.json();
  },

  async update(id: number, data: Partial<CreateContratistaDto>): Promise<Contratista> {
    const res = await fetch(`${API_BASE}/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.message || 'Error al actualizar contratista');
    }
    return res.json();
  },

  async delete(id: number): Promise<void> {
    const res = await fetch(`${API_BASE}/${id}`, { method: 'DELETE' });
    if (!res.ok) throw new Error('Error al eliminar contratista');
  },

  async getStats(): Promise<ContratistaStats> {
    const res = await fetch(`${API_BASE}/stats`);
    if (!res.ok) throw new Error('Error al obtener estadísticas');
    return res.json();
  },
};
