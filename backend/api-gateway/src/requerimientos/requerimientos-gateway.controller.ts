import {
  Controller, Get, Post, Put, Patch,
  Body, Param, Query, ParseIntPipe,
  Inject, HttpException, UseGuards, Request,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery, ApiBearerAuth } from '@nestjs/swagger';
import { ClientProxy } from '@nestjs/microservices';
import { firstValueFrom } from 'rxjs';
import { SERVICE_NAMES, REQUERIMIENTOS_PATTERNS, Role } from '../common/constants';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('requerimientos')
@Controller('requerimientos')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class RequerimientosGatewayController {
  constructor(
    @Inject(SERVICE_NAMES.DOCUMENTOS) private readonly client: ClientProxy,
  ) { }

  @Post()
  @ApiOperation({ summary: 'Crear un nuevo Requerimiento (Ticket)' })
  async create(@Body() createDto: any, @Request() req: any) {
    try {
      // API Composition: Idealmente, aquí validaríamos con ms-mantenedores 
      // si proyectoId, areaId, contratistaId, categoriaId, subtipoId existen.
      // Lo dejamos simple por tiempo.
      return await firstValueFrom(this.client.send(REQUERIMIENTOS_PATTERNS.CREATE, createDto));
    } catch (error) {
      throw new HttpException(error.message, error.statusCode || 500);
    }
  }

  @Get()
  @ApiOperation({ summary: 'Listar Requerimientos' })
  async findAll(@Query('page') page?: string, @Query('limit') limit?: string, @Request() req?: any) {
    const p = Number(page) || 1;
    const l = Number(limit) || 10;
    
    // Filtro por contratista si el rol lo requiere (HU-25 / HU-N3)
    const filterContratistaId = req.user.rol === Role.CONTRATISTA ? req.user.contratistaId : undefined;
    
    try {
      return await firstValueFrom(this.client.send(REQUERIMIENTOS_PATTERNS.FIND_ALL, { page: p, limit: l, contratistaId: filterContratistaId }));
    } catch (error) {
      throw new HttpException(error.message, error.statusCode || 500);
    }
  }

  @Get(':id')
  async findOne(@Param('id', ParseIntPipe) id: number) {
    try {
      return await firstValueFrom(this.client.send(REQUERIMIENTOS_PATTERNS.FIND_ONE, id));
    } catch (error) {
      throw new HttpException(error.message, error.statusCode || 500);
    }
  }

  @Patch(':id/estado')
  @ApiOperation({ summary: 'Actualizar el estado del requerimiento' })
  async updateState(@Param('id', ParseIntPipe) id: number, @Body() updateDto: any) {
    try {
      return await firstValueFrom(this.client.send(REQUERIMIENTOS_PATTERNS.UPDATE_STATE, { id, updateDto }));
    } catch (error) {
      throw new HttpException(error.message, error.statusCode || 500);
    }
  }
}
