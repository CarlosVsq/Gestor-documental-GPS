import { Injectable, Logger } from '@nestjs/common';
import { RpcException } from '@nestjs/microservices';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Notificacion } from './notificacion.entity';
import { TipoNotificacion } from '../common/constants';

export interface CrearNotificacionDto {
  usuarioDestinoId: number;
  tipo: TipoNotificacion;
  titulo: string;
  mensaje?: string;
  entidad?: string;
  entidadId?: number;
  requerimientoId?: number;
  metadata?: Record<string, any>;
}

/**
 * NotificacionesService — HU-34/HU-35
 * 
 * Gestiona las notificaciones de los usuarios del sistema.
 * - HU-34: Crea notificación para supervisores cuando se sube un documento.
 * - HU-35: Crea notificación para asignados cuando cambia el estado de un requerimiento.
 * 
 * Las notificaciones se crean desde AuditoriaService después de registrar
 * un evento de auditoría, de forma fire-and-forget.
 */
@Injectable()
export class NotificacionesService {
  private readonly logger = new Logger(NotificacionesService.name);

  constructor(
    @InjectRepository(Notificacion)
    private readonly repo: Repository<Notificacion>,
  ) {}

  /**
   * Crea una o más notificaciones.
   * Acepta un solo DTO o un array para enviar a múltiples usuarios.
   */
  async crear(
    dto: CrearNotificacionDto | CrearNotificacionDto[],
  ): Promise<Notificacion[]> {
    const dtos = Array.isArray(dto) ? dto : [dto];
    const creadas: Notificacion[] = [];

    for (const d of dtos) {
      const notif = this.repo.create({
        usuarioDestinoId: d.usuarioDestinoId,
        tipo: d.tipo,
        titulo: d.titulo.slice(0, 200),
        mensaje: d.mensaje || null,
        entidad: d.entidad || null,
        entidadId: d.entidadId || null,
        requerimientoId: d.requerimientoId || null,
        metadata: d.metadata || null,
        leida: false,
      });

      const saved = await this.repo.save(notif);
      creadas.push(saved);
    }

    this.logger.log(
      `📬 ${creadas.length} notificación(es) creada(s): ${dtos[0]?.tipo} → usuario(s) ${dtos.map((d) => d.usuarioDestinoId).join(', ')}`,
    );

    return creadas;
  }

  /**
   * Lista notificaciones de un usuario, opcionalmente filtrando solo no leídas.
   */
  async findByUsuario(
    usuarioId: number,
    soloNoLeidas = false,
    limit = 50,
  ): Promise<Notificacion[]> {
    const where: any[] = [
      { usuarioDestinoId: usuarioId },
      { usuarioDestinoId: 0 }
    ];
    if (soloNoLeidas) {
      where[0].leida = false;
      where[1].leida = false;
    }

    return this.repo.find({
      where,
      order: { creadaEn: 'DESC' },
      take: Math.min(Math.max(limit, 1), 200),
    });
  }

  /**
   * Cuenta notificaciones no leídas de un usuario (badge counter).
   */
  async contarNoLeidas(usuarioId: number): Promise<{ count: number }> {
    const count = await this.repo.count({
      where: [
        { usuarioDestinoId: usuarioId, leida: false },
        { usuarioDestinoId: 0, leida: false }
      ],
    });
    return { count };
  }

  /**
   * Marca una notificación como leída.
   */
  async marcarLeida(notificacionId: number, usuarioId: number): Promise<Notificacion> {
    const notif = await this.repo.findOne({
      where: [
        { id: notificacionId, usuarioDestinoId: usuarioId },
        { id: notificacionId, usuarioDestinoId: 0 }
      ],
    });

    if (!notif) {
      throw new RpcException({
        statusCode: 404,
        message: `Notificación #${notificacionId} no encontrada`,
      });
    }

    notif.leida = true;
    notif.leidaEn = new Date();
    return this.repo.save(notif);
  }

  /**
   * Marca todas las notificaciones de un usuario como leídas.
   */
  async marcarTodasLeidas(usuarioId: number): Promise<{ affected: number }> {
    const result = await this.repo.update(
      { usuarioDestinoId: usuarioId, leida: false },
      { leida: true, leidaEn: new Date() },
    );
    return { affected: result.affected || 0 };
  }
}
