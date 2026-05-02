import {
  Controller, Get, Post, Put, Delete,
  Body, Param, Query, ParseIntPipe,
  HttpCode, HttpStatus, Inject, HttpException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery, ApiParam } from '@nestjs/swagger';
import { ClientProxy } from '@nestjs/microservices';
import { firstValueFrom } from 'rxjs';
import { SERVICE_NAMES, CONTRATISTAS_PATTERNS } from '../common/constants';

@ApiTags('contratistas')
@Controller('contratistas')
export class ContratistasGatewayController {
  constructor(
    @Inject(SERVICE_NAMES.MANTENEDORES) private readonly client: ClientProxy,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Crear un nuevo contratista (CA-1)' })
  @ApiResponse({ status: 201, description: 'Contratista creado exitosamente' })
  @ApiResponse({ status: 409, description: 'Ya existe un contratista con ese RUT' })
  async create(@Body() createDto: any) {
    try {
      return await firstValueFrom(this.client.send(CONTRATISTAS_PATTERNS.CREATE, createDto));
    } catch (error) {
      throw new HttpException(error.message, error.statusCode || 500);
    }
  }

  @Get()
  @ApiOperation({ summary: 'Listar todos los contratistas con paginación (CA-2)' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiResponse({ status: 200, description: 'Listado de contratistas' })
  async findAll(@Query('page') page?: string, @Query('limit') limit?: string) {
    const p = Number(page) || 1;
    const l = Number(limit) || 10;
    try {
      return await firstValueFrom(this.client.send(CONTRATISTAS_PATTERNS.FIND_ALL, { page: p, limit: l }));
    } catch (error) {
      throw new HttpException(error.message, error.statusCode || 500);
    }
  }

  @Get('stats')
  @ApiOperation({ summary: 'Obtener estadísticas de contratistas' })
  @ApiResponse({ status: 200, description: 'Estadísticas de contratistas' })
  async getStats() {
    try {
      return await firstValueFrom(this.client.send(CONTRATISTAS_PATTERNS.STATS, {}));
    } catch (error) {
      throw new HttpException(error.message, error.statusCode || 500);
    }
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener un contratista por ID' })
  @ApiParam({ name: 'id', type: Number })
  @ApiResponse({ status: 200, description: 'Contratista encontrado' })
  @ApiResponse({ status: 404, description: 'Contratista no encontrado' })
  async findOne(@Param('id', ParseIntPipe) id: number) {
    try {
      return await firstValueFrom(this.client.send(CONTRATISTAS_PATTERNS.FIND_ONE, { id }));
    } catch (error) {
      throw new HttpException(error.message, error.statusCode || 500);
    }
  }

  @Put(':id')
  @ApiOperation({ summary: 'Actualizar un contratista existente (CA-3)' })
  @ApiParam({ name: 'id', type: Number })
  @ApiResponse({ status: 200, description: 'Contratista actualizado' })
  @ApiResponse({ status: 404, description: 'Contratista no encontrado' })
  async update(@Param('id', ParseIntPipe) id: number, @Body() updateDto: any) {
    try {
      return await firstValueFrom(this.client.send(CONTRATISTAS_PATTERNS.UPDATE, { id, dto: updateDto }));
    } catch (error) {
      throw new HttpException(error.message, error.statusCode || 500);
    }
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Eliminar un contratista - soft delete (CA-4)' })
  @ApiParam({ name: 'id', type: Number })
  @ApiResponse({ status: 204, description: 'Contratista eliminado (soft delete)' })
  @ApiResponse({ status: 404, description: 'Contratista no encontrado' })
  async remove(@Param('id', ParseIntPipe) id: number) {
    try {
      await firstValueFrom(this.client.send(CONTRATISTAS_PATTERNS.REMOVE, { id }));
    } catch (error) {
      throw new HttpException(error.message, error.statusCode || 500);
    }
  }
}
