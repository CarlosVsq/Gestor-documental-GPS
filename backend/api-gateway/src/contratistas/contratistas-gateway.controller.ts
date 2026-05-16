import {
  Controller, Get, Post, Put, Patch,
  Body, Param, Query, ParseIntPipe,
  Inject, UseGuards, Request,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery, ApiParam, ApiBearerAuth } from '@nestjs/swagger';
import { ClientProxy } from '@nestjs/microservices';
import { callService } from '../common/rpc.utils';
import { SERVICE_NAMES, CONTRATISTAS_PATTERNS } from '../common/constants';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('contratistas')
@Controller('contratistas')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class ContratistasGatewayController {
  constructor(
    @Inject(SERVICE_NAMES.MANTENEDORES) private readonly client: ClientProxy,
  ) { }

  @Post()
  @ApiOperation({ summary: 'Crear un nuevo contratista (CA-1)' })
  @ApiResponse({ status: 201, description: 'Contratista creado exitosamente' })
  @ApiResponse({ status: 409, description: 'Ya existe un contratista con ese RUT' })
  async create(@Body() createDto: any, @Request() req: any) {
    return callService(this.client.send(CONTRATISTAS_PATTERNS.CREATE, { ...createDto, creadoPor: req.user.email }));
  }

  @Get()
  @ApiOperation({ summary: 'Listar todos los contratistas con paginación (CA-2)' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiResponse({ status: 200, description: 'Listado de contratistas' })
  async findAll(@Query('page') page?: string, @Query('limit') limit?: string) {
    return callService(this.client.send(CONTRATISTAS_PATTERNS.FIND_ALL, { page: Number(page) || 1, limit: Number(limit) || 10 }));
  }

  @Get('stats')
  @ApiOperation({ summary: 'Obtener estadísticas de contratistas' })
  @ApiResponse({ status: 200, description: 'Estadísticas de contratistas' })
  async getStats() {
    return callService(this.client.send(CONTRATISTAS_PATTERNS.STATS, {}));
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener un contratista por ID' })
  @ApiParam({ name: 'id', type: Number })
  @ApiResponse({ status: 200, description: 'Contratista encontrado' })
  @ApiResponse({ status: 404, description: 'Contratista no encontrado' })
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return callService(this.client.send(CONTRATISTAS_PATTERNS.FIND_ONE, { id }));
  }

  @Put(':id')
  @ApiOperation({ summary: 'Actualizar un contratista existente (CA-3)' })
  @ApiParam({ name: 'id', type: Number })
  @ApiResponse({ status: 200, description: 'Contratista actualizado' })
  @ApiResponse({ status: 404, description: 'Contratista no encontrado' })
  async update(@Param('id', ParseIntPipe) id: number, @Body() updateDto: any, @Request() req: any) {
    return callService(this.client.send(CONTRATISTAS_PATTERNS.UPDATE, { id, dto: { ...updateDto, actualizadoPor: req.user.email } }));
  }

  @Patch(':id/toggle')
  @ApiOperation({ summary: 'Activar/desactivar un contratista (CA-4)' })
  @ApiParam({ name: 'id', type: Number })
  @ApiResponse({ status: 200, description: 'Estado del contratista actualizado' })
  @ApiResponse({ status: 404, description: 'Contratista no encontrado' })
  async toggle(@Param('id', ParseIntPipe) id: number, @Request() req: any) {
    return callService(this.client.send(CONTRATISTAS_PATTERNS.TOGGLE, { id, actualizadoPor: req.user.email }));
  }
}
