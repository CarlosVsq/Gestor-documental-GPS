import {
  Controller, Get, Post, Put, Patch,
  Body, Param, Query, ParseIntPipe,
  Inject, HttpException, UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery, ApiParam, ApiBearerAuth } from '@nestjs/swagger';
import { ClientProxy } from '@nestjs/microservices';
import { firstValueFrom } from 'rxjs';
import { SERVICE_NAMES, CATEGORIAS_PATTERNS } from '../common/constants';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('categorias')
@Controller('categorias')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class CategoriasGatewayController {
  constructor(
    @Inject(SERVICE_NAMES.MANTENEDORES) private readonly client: ClientProxy,
  ) { }

  @Post()
  @ApiOperation({ summary: 'Crear una nueva categoría documental (HU-04)' })
  @ApiResponse({ status: 201, description: 'Categoría creada' })
  async create(@Body() createDto: any) {
    try {
      return await firstValueFrom(this.client.send(CATEGORIAS_PATTERNS.CREATE, createDto));
    } catch (error) {
      throw new HttpException(error.message, error.statusCode || 500);
    }
  }

  @Get()
  @ApiOperation({ summary: 'Listar categorías con paginación' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  async findAll(@Query('page') page?: string, @Query('limit') limit?: string) {
    const p = Number(page) || 1;
    const l = Number(limit) || 10;
    try {
      return await firstValueFrom(this.client.send(CATEGORIAS_PATTERNS.FIND_ALL, { page: p, limit: l }));
    } catch (error) {
      throw new HttpException(error.message, error.statusCode || 500);
    }
  }

  @Get(':id')
  async findOne(@Param('id', ParseIntPipe) id: number) {
    try {
      return await firstValueFrom(this.client.send(CATEGORIAS_PATTERNS.FIND_ONE, id));
    } catch (error) {
      throw new HttpException(error.message, error.statusCode || 500);
    }
  }

  @Put(':id')
  async update(@Param('id', ParseIntPipe) id: number, @Body() updateDto: any) {
    try {
      return await firstValueFrom(this.client.send(CATEGORIAS_PATTERNS.UPDATE, { id, updateDto }));
    } catch (error) {
      throw new HttpException(error.message, error.statusCode || 500);
    }
  }

  @Patch(':id/toggle')
  @ApiOperation({ summary: 'Activar/desactivar categoría (no puede si tiene subtipos)' })
  async toggle(@Param('id', ParseIntPipe) id: number) {
    try {
      return await firstValueFrom(this.client.send(CATEGORIAS_PATTERNS.TOGGLE, id));
    } catch (error) {
      throw new HttpException(error.message, error.statusCode || 500);
    }
  }
}
