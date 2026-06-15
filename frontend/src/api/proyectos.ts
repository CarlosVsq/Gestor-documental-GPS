/**
 * API Client para Proyectos
 */

import { authHeaders } from './auth';

const API_BASE = '/api/proyectos';

export interface Proyecto {
    id: number;
    nombre: string;
    codigo: string;
    fechaInicio: string;
    fechaFin: string;
    areaId: number;
    ubicacion?: string;
    presupuestoEstimado?: number;
    horasHombre?: number;
    estadoProyecto: 'En Licitación' | 'Ejecución' | 'Finalizado' | 'Suspendido';
    activo: boolean;
    area?: {
        id: number;
        nombre: string;
        contratista?: {
            id: number;
            nombre: string;
            rut: string;
        };
    };
    creadoPor: string;
    actualizadoPor: string;
    creadoEn: string;
    actualizadoEn: string;
}

export interface CreateProyectoDto {
    nombre: string;
    fechaInicio: string;
    fechaFin: string;
    areaId: number;
    ubicacion?: string;
    presupuestoEstimado?: number;
    horasHombre?: number;
    estadoProyecto: 'En Licitación' | 'Ejecución' | 'Finalizado' | 'Suspendido';
}

export interface ProyectosResponse {
    data: Proyecto[];
    total: number;
}

export interface ProyectoStats {
    total: number;
    activos: number;
    inactivos: number;
}

export const proyectosApi = {
    async getAll(page = 1, limit = 10): Promise<ProyectosResponse> {
        const res = await fetch(`${API_BASE}?page=${page}&limit=${limit}`, {
            headers: authHeaders(),
        });
        if (!res.ok) throw new Error('Error al obtener proyectos');
        return res.json();
    },

    async getOne(id: number): Promise<Proyecto> {
        const res = await fetch(`${API_BASE}/${id}`, {
            headers: authHeaders(),
        });
        if (!res.ok) throw new Error('Proyecto no encontrado');
        return res.json();
    },

    async create(data: CreateProyectoDto): Promise<Proyecto> {
        const res = await fetch(API_BASE, {
            method: 'POST',
            headers: authHeaders(),
            body: JSON.stringify(data),
        });
        if (!res.ok) {
            const err = await res.json();
            throw new Error(err.message || 'Error al crear proyecto');
        }
        return res.json();
    },

    async update(id: number, data: Partial<CreateProyectoDto>): Promise<Proyecto> {
        const res = await fetch(`${API_BASE}/${id}`, {
            method: 'PUT',
            headers: authHeaders(),
            body: JSON.stringify(data),
        });
        if (!res.ok) {
            const err = await res.json();
            throw new Error(err.message || 'Error al actualizar proyecto');
        }
        return res.json();
    },

    async toggle(id: number): Promise<{ activo: boolean }> {
        const res = await fetch(`${API_BASE}/${id}/toggle`, {
            method: 'PATCH',
            headers: authHeaders(),
        });
        if (!res.ok) {
            const err = await res.json();
            throw new Error(err.message || 'Error al cambiar estado del proyecto');
        }
        return res.json();
    },

    async getStats(): Promise<ProyectoStats> {
        const res = await fetch(`${API_BASE}/stats`, {
            headers: authHeaders(),
        });
        if (!res.ok) throw new Error('Error al obtener estadísticas');
        return res.json();
    },
};
