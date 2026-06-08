import {
  Controller,
  Get,
  Patch,
  Body,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { Permissions } from '../auth/decorators/permissions.decorator';
import { Permission } from '../common/constants';

/**
 * Configuración de sesión — HU-27
 * 
 * Provee al frontend los tiempos de inactividad configurables.
 * El frontend es responsable de:
 * - Detectar inactividad (mouse, teclado, scroll)
 * - Mostrar modal de aviso al llegar a warning_ms
 * - Redirigir a login al llegar a logout_ms
 */

// Estado en memoria (en producción: Redis o BD)
let sessionConfig = {
  /** Milisegundos antes de mostrar aviso de inactividad (15 min por defecto) */
  timeout_warning_ms: 15 * 60 * 1000,
  /** Milisegundos antes de cerrar sesión automáticamente (20 min por defecto) */
  timeout_logout_ms: 20 * 60 * 1000,
  /** Mensaje que se muestra en el aviso */
  warning_message: 'Tu sesión está a punto de expirar por inactividad. ¿Deseas continuar?',
};

@ApiTags('config')
@Controller('config')
export class ConfigGatewayController {

  @Get('session')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Obtener configuración de sesión por inactividad (HU-27)' })
  @ApiResponse({ status: 200, description: 'Configuración de sesión' })
  getSessionConfig() {
    return sessionConfig;
  }

  @Patch('session')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions(Permission.CONFIGURE_SYSTEM)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Actualizar configuración de sesión (solo admin)' })
  @ApiResponse({ status: 200, description: 'Configuración actualizada' })
  @ApiResponse({ status: 403, description: 'Sin permisos' })
  updateSessionConfig(
    @Body() body: {
      timeout_warning_ms?: number;
      timeout_logout_ms?: number;
      warning_message?: string;
    },
  ) {
    if (body.timeout_warning_ms !== undefined) {
      // Mínimo 5 minutos, máximo 60 minutos
      sessionConfig.timeout_warning_ms = Math.max(
        5 * 60 * 1000,
        Math.min(body.timeout_warning_ms, 60 * 60 * 1000),
      );
    }

    if (body.timeout_logout_ms !== undefined) {
      // Mínimo 10 minutos, máximo 120 minutos
      sessionConfig.timeout_logout_ms = Math.max(
        10 * 60 * 1000,
        Math.min(body.timeout_logout_ms, 120 * 60 * 1000),
      );
    }

    // Garantizar que logout > warning
    if (sessionConfig.timeout_logout_ms <= sessionConfig.timeout_warning_ms) {
      sessionConfig.timeout_logout_ms = sessionConfig.timeout_warning_ms + 5 * 60 * 1000;
    }

    if (body.warning_message) {
      sessionConfig.warning_message = body.warning_message.slice(0, 500);
    }

    return sessionConfig;
  }
}
