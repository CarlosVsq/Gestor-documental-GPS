import {
  Controller, Get, Post, Put, Patch,
  Body, Param, Query, ParseIntPipe,
  Inject, UseGuards, Request,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery, ApiParam, ApiBearerAuth } from '@nestjs/swagger';
import { ClientProxy } from '@nestjs/microservices';
import { callService } from '../common/rpc.utils';
import { SERVICE_NAMES, AREAS_PATTERNS, Role } from '../common/constants';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('areas')
@Controller('areas')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class AreasGatewayController {
  constructor(
    @Inject(SERVICE_NAMES.MANTENEDORES) private readonly client: ClientProxy,
  ) { }

  @Post()
  @ApiOperation({ summary: 'Crear una nueva área vinculada a un contratista (HU-02)' })
  @ApiResponse({ status: 201, description: 'Área creada exitosamente' })
  @ApiResponse({ status: 404, description: 'Contratista no encontrado' })
  @ApiResponse({ status: 409, description: 'Ya existe un área con ese nombre para el contratista' })
  async create(@Body() createDto: any, @Request() req: any) {
    return callService(this.client.send(AREAS_PATTERNS.CREATE, { ...createDto, creadoPor: req.user.email }));
  }

  @Get()
  @ApiOperation({ summary: 'Listar todas las áreas con paginación (HU-02)' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiResponse({ status: 200, description: 'Listado de áreas' })
  async findAll(@Query('page') page?: string, @Query('limit') limit?: string, @Request() req?: any) {
    const filterContratistaId = req.user.rol === Role.CONTRATISTA ? req.user.contratistaId : undefined;
    return callService(this.client.send(AREAS_PATTERNS.FIND_ALL, {
      page: Number(page) || 1,
      limit: Number(limit) || 10,
      contratistaId: filterContratistaId,
    }));
  }

  @Get('stats')
  @ApiOperation({ summary: 'Obtener estadísticas de áreas' })
  @ApiResponse({ status: 200, description: 'Estadísticas de áreas' })
  async getStats(@Request() req: any) {
    const filterContratistaId = req.user.rol === Role.CONTRATISTA ? req.user.contratistaId : undefined;
    return callService(this.client.send(AREAS_PATTERNS.STATS, { contratistaId: filterContratistaId }));
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener un área por ID' })
  @ApiParam({ name: 'id', type: Number })
  @ApiResponse({ status: 200, description: 'Área encontrada' })
  @ApiResponse({ status: 404, description: 'Área no encontrada' })
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return callService(this.client.send(AREAS_PATTERNS.FIND_ONE, { id }));
  }

  @Put(':id')
  @ApiOperation({ summary: 'Actualizar un área existente (HU-02)' })
  @ApiParam({ name: 'id', type: Number })
  @ApiResponse({ status: 200, description: 'Área actualizada' })
  @ApiResponse({ status: 404, description: 'Área o contratista no encontrado' })
  async update(@Param('id', ParseIntPipe) id: number, @Body() updateDto: any, @Request() req: any) {
    return callService(this.client.send(AREAS_PATTERNS.UPDATE, { id, dto: { ...updateDto, actualizadoPor: req.user.email } }));
  }

  @Patch(':id/toggle')
  @ApiOperation({ summary: 'Activar/desactivar un área (HU-02)' })
  @ApiParam({ name: 'id', type: Number })
  @ApiResponse({ status: 200, description: 'Estado del área actualizado' })
  @ApiResponse({ status: 409, description: 'No se puede desactivar: tiene proyectos asociados' })
  async toggle(@Param('id', ParseIntPipe) id: number, @Request() req: any) {
    return callService(this.client.send(AREAS_PATTERNS.TOGGLE, { id, actualizadoPor: req.user.email }));
  }
}
