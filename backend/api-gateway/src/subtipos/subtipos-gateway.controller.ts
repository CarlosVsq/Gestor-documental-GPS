import {
  Controller, Get, Post, Put, Patch,
  Body, Param, Query, ParseIntPipe,
  Inject, UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiQuery, ApiBearerAuth } from '@nestjs/swagger';
import { ClientProxy } from '@nestjs/microservices';
import { callService } from '../common/rpc.utils';
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
    return callService(this.client.send(SUBTIPOS_PATTERNS.CREATE, createDto));
  }

  @Get()
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'categoriaId', required: false, type: Number })
  async findAll(@Query('page') page?: string, @Query('limit') limit?: string, @Query('categoriaId') categoriaId?: string) {
    return callService(this.client.send(SUBTIPOS_PATTERNS.FIND_ALL, {
      page: Number(page) || 1,
      limit: Number(limit) || 10,
      categoriaId: categoriaId ? Number(categoriaId) : undefined,
    }));
  }

  @Get(':id')
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return callService(this.client.send(SUBTIPOS_PATTERNS.FIND_ONE, id));
  }

  @Put(':id')
  async update(@Param('id', ParseIntPipe) id: number, @Body() updateDto: any) {
    return callService(this.client.send(SUBTIPOS_PATTERNS.UPDATE, { id, updateDto }));
  }

  @Patch(':id/toggle')
  async toggle(@Param('id', ParseIntPipe) id: number) {
    return callService(this.client.send(SUBTIPOS_PATTERNS.TOGGLE, id));
  }
}
