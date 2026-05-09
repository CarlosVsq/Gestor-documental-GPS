import {
  Controller, Get, Post, Put, Patch,
  Body, Param, Query, ParseIntPipe,
  Inject, HttpException, UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery, ApiBearerAuth } from '@nestjs/swagger';
import { ClientProxy } from '@nestjs/microservices';
import { firstValueFrom } from 'rxjs';
import { SERVICE_NAMES, SUBTIPOS_PATTERNS } from '../common/constants';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('subtipos')
@Controller('subtipos')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class SubtiposGatewayController {
  constructor(
    @Inject(SERVICE_NAMES.MANTENEDORES) private readonly client: ClientProxy,
  ) { }

  @Post()
  @ApiOperation({ summary: 'Crear un nuevo subtipo vinculado a categoría (HU-05)' })
  async create(@Body() createDto: any) {
    try {
      return await firstValueFrom(this.client.send(SUBTIPOS_PATTERNS.CREATE, createDto));
    } catch (error) {
      throw new HttpException(error.message, error.statusCode || 500);
    }
  }

  @Get()
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'categoriaId', required: false, type: Number })
  async findAll(@Query('page') page?: string, @Query('limit') limit?: string, @Query('categoriaId') categoriaId?: string) {
    const p = Number(page) || 1;
    const l = Number(limit) || 10;
    const catId = categoriaId ? Number(categoriaId) : undefined;
    try {
      return await firstValueFrom(this.client.send(SUBTIPOS_PATTERNS.FIND_ALL, { page: p, limit: l, categoriaId: catId }));
    } catch (error) {
      throw new HttpException(error.message, error.statusCode || 500);
    }
  }

  @Get(':id')
  async findOne(@Param('id', ParseIntPipe) id: number) {
    try {
      return await firstValueFrom(this.client.send(SUBTIPOS_PATTERNS.FIND_ONE, id));
    } catch (error) {
      throw new HttpException(error.message, error.statusCode || 500);
    }
  }

  @Put(':id')
  async update(@Param('id', ParseIntPipe) id: number, @Body() updateDto: any) {
    try {
      return await firstValueFrom(this.client.send(SUBTIPOS_PATTERNS.UPDATE, { id, updateDto }));
    } catch (error) {
      throw new HttpException(error.message, error.statusCode || 500);
    }
  }

  @Patch(':id/toggle')
  async toggle(@Param('id', ParseIntPipe) id: number) {
    try {
      return await firstValueFrom(this.client.send(SUBTIPOS_PATTERNS.TOGGLE, id));
    } catch (error) {
      throw new HttpException(error.message, error.statusCode || 500);
    }
  }
}
