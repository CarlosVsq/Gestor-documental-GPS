import {
  Controller, Get, Post, Put, Delete,
  Body, Param, Query, ParseIntPipe,
  HttpCode, HttpStatus, Inject, HttpException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery, ApiParam } from '@nestjs/swagger';
import { ClientProxy } from '@nestjs/microservices';
import { firstValueFrom } from 'rxjs';
import { SERVICE_NAMES, PROYECTOS_PATTERNS } from '../common/constants';

@ApiTags('proyectos')
@Controller('proyectos')
export class ProyectosGatewayController {
  constructor(
    @Inject(SERVICE_NAMES.MANTENEDORES) private readonly client: ClientProxy,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Crear un nuevo proyecto vinculado a un área (HU-03)' })
  @ApiResponse({ status: 201, description: 'Proyecto creado exitosamente' })
  @ApiResponse({ status: 404, description: 'Área no encontrada' })
  async create(@Body() createDto: any) {
    try {
      return await firstValueFrom(this.client.send(PROYECTOS_PATTERNS.CREATE, createDto));
    } catch (error) {
      throw new HttpException(error.message, error.statusCode || 500);
    }
  }

  @Get()
  @ApiOperation({ summary: 'Listar todos los proyectos con paginación (HU-03)' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiResponse({ status: 200, description: 'Listado de proyectos con área y contratista' })
  async findAll(@Query('page') page?: string, @Query('limit') limit?: string) {
    const p = Number(page) || 1;
    const l = Number(limit) || 10;
    try {
      return await firstValueFrom(this.client.send(PROYECTOS_PATTERNS.FIND_ALL, { page: p, limit: l }));
    } catch (error) {
      throw new HttpException(error.message, error.statusCode || 500);
    }
  }

  @Get('stats')
  @ApiOperation({ summary: 'Obtener estadísticas de proyectos' })
  @ApiResponse({ status: 200, description: 'Estadísticas de proyectos' })
  async getStats() {
    try {
      return await firstValueFrom(this.client.send(PROYECTOS_PATTERNS.STATS, {}));
    } catch (error) {
      throw new HttpException(error.message, error.statusCode || 500);
    }
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener un proyecto por ID con su área y contratista' })
  @ApiParam({ name: 'id', type: Number })
  @ApiResponse({ status: 200, description: 'Proyecto encontrado' })
  @ApiResponse({ status: 404, description: 'Proyecto no encontrado' })
  async findOne(@Param('id', ParseIntPipe) id: number) {
    try {
      return await firstValueFrom(this.client.send(PROYECTOS_PATTERNS.FIND_ONE, { id }));
    } catch (error) {
      throw new HttpException(error.message, error.statusCode || 500);
    }
  }

  @Put(':id')
  @ApiOperation({ summary: 'Actualizar un proyecto existente (HU-03)' })
  @ApiParam({ name: 'id', type: Number })
  @ApiResponse({ status: 200, description: 'Proyecto actualizado' })
  @ApiResponse({ status: 404, description: 'Proyecto o área no encontrado' })
  async update(@Param('id', ParseIntPipe) id: number, @Body() updateDto: any) {
    try {
      return await firstValueFrom(this.client.send(PROYECTOS_PATTERNS.UPDATE, { id, dto: updateDto }));
    } catch (error) {
      throw new HttpException(error.message, error.statusCode || 500);
    }
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Eliminar un proyecto - soft delete (HU-03)' })
  @ApiParam({ name: 'id', type: Number })
  @ApiResponse({ status: 204, description: 'Proyecto eliminado (soft delete)' })
  async remove(@Param('id', ParseIntPipe) id: number) {
    try {
      await firstValueFrom(this.client.send(PROYECTOS_PATTERNS.REMOVE, { id }));
    } catch (error) {
      throw new HttpException(error.message, error.statusCode || 500);
    }
  }
}
