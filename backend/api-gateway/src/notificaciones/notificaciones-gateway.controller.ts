import {
  Controller,
  Get,
  Patch,
  Param,
  Query,
  ParseIntPipe,
  Inject,
  UseGuards,
  Request,
  Sse,
  MessageEvent,
  Header,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery, ApiBearerAuth } from '@nestjs/swagger';
import { ClientProxy } from '@nestjs/microservices';
import { callService } from '../common/rpc.utils';
import { SERVICE_NAMES, NOTIFICACIONES_PATTERNS } from '../common/constants';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Observable, timer } from 'rxjs';
import { switchMap, map } from 'rxjs/operators';

/**
 * Gateway Controller de Notificaciones — HU-34/HU-35
 * Proxy HTTP → TCP hacia ms-auditoria (módulo notificaciones).
 * 
 * Endpoints:
 * - GET  /api/notificaciones       → lista del usuario autenticado
 * - GET  /api/notificaciones/count  → badge counter
 * - PATCH /api/notificaciones/:id/leer  → marcar como leída
 * - PATCH /api/notificaciones/leer-todas → marcar todas como leídas
 * - SSE  /api/notificaciones/stream → flujo SSE de notificaciones y conteo
 */
@ApiTags('notificaciones')
@Controller('notificaciones')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class NotificacionesGatewayController {
  constructor(
    @Inject(SERVICE_NAMES.AUDITORIA) private readonly client: ClientProxy,
  ) {}

  @Sse('stream')
  // Fix 4: desactiva el buffering de nginx SOLO para este stream. nginx respeta
  // este header de respuesta y entrega los eventos SSE al instante, sin necesidad
  // de tocar la configuración del proxy ni abrir puertos nuevos.
  @Header('X-Accel-Buffering', 'no')
  @Header('Cache-Control', 'no-cache, no-transform')
  @ApiOperation({ summary: 'Flujo de eventos SSE para recibir notificaciones en tiempo real' })
  streamNotifications(@Request() req: any): Observable<MessageEvent> {
    // Emitimos inmediatamente al conectar y luego cada 15 segundos
    return timer(0, 15000).pipe(
      switchMap(() => 
        Promise.all([
          callService(
            this.client.send(NOTIFICACIONES_PATTERNS.FIND_BY_USUARIO, {
              usuarioId: req.user.id,
              soloNoLeidas: false,
              limit: 20,
            })
          ),
          callService(
            this.client.send(NOTIFICACIONES_PATTERNS.CONTAR_NO_LEIDAS, {
              usuarioId: req.user.id,
            })
          )
        ])
      ),
      map(([notificaciones, countData]) => {
        return {
          data: {
            notificaciones,
            count: countData.count ?? countData,
          }
        } as MessageEvent;
      })
    );
  }

  @Get()
  @ApiOperation({ summary: 'Listar notificaciones del usuario autenticado (HU-34/HU-35)' })
  @ApiQuery({ name: 'soloNoLeidas', required: false, type: Boolean })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiResponse({ status: 200, description: 'Lista de notificaciones' })
  findByUsuario(
    @Request() req: any,
    @Query('soloNoLeidas') soloNoLeidas?: string,
    @Query('limit') limit?: string,
  ) {
    return callService(
      this.client.send(NOTIFICACIONES_PATTERNS.FIND_BY_USUARIO, {
        usuarioId: req.user.id,
        soloNoLeidas: soloNoLeidas === 'true',
        limit: Number(limit) || 50,
      }),
    );
  }

  @Get('count')
  @ApiOperation({ summary: 'Contador de notificaciones no leídas (badge)' })
  @ApiResponse({ status: 200, description: '{ count: number }' })
  contarNoLeidas(@Request() req: any) {
    return callService(
      this.client.send(NOTIFICACIONES_PATTERNS.CONTAR_NO_LEIDAS, {
        usuarioId: req.user.id,
      }),
    );
  }

  @Patch(':id/leer')
  @ApiOperation({ summary: 'Marcar una notificación como leída' })
  @ApiResponse({ status: 200, description: 'Notificación marcada como leída' })
  @ApiResponse({ status: 404, description: 'Notificación no encontrada' })
  marcarLeida(
    @Param('id', ParseIntPipe) id: number,
    @Request() req: any,
  ) {
    return callService(
      this.client.send(NOTIFICACIONES_PATTERNS.MARCAR_LEIDA, {
        notificacionId: id,
        usuarioId: req.user.id,
      }),
    );
  }

  @Patch('leer-todas')
  @ApiOperation({ summary: 'Marcar todas las notificaciones como leídas' })
  @ApiResponse({ status: 200, description: '{ affected: number }' })
  marcarTodasLeidas(@Request() req: any) {
    return callService(
      this.client.send(NOTIFICACIONES_PATTERNS.MARCAR_TODAS_LEIDAS, {
        usuarioId: req.user.id,
      }),
    );
  }
}
