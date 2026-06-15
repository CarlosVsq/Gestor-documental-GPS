import { authHeaders } from './auth';

const API_BASE = '/api/requerimientos';

export enum EstadoRequerimiento {
  ABIERTO = 'Abierto',
  EN_PROGRESO = 'En Progreso',
  CERRADO = 'Cerrado',
}

export enum PrioridadRequerimiento {
  BAJA = 'BAJA',
  MEDIA = 'MEDIA',
  ALTA = 'ALTA',
  CRITICA = 'CRITICA',
}

export interface Requerimiento {
  id: number;
  codigoTicket: string;
  titulo: string;
  descripcion: string;
  estado: EstadoRequerimiento;
  prioridad: PrioridadRequerimiento;
  fechaVencimiento: string | null;
  proyectoId: number;
  areaId: number;
  contratistaId: number;
  categoriaId: number;
  subtipoId: number;
  usuarioCreadorId: number | null;
  asignadoAId: number | null;
  storagePath: string | null;
  totalDocumentos: number;
  fechaCierre: string | null;
  motivoRechazo: string | null;
  creadoEn: string;
  actualizadoEn: string;
}

export interface CreateRequerimientoDto {
  titulo: string;
  descripcion?: string;
  prioridad?: PrioridadRequerimiento;
  fechaVencimiento?: string;
  proyectoId: number;
  areaId: number;
  contratistaId: number;
  categoriaId: number;
  subtipoId: number;
}

export interface TendenciaPunto {
  semana: string;
  creados: number;
  cerrados: number;
}

export interface RequerimientosStats {
  total: number;
  abiertos: number;
  enProgreso: number;
  cerrados: number;
  estancados: number;
  tendencia: TendenciaPunto[];
}

export const requerimientosApi = {
  async getAll(page = 1, limit = 10, filtros?: any) {
    const cleanedFiltros = Object.fromEntries(
      Object.entries(filtros || {}).filter(([_, v]) => v != null && v !== '')
    );
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
      ...cleanedFiltros
    });

    const res = await fetch(`${API_BASE}?${params.toString()}`, {
      headers: authHeaders(),
    });
    if (!res.ok) throw new Error('Error al obtener requerimientos');
    return res.json();
  },

  async getById(id: number) {
    const res = await fetch(`${API_BASE}/${id}`, {
      headers: authHeaders(),
    });
    if (!res.ok) throw new Error('Requerimiento no encontrado');
    return res.json();
  },

  async create(data: CreateRequerimientoDto) {
    const res = await fetch(API_BASE, {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.message || 'Error al crear requerimiento');
    }
    return res.json();
  },

  async updateState(id: number, estado: EstadoRequerimiento, motivoRechazo?: string) {
    const res = await fetch(`${API_BASE}/${id}/estado`, {
      method: 'PATCH',
      headers: authHeaders(),
      body: JSON.stringify({ estado, motivoRechazo }),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.message || 'Error al actualizar estado');
    }
    return res.json();
  },

  // HU-23: KPIs calculados en el backend (antes se traían 1000 filas y se
  // contaban en el cliente). Devuelve conteos por estado, estancados y tendencia.
  async getStats(): Promise<RequerimientosStats> {
    const res = await fetch(`${API_BASE}/stats`, {
      headers: authHeaders(),
    });
    if (!res.ok) throw new Error('Error al obtener estadísticas de requerimientos');
    return res.json();
  }
};
