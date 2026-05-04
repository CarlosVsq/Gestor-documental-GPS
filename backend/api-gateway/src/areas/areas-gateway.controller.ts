import {
  Controller, Get, Post, Put, Delete,
  Body, Param, Query, ParseIntPipe,
  HttpCode, HttpStatus, Inject, HttpException,
  UseGuards, Request,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery, ApiParam, ApiBearerAuth } from '@nestjs/swagger';
import { ClientProxy } from '@nestjs/microservices';
import { firstValueFrom } from 'rxjs';
import { SERVICE_NAMES, AREAS_PATTERNS, Role } from '../common/constants';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('areas')
@Controller('areas')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class AreasGatewayController {
  constructor(
    @Inject(SERVICE_NAMES.MANTENEDORES) private readonly client: ClientProxy,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Crear una nueva área vinculada a un contratista (HU-02)' })
  @ApiResponse({ status: 201, description: 'Área creada exitosamente' })
  @ApiResponse({ status: 404, description: 'Contratista no encontrado' })
  @ApiResponse({ status: 409, description: 'Ya existe un área con ese nombre para el contratista' })
  async create(@Body() createDto: any) {
    try {
      return await firstValueFrom(this.client.send(AREAS_PATTERNS.CREATE, createDto));
    } catch (error) {
      throw new HttpException(error.message, error.statusCode || 500);
    }
  }

  @Get()
  @ApiOperation({ summary: 'Listar todas las áreas con paginación (HU-02)' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiResponse({ status: 200, description: 'Listado de áreas' })
  async findAll(@Query('page') page?: string, @Query('limit') limit?: string, @Request() req?: any) {
    const p = Number(page) || 1;
    const l = Number(limit) || 10;
    
    // Si es contratista, inyectar el contratistaId como filtro
    const filterContratistaId = req.user.rol === Role.CONTRATISTA ? req.user.contratistaId : undefined;
    
    try {
      return await firstValueFrom(this.client.send(AREAS_PATTERNS.FIND_ALL, { page: p, limit: l, contratistaId: filterContratistaId }));
    } catch (error) {
      throw new HttpException(error.message, error.statusCode || 500);
    }
  }

  @Get('stats')
  @ApiOperation({ summary: 'Obtener estadísticas de áreas' })
  @ApiResponse({ status: 200, description: 'Estadísticas de áreas' })
  async getStats(@Request() req: any) {
    const filterContratistaId = req.user.rol === Role.CONTRATISTA ? req.user.contratistaId : undefined;
    try {
      return await firstValueFrom(this.client.send(AREAS_PATTERNS.STATS, { contratistaId: filterContratistaId }));
    } catch (error) {
      throw new HttpException(error.message, error.statusCode || 500);
    }
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener un área por ID' })
  @ApiParam({ name: 'id', type: Number })
  @ApiResponse({ status: 200, description: 'Área encontrada' })
  @ApiResponse({ status: 404, description: 'Área no encontrada' })
  async findOne(@Param('id', ParseIntPipe) id: number) {
    try {
      return await firstValueFrom(this.client.send(AREAS_PATTERNS.FIND_ONE, { id }));
    } catch (error) {
      throw new HttpException(error.message, error.statusCode || 500);
    }
  }

  @Put(':id')
  @ApiOperation({ summary: 'Actualizar un área existente (HU-02)' })
  @ApiParam({ name: 'id', type: Number })
  @ApiResponse({ status: 200, description: 'Área actualizada' })
  @ApiResponse({ status: 404, description: 'Área o contratista no encontrado' })
  async update(@Param('id', ParseIntPipe) id: number, @Body() updateDto: any) {
    try {
      return await firstValueFrom(this.client.send(AREAS_PATTERNS.UPDATE, { id, dto: updateDto }));
    } catch (error) {
      throw new HttpException(error.message, error.statusCode || 500);
    }
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Eliminar un área - soft delete (HU-02)' })
  @ApiParam({ name: 'id', type: Number })
  @ApiResponse({ status: 204, description: 'Área eliminada (soft delete)' })
  @ApiResponse({ status: 409, description: 'No se puede eliminar: tiene proyectos asociados' })
  async remove(@Param('id', ParseIntPipe) id: number) {
    try {
      await firstValueFrom(this.client.send(AREAS_PATTERNS.REMOVE, { id }));
    } catch (error) {
      throw new HttpException(error.message, error.statusCode || 500);
    }
  }
}
