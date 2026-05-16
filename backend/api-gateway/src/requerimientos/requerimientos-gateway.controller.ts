import {
  Controller, Get, Post, Patch,
  Body, Param, Query, ParseIntPipe,
  Inject, UseGuards, Request,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery, ApiBearerAuth } from '@nestjs/swagger';
import { ClientProxy } from '@nestjs/microservices';
import { callService } from '../common/rpc.utils';
import { SERVICE_NAMES, REQUERIMIENTOS_PATTERNS, Role } from '../common/constants';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('requerimientos')
@Controller('requerimientos')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class RequerimientosGatewayController {
  constructor(
    @Inject(SERVICE_NAMES.REQUERIMIENTOS) private readonly client: ClientProxy,
  ) { }

  @Post()
  @ApiOperation({ summary: 'Crear un nuevo Requerimiento (Ticket)' })
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
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return callService(this.client.send(REQUERIMIENTOS_PATTERNS.FIND_ONE, id));
  }

  @Patch(':id/estado')
  @ApiOperation({ summary: 'Actualizar el estado del requerimiento' })
  async updateState(@Param('id', ParseIntPipe) id: number, @Body() updateDto: any) {
    return callService(this.client.send(REQUERIMIENTOS_PATTERNS.UPDATE_STATE, { id, updateDto }));
  }
}
