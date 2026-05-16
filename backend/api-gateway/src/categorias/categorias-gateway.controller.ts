import {
  Controller, Get, Post, Put, Patch,
  Body, Param, Query, ParseIntPipe,
  Inject, UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery, ApiParam, ApiBearerAuth } from '@nestjs/swagger';
import { ClientProxy } from '@nestjs/microservices';
import { callService } from '../common/rpc.utils';
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
    return callService(this.client.send(CATEGORIAS_PATTERNS.CREATE, createDto));
  }

  @Get()
  @ApiOperation({ summary: 'Listar categorías con paginación' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  async findAll(@Query('page') page?: string, @Query('limit') limit?: string) {
    return callService(this.client.send(CATEGORIAS_PATTERNS.FIND_ALL, { page: Number(page) || 1, limit: Number(limit) || 10 }));
  }

  @Get(':id')
  @ApiParam({ name: 'id', type: Number })
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return callService(this.client.send(CATEGORIAS_PATTERNS.FIND_ONE, id));
  }

  @Put(':id')
  @ApiParam({ name: 'id', type: Number })
  async update(@Param('id', ParseIntPipe) id: number, @Body() updateDto: any) {
    return callService(this.client.send(CATEGORIAS_PATTERNS.UPDATE, { id, updateDto }));
  }

  @Patch(':id/toggle')
  @ApiOperation({ summary: 'Activar/desactivar categoría (no puede si tiene subtipos)' })
  @ApiParam({ name: 'id', type: Number })
  async toggle(@Param('id', ParseIntPipe) id: number) {
    return callService(this.client.send(CATEGORIAS_PATTERNS.TOGGLE, id));
  }
}
