/**
 * API Client para Autenticación — HU-25
 * Maneja login, perfil y gestión del token JWT.
 */

const API_BASE = '/api/auth';
const TOKEN_KEY = 'sgd_token';
const USER_KEY = 'sgd_user';

export interface AuthUser {
  id: number;
  nombre: string;
  email: string;
  rol: string;
  contratistaId?: number;
}

export interface LoginResponse {
  access_token: string;
  user: AuthUser;
}

/**
 * Obtener el token almacenado.
 */
export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

/**
 * Obtener el usuario almacenado.
 */
export function getStoredUser(): AuthUser | null {
  const raw = localStorage.getItem(USER_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

/**
 * Guardar token y usuario en localStorage.
 */
export function saveAuth(token: string, user: AuthUser): void {
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(USER_KEY, JSON.stringify(user));
}

/**
 * Limpiar sesión.
 */
export function clearAuth(): void {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}

/**
 * Crear headers con Authorization Bearer.
 */
export function authHeaders(): Record<string, string> {
  const token = getToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
}

export const authApi = {
  /**
   * Iniciar sesión.
   */
  async login(email: string, password: string): Promise<LoginResponse> {
    const res = await fetch(`${API_BASE}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({ message: 'Error de conexión' }));
      throw new Error(err.message || 'Credenciales inválidas');
    }

    const data: LoginResponse = await res.json();
    saveAuth(data.access_token, data.user);
    return data;
  },

  /**
   * Obtener perfil del usuario autenticado.
   */
  async getProfile(): Promise<AuthUser> {
    const res = await fetch(`${API_BASE}/profile`, {
      headers: authHeaders(),
    });

    if (!res.ok) {
      clearAuth();
      throw new Error('Sesión expirada');
    }

    return res.json();
  },
};
