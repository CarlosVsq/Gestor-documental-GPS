import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { NotificacionesService, CrearNotificacionDto } from './notificaciones.service';
import { NOTIFICACIONES_PATTERNS } from '../common/constants';

/**
 * Controller de Notificaciones — Microservicio TCP
 * HU-34/HU-35
 * 
 * Expone los patterns TCP para que el API Gateway consuma
 * las notificaciones del usuario autenticado.
 */
@Controller()
export class NotificacionesController {
  constructor(private readonly notificacionesService: NotificacionesService) {}

  @MessagePattern(NOTIFICACIONES_PATTERNS.CREAR)
  async crear(@Payload() dto: CrearNotificacionDto | CrearNotificacionDto[]) {
    return this.notificacionesService.crear(dto);
  }

  @MessagePattern(NOTIFICACIONES_PATTERNS.FIND_BY_USUARIO)
  async findByUsuario(
    @Payload() data: { usuarioId: number; soloNoLeidas?: boolean; limit?: number },
  ) {
    return this.notificacionesService.findByUsuario(
      data.usuarioId,
      data.soloNoLeidas || false,
      data.limit || 50,
    );
  }

  @MessagePattern(NOTIFICACIONES_PATTERNS.CONTAR_NO_LEIDAS)
  async contarNoLeidas(@Payload() data: { usuarioId: number }) {
    return this.notificacionesService.contarNoLeidas(data.usuarioId);
  }

  @MessagePattern(NOTIFICACIONES_PATTERNS.MARCAR_LEIDA)
  async marcarLeida(@Payload() data: { notificacionId: number; usuarioId: number }) {
    return this.notificacionesService.marcarLeida(data.notificacionId, data.usuarioId);
  }

  @MessagePattern(NOTIFICACIONES_PATTERNS.MARCAR_TODAS_LEIDAS)
  async marcarTodasLeidas(@Payload() data: { usuarioId: number }) {
    return this.notificacionesService.marcarTodasLeidas(data.usuarioId);
  }
}
