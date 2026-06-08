import {
  Controller, Get, Post, Patch,
  Body, Param, Query, ParseIntPipe,
  Inject, UseGuards, Request,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery, ApiBearerAuth } from '@nestjs/swagger';
import { ClientProxy } from '@nestjs/microservices';
import { callService } from '../common/rpc.utils';
import { SERVICE_NAMES, REQUERIMIENTOS_PATTERNS, Role, Permission } from '../common/constants';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { Permissions } from '../auth/decorators/permissions.decorator';

/**
 * Gateway Controller de Requerimientos — HU-17/HU-10
 * Proxy HTTP → TCP hacia ms-requerimientos.
 * 
 * HU-17: Endpoints protegidos con @Permissions() granulares.
 * - Crear: requiere CREATE_REQUERIMIENTO
 * - Listar: autenticado (filtro por contratistaId para contratistas)
 * - Cambiar estado: requiere CHANGE_REQUERIMIENTO_STATE
 */
@ApiTags('requerimientos')
@Controller('requerimientos')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@ApiBearerAuth()
export class RequerimientosGatewayController {
  constructor(
    @Inject(SERVICE_NAMES.REQUERIMIENTOS) private readonly client: ClientProxy,
  ) { }

  @Post()
  @Permissions(Permission.CREATE_REQUERIMIENTO)
  @ApiOperation({ summary: 'Crear un nuevo Requerimiento (Ticket)' })
  @ApiResponse({ status: 201, description: 'Requerimiento creado' })
  @ApiResponse({ status: 403, description: 'Sin permisos para crear requerimientos' })
  async create(@Body() createDto: any, @Request() req: any) {
    return callService(this.client.send(REQUERIMIENTOS_PATTERNS.CREATE, {
      ...createDto,
      usuarioCreadorId: req.user.id,
    }));
  }

  @Get()
  @ApiOperation({ summary: 'Listar Requerimientos' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'estado', required: false })
  @ApiQuery({ name: 'prioridad', required: false })
  @ApiQuery({ name: 'proyectoId', required: false, type: Number })
  @ApiQuery({ name: 'areaId', required: false, type: Number })
  async findAll(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('estado') estado?: string,
    @Query('prioridad') prioridad?: string,
    @Query('proyectoId') proyectoId?: string,
    @Query('areaId') areaId?: string,
    @Request() req?: any,
  ) {
    // HU-17: Contratistas solo ven sus propios requerimientos
    const filterContratistaId = req.user.rol === Role.CONTRATISTA ? req.user.contratistaId : undefined;
    return callService(this.client.send(REQUERIMIENTOS_PATTERNS.FIND_ALL, {
      page: Number(page) || 1,
      limit: Number(limit) || 10,
      filtros: {
        contratistaId: filterContratistaId,
        estado,
        prioridad,
        proyectoId: proyectoId ? Number(proyectoId) : undefined,
        areaId: areaId ? Number(areaId) : undefined,
      },
    }));
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener un requerimiento por ID' })
  @ApiResponse({ status: 200, description: 'Requerimiento encontrado' })
  @ApiResponse({ status: 404, description: 'Requerimiento no encontrado' })
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return callService(this.client.send(REQUERIMIENTOS_PATTERNS.FIND_ONE, id));
  }

  @Patch(':id/estado')
  @Permissions(Permission.CHANGE_REQUERIMIENTO_STATE)
  @ApiOperation({ summary: 'Actualizar el estado del requerimiento' })
  @ApiResponse({ status: 200, description: 'Estado actualizado' })
  @ApiResponse({ status: 403, description: 'Sin permisos para cambiar estado' })
  @ApiResponse({ status: 409, description: 'Transición de estado no permitida' })
  async updateState(@Param('id', ParseIntPipe) id: number, @Body() updateDto: any) {
    return callService(this.client.send(REQUERIMIENTOS_PATTERNS.UPDATE_STATE, { id, updateDto }));
  }
}
