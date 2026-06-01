import {
  Controller,
  Get,
  Param,
  Query,
  ParseIntPipe,
  Inject,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiQuery, ApiBearerAuth } from '@nestjs/swagger';
import { ClientProxy } from '@nestjs/microservices';
import { callService } from '../common/rpc.utils';
import { SERVICE_NAMES, AUDITORIA_PATTERNS, Role } from '../common/constants';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@ApiTags('auditoria')
@Controller('auditoria')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.AUDITOR, Role.ADMIN)
@ApiBearerAuth()
export class AuditoriaGatewayController {
  constructor(
    @Inject(SERVICE_NAMES.AUDITORIA) private readonly client: ClientProxy,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Ultimos registros de auditoria' })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  findRecientes(@Query('limit') limit?: string) {
    return callService(
      this.client.send(AUDITORIA_PATTERNS.FIND_RECIENTES, { limit: Number(limit) || 20 }),
    );
  }

  @Get('requerimiento/:id')
  @ApiOperation({ summary: 'Trazabilidad completa de un requerimiento' })
  findByRequerimiento(@Param('id', ParseIntPipe) id: number) {
    return callService(
      this.client.send(AUDITORIA_PATTERNS.FIND_BY_REQUERIMIENTO, { requerimientoId: id }),
    );
  }

  @Get(':entidad/:id')
  @ApiOperation({ summary: 'Historial de una entidad concreta' })
  findByEntidad(
    @Param('entidad') entidad: string,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return callService(
      this.client.send(AUDITORIA_PATTERNS.FIND_BY_ENTIDAD, { entidad, entidadId: id }),
    );
  }
}
