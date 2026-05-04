/**
 * API Client para Usuarios — HU-19
 * Reutiliza authHeaders() del módulo auth.
 */
import { authHeaders } from './auth';

const API_BASE = '/api/auth/users';

export interface UserRecord {
  id: number;
  nombre: string;
  email: string;
  rol: string;
  contratistaId?: number;
  activo: boolean;
  creadoEn: string;
  actualizadoEn: string;
}

export interface CreateUserDto {
  nombre: string;
  email: string;
  password: string;
  rol?: string;
  contratistaId?: number;
}

export interface UpdateUserDto {
  nombre?: string;
  email?: string;
  password?: string;
  rol?: string;
  contratistaId?: number;
}

export const usersApi = {
  async getAll(): Promise<UserRecord[]> {
    const res = await fetch(API_BASE, { headers: authHeaders() });
    if (!res.ok) throw new Error('Error al obtener usuarios');
    return res.json();
  },

  async create(data: CreateUserDto): Promise<UserRecord> {
    const res = await fetch(API_BASE, {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ message: 'Error al crear' }));
      throw new Error(err.message || 'Error al crear usuario');
    }
    return res.json();
  },

  async update(id: number, data: UpdateUserDto): Promise<UserRecord> {
    const res = await fetch(`${API_BASE}/${id}`, {
      method: 'PUT',
      headers: authHeaders(),
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ message: 'Error al actualizar' }));
      throw new Error(err.message || 'Error al actualizar usuario');
    }
    return res.json();
  },

  async toggleActive(id: number): Promise<UserRecord> {
    const res = await fetch(`${API_BASE}/${id}/toggle`, {
      method: 'PATCH',
      headers: authHeaders(),
    });
    if (!res.ok) throw new Error('Error al cambiar estado');
    return res.json();
  },
};
