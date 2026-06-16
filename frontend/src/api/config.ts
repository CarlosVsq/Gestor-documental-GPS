import { authHeaders } from './auth';

export interface SessionConfig {
  timeout_warning_ms: number;
  timeout_logout_ms: number;
  warning_message: string;
}

export const configApi = {
  /**
   * Obtiene la configuración del timeout de inactividad de sesión (HU-27).
   */
  async getSessionConfig(): Promise<SessionConfig> {
    const res = await fetch('/api/config/session', {
      headers: authHeaders(),
    });

    if (!res.ok) {
      throw new Error('No se pudo obtener la configuración de sesión');
    }

    return res.json();
  },
};
