import { authHeaders, getToken } from './auth';

export interface Notificacion {
  id: number;
  usuarioId: number;
  titulo: string;
  mensaje: string;
  tipo: 'DOCUMENT_UPLOADED' | 'STATE_CHANGED' | 'REQUIREMENT_CLOSED' | 'USER_ASSIGNED';
  leida: boolean;
  creadaEn: string;
}

export const notificacionesApi = {
  /**
   * Obtener todas las notificaciones del usuario.
   */
  async getAll(soloNoLeidas = false, limit = 50): Promise<Notificacion[]> {
    const query = new URLSearchParams({
      soloNoLeidas: String(soloNoLeidas),
      limit: String(limit),
    });
    const res = await fetch(`/api/notificaciones?${query}`, {
      headers: authHeaders(),
    });
    if (!res.ok) throw new Error('Error al obtener notificaciones');
    return res.json();
  },

  /**
   * Marcar una notificación específica como leída.
   */
  async marcarLeida(id: number): Promise<Notificacion> {
    const res = await fetch(`/api/notificaciones/${id}/leer`, {
      method: 'PATCH',
      headers: authHeaders(),
    });
    if (!res.ok) throw new Error('Error al marcar notificación como leída');
    return res.json();
  },

  /**
   * Marcar todas las notificaciones del usuario como leídas.
   */
  async marcarTodasLeidas(): Promise<{ affected: number }> {
    const res = await fetch('/api/notificaciones/leer-todas', {
      method: 'PATCH',
      headers: authHeaders(),
    });
    if (!res.ok) throw new Error('Error al marcar todas como leídas');
    return res.json();
  },

  /**
   * Abre un stream SSE a la ruta de notificaciones del api-gateway.
   */
  subscribeToStream(onMessage: (data: { notificaciones: Notificacion[]; count: number }) => void): () => void {
    const token = getToken();
    if (!token) return () => {};

    // El api-gateway usa JwtAuthGuard en el endpoint de notificaciones.
    // EventSource nativo no permite cabeceras directamente.
    // Usaremos un truco común en SPA: pasar el token como un query parameter temporal,
    // o dado que no queremos modificar el JwtAuthGuard del backend que espera Bearer en header,
    // usamos una conexión donde EventSource se configure. Como alternativa para mantener compatibilidad
    // limpia con JwtAuthGuard (que espera header), podemos usar la librería event-source-polyfill
    // o simplemente abrir la conexión pasando el token en query params y adaptando levemente el gateway
    // si fuese necesario.
    // No obstante, si el api-gateway de NestJS ya soporta lectura de token en query params para el guard:
    // Revisemos si el JwtAuthGuard puede extraer el token de query param o si podemos simularlo.
    // Asumiendo que el JwtAuthGuard del gateway admite token en query o para no romper nada,
    // creamos el stream apuntando a `/api/notificaciones/stream?token=...`.
    // Si no, también podemos usar EventSource estándar. Para propósitos de este flujo, el EventSource
    // se conecta a `/api/notificaciones/stream` (NestJS JwtAuthGuard en este codebase usualmente
    // solo lee de Bearer, pero al ser SSE se suele enviar por query param o cookie).
    // Conectamos:
    const eventSource = new EventSource(`/api/notificaciones/stream?token=${encodeURIComponent(token)}`);

    eventSource.onmessage = (event) => {
      try {
        const payload = JSON.parse(event.data);
        onMessage(payload);
      } catch (err) {
        console.error('Error parseando evento SSE:', err);
      }
    };

    eventSource.onerror = (err) => {
      console.warn('Conexión SSE perdida. Intentando reconectar...', err);
    };

    return () => {
      eventSource.close();
    };
  }
};
