import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Auditoria } from './entities/auditoria.entity';
import { RegistrarAuditoriaDto } from './dto/registrar-auditoria.dto';
import { NotificacionesService, CrearNotificacionDto } from '../notificaciones/notificaciones.service';
import { AccionAuditoria, TipoNotificacion } from '../common/constants';

/**
 * AuditoriaService — HU-34/HU-35
 * 
 * Después de registrar un evento de auditoría, evalúa si debe
 * generar notificaciones para usuarios relevantes:
 * 
 * - HU-34: Subida de documento → notificar supervisores
 * - HU-35: Cambio de estado de requerimiento → notificar asignado/creador
 * 
 * Las notificaciones se crean de forma interna (sin RPC adicional)
 * ya que NotificacionesService vive en el mismo microservicio.
 */
@Injectable()
export class AuditoriaService {
  private readonly logger = new Logger(AuditoriaService.name);

  constructor(
    @InjectRepository(Auditoria)
    private readonly repo: Repository<Auditoria>,
    private readonly notificacionesService: NotificacionesService,
  ) {}

  async registrar(dto: RegistrarAuditoriaDto): Promise<Auditoria> {
    const guardado = await this.repo.save(this.repo.create(dto));
    this.logger.log(
      `AUDIT #${guardado.id} ${guardado.accion} ${guardado.entidad}` +
        `${guardado.entidadId ? `:${guardado.entidadId}` : ''} ` +
        `usuario ${guardado.usuarioId ?? 'anonimo'}`,
    );

    // Disparar notificaciones (fire-and-forget, sin bloquear respuesta)
    this.dispararNotificaciones(guardado).catch((err) =>
      this.logger.warn(`Error disparando notificaciones: ${err?.message}`),
    );

    return guardado;
  }

  findRecientes(limit = 20): Promise<Auditoria[]> {
    return this.repo.find({
      order: { timestamp: 'DESC' },
      take: Math.min(Math.max(limit, 1), 200),
    });
  }

  findByEntidad(entidad: string, entidadId: number): Promise<Auditoria[]> {
    return this.repo.find({
      where: { entidad, entidadId },
      order: { timestamp: 'DESC' },
    });
  }

  findByRequerimiento(requerimientoId: number): Promise<Auditoria[]> {
    return this.repo.find({
      where: { requerimientoId },
      order: { timestamp: 'ASC' },
    });
  }

  // ============================================================
  // NOTIFICACIONES — HU-34/HU-35
  // ============================================================

  /**
   * Evalúa el evento de auditoría y crea notificaciones cuando aplica.
   * Se ejecuta de forma asíncrona para no bloquear la respuesta del registro.
   */
  private async dispararNotificaciones(audit: Auditoria): Promise<void> {
    // HU-34: Subida de documento → notificar supervisores del requerimiento
    if (
      audit.accion === AccionAuditoria.CREATE &&
      audit.entidad === 'documentos' &&
      audit.requerimientoId
    ) {
      await this.notificarSubidaDocumento(audit);
      return;
    }

    // HU-35: Cambio de estado de requerimiento → notificar interesados
    if (
      audit.accion === AccionAuditoria.STATE_CHANGE &&
      audit.entidad === 'requerimientos' &&
      audit.entidadId
    ) {
      await this.notificarCambioEstado(audit);
      return;
    }
  }

  /**
   * HU-34: Notifica a supervisores cuando se sube un documento a un requerimiento.
   * 
   * Como no tenemos acceso directo a la lista de supervisores desde ms-auditoria
   * (no compartimos BD con ms-auth), creamos una notificación genérica con
   * usuarioDestinoId = 0 (broadcast para supervisores). El gateway o el frontend
   * filtran por rol al consultar.
   * 
   * Alternativa: si se conoce el usuario_id del supervisor asignado al
   * requerimiento, se envía directamente a él.
   */
  private async notificarSubidaDocumento(audit: Auditoria): Promise<void> {
    const nombreDoc = audit.datosDespues?.nombreOriginal ||
                      audit.datosDespues?.nombre ||
                      'documento';

    const notif: CrearNotificacionDto = {
      // Usamos el ID del requerimiento como destino genérico.
      // El gateway resolverá los supervisores al consultar.
      usuarioDestinoId: 0, // broadcast — se filtra por contexto
      tipo: TipoNotificacion.DOCUMENT_UPLOADED,
      titulo: `Nuevo documento subido: ${nombreDoc}`,
      mensaje: `El usuario ${audit.usuarioEmail || 'desconocido'} subió "${nombreDoc}" al requerimiento #${audit.requerimientoId}.`,
      entidad: 'documentos',
      entidadId: audit.entidadId,
      requerimientoId: audit.requerimientoId,
      metadata: {
        accion: audit.accion,
        usuarioId: audit.usuarioId,
        usuarioEmail: audit.usuarioEmail,
        ruta: audit.ruta,
      },
    };

    await this.notificacionesService.crear(notif);
    this.logger.log(`📬 HU-34: Notificación de subida de documento creada (req #${audit.requerimientoId})`);
  }

  /**
   * HU-35: Notifica cuando cambia el estado de un requerimiento.
   * 
   * Crea una notificación broadcast (usuarioDestinoId = 0) que incluye
   * quién cambió el estado, de qué estado a cuál.
   */
  private async notificarCambioEstado(audit: Auditoria): Promise<void> {
    const estadoAnterior = audit.datosAntes?.estado || '(anterior)';
    const estadoNuevo = audit.datosDespues?.estado || '(nuevo)';

    const notif: CrearNotificacionDto = {
      usuarioDestinoId: 0, // broadcast — se filtra por contexto
      tipo: TipoNotificacion.STATE_CHANGED,
      titulo: `Estado cambiado: ${estadoAnterior} → ${estadoNuevo}`,
      mensaje: `${audit.usuarioEmail || 'Un usuario'} cambió el estado del requerimiento #${audit.entidadId} de "${estadoAnterior}" a "${estadoNuevo}".`,
      entidad: 'requerimientos',
      entidadId: audit.entidadId,
      requerimientoId: audit.requerimientoId || audit.entidadId,
      metadata: {
        estadoAnterior,
        estadoNuevo,
        usuarioId: audit.usuarioId,
        usuarioEmail: audit.usuarioEmail,
      },
    };

    await this.notificacionesService.crear(notif);
    this.logger.log(
      `📬 HU-35: Notificación de cambio de estado creada (req #${audit.entidadId}: ${estadoAnterior} → ${estadoNuevo})`,
    );
  }
}
