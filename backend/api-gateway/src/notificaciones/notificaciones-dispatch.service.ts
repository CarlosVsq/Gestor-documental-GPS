import { Inject, Injectable, Logger } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { firstValueFrom, timeout } from 'rxjs';
import {
  SERVICE_NAMES,
  AUTH_PATTERNS,
  NOTIFICACIONES_PATTERNS,
  TipoNotificacion,
  Role,
} from '../common/constants';

interface CrearNotificacionDto {
  usuarioDestinoId: number;
  tipo: TipoNotificacion;
  titulo: string;
  mensaje?: string;
  entidad?: string;
  entidadId?: number;
  requerimientoId?: number;
  metadata?: Record<string, any>;
}

/** Roles que reciben aviso de subida de documento (HU-34). */
const ROLES_SUPERVISION: Role[] = [Role.SUPERVISOR, Role.GERENTE, Role.ADMIN];
const DISPATCH_TIMEOUT_MS = 3000;
const SUPERVISORES_TTL_MS = 60_000;

/**
 * NotificacionesDispatchService — HU-34/HU-35 (Fix 1)
 *
 * Resuelve los DESTINATARIOS REALES de cada notificación y crea una fila por
 * destinatario (en lugar del antiguo broadcast `usuarioDestinoId = 0`).
 *
 * Vive en el API Gateway porque es el único punto que tiene clientes TCP a
 * `ms-auth` (lista de supervisores) y conoce al actor de la petición
 * (`req.user`). `ms-auditoria` vuelve a ser un sink puro de auditoría.
 *
 * Se invoca fire-and-forget desde `AuditoriaInterceptor`: si falla, nunca
 * rompe la petición del usuario.
 */
@Injectable()
export class NotificacionesDispatchService {
  private readonly logger = new Logger(NotificacionesDispatchService.name);
  private supervisoresCache: { ids: number[]; expires: number } | null = null;

  constructor(
    @Inject(SERVICE_NAMES.AUTH) private readonly authClient: ClientProxy,
    // El módulo de notificaciones vive dentro de ms-auditoria (mismo servicio TCP).
    @Inject(SERVICE_NAMES.AUDITORIA) private readonly notifClient: ClientProxy,
  ) {}

  /**
   * HU-34: nuevo documento subido → notificar a supervisores/gerentes/admins,
   * excluyendo al autor de la subida.
   */
  async onDocumentoSubido(req: any, responseData: any): Promise<void> {
    const requerimientoId = Number(req.body?.requerimientoId) || undefined;
    if (!requerimientoId) return;

    const actorId = req.user?.id;
    const destinatarios = (await this.getSupervisores()).filter((id) => id !== actorId);
    if (!destinatarios.length) return;

    const nombreDoc =
      responseData?.nombreOriginal ||
      responseData?.nombre ||
      (Array.isArray(responseData?.items)
        ? `${responseData.items.length} documento(s)`
        : 'documento');

    const notifs: CrearNotificacionDto[] = destinatarios.map((usuarioDestinoId) => ({
      usuarioDestinoId,
      tipo: TipoNotificacion.DOCUMENT_UPLOADED,
      titulo: `Nuevo documento subido: ${nombreDoc}`,
      mensaje: `${req.user?.email || 'Un usuario'} subió "${nombreDoc}" al requerimiento #${requerimientoId}.`,
      entidad: 'requerimientos',
      entidadId: requerimientoId,
      requerimientoId,
      metadata: { autorId: actorId, autorEmail: req.user?.email },
    }));

    await this.emitir(notifs, `HU-34 subida doc (req #${requerimientoId})`);
  }

  /**
   * HU-35: cambio de estado de un requerimiento → notificar al creador y al
   * asignado, excluyendo al actor del cambio.
   */
  async onCambioEstado(req: any, responseData: any): Promise<void> {
    const requerimiento = responseData || {};
    const requerimientoId = requerimiento.id;
    if (!requerimientoId) return;

    const actorId = req.user?.id;
    const destinatarios = [requerimiento.usuarioCreadorId, requerimiento.asignadoAId].filter(
      (id): id is number => Number.isInteger(id) && id > 0 && id !== actorId,
    );
    const unicos = [...new Set(destinatarios)];
    if (!unicos.length) return;

    const estadoNuevo = requerimiento.estado || '(nuevo)';
    // `estadoAnterior` es un campo transitorio que poblará el Fix 2; por ahora
    // degrada con gracia a '(anterior)'.
    const estadoAnterior = requerimiento.estadoAnterior || '(anterior)';

    const notifs: CrearNotificacionDto[] = unicos.map((usuarioDestinoId) => ({
      usuarioDestinoId,
      tipo: TipoNotificacion.STATE_CHANGED,
      titulo: `Requerimiento #${requerimientoId}: ${estadoAnterior} → ${estadoNuevo}`,
      mensaje: `${req.user?.email || 'Un usuario'} cambió el estado del requerimiento #${requerimientoId} de "${estadoAnterior}" a "${estadoNuevo}".`,
      entidad: 'requerimientos',
      entidadId: requerimientoId,
      requerimientoId,
      metadata: {
        estadoAnterior,
        estadoNuevo,
        autorId: actorId,
        autorEmail: req.user?.email,
      },
    }));

    await this.emitir(notifs, `HU-35 cambio estado (req #${requerimientoId})`);
  }

  /**
   * Lista de IDs de usuarios con rol de supervisión, cacheada en memoria con
   * TTL corto para no consultar a ms-auth en cada subida.
   */
  private async getSupervisores(): Promise<number[]> {
    const now = Date.now();
    if (this.supervisoresCache && this.supervisoresCache.expires > now) {
      return this.supervisoresCache.ids;
    }
    try {
      const usuarios: any[] = await firstValueFrom(
        this.authClient
          .send(AUTH_PATTERNS.FIND_ALL_USERS, {})
          .pipe(timeout(DISPATCH_TIMEOUT_MS)),
      );
      const ids = (usuarios || [])
        .filter((u) => u?.activo !== false && ROLES_SUPERVISION.includes(u?.rol))
        .map((u) => u.id);
      this.supervisoresCache = { ids, expires: now + SUPERVISORES_TTL_MS };
      return ids;
    } catch (err: any) {
      this.logger.warn(`No se pudieron resolver supervisores: ${err?.message}`);
      // Reutiliza el último valor conocido si lo hay; si no, lista vacía.
      return this.supervisoresCache?.ids ?? [];
    }
  }

  private async emitir(notifs: CrearNotificacionDto[], ctx: string): Promise<void> {
    if (!notifs.length) return;
    try {
      await firstValueFrom(
        this.notifClient
          .send(NOTIFICACIONES_PATTERNS.CREAR, notifs)
          .pipe(timeout(DISPATCH_TIMEOUT_MS)),
      );
      this.logger.log(`📬 ${notifs.length} notificación(es) creada(s) — ${ctx}`);
    } catch (err: any) {
      this.logger.warn(`Error emitiendo notificaciones (${ctx}): ${err?.message}`);
    }
  }
}
