import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  ParseIntPipe,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiQuery,
  ApiParam,
} from '@nestjs/swagger';
import { ContratistasService } from './contratistas.service';
import { CreateContratistaDto } from './dto/create-contratista.dto';
import { UpdateContratistaDto } from './dto/update-contratista.dto';
import { Contratista } from './contratista.entity';

/**
 * Controller de Contratistas - HU-01
 * Expone los endpoints REST para el CRUD de contratistas.
 * Documentado con Swagger para la presentación.
 */
@ApiTags('contratistas')
@Controller('contratistas')
export class ContratistasController {
  constructor(private readonly contratistasService: ContratistasService) {}

  @Post()
  @ApiOperation({ summary: 'Crear un nuevo contratista (CA-1)' })
  @ApiResponse({ status: 201, description: 'Contratista creado exitosamente', type: Contratista })
  @ApiResponse({ status: 409, description: 'Ya existe un contratista con ese RUT' })
  @ApiResponse({ status: 400, description: 'Datos de entrada inválidos' })
  create(@Body() createDto: CreateContratistaDto): Promise<Contratista> {
    return this.contratistasService.create(createDto);
  }

  @Get()
  @ApiOperation({ summary: 'Listar todos los contratistas con paginación (CA-2)' })
  @ApiQuery({ name: 'page', required: false, type: Number, description: 'Número de página' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Registros por página' })
  @ApiResponse({ status: 200, description: 'Listado de contratistas' })
  findAll(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ): Promise<{ data: Contratista[]; total: number }> {
    const p = Number(page) || 1;
    const l = Number(limit) || 10;
    return this.contratistasService.findAll(p, l);
  }

  @Get('stats')
  @ApiOperation({ summary: 'Obtener estadísticas de contratistas' })
  @ApiResponse({ status: 200, description: 'Estadísticas de contratistas' })
  getStats() {
    return this.contratistasService.getStats();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener un contratista por ID' })
  @ApiParam({ name: 'id', type: Number, description: 'ID del contratista' })
  @ApiResponse({ status: 200, description: 'Contratista encontrado', type: Contratista })
  @ApiResponse({ status: 404, description: 'Contratista no encontrado' })
  findOne(@Param('id', ParseIntPipe) id: number): Promise<Contratista> {
    return this.contratistasService.findOne(id);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Actualizar un contratista existente (CA-3)' })
  @ApiParam({ name: 'id', type: Number, description: 'ID del contratista' })
  @ApiResponse({ status: 200, description: 'Contratista actualizado', type: Contratista })
  @ApiResponse({ status: 404, description: 'Contratista no encontrado' })
  @ApiResponse({ status: 409, description: 'Ya existe un contratista con ese RUT' })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateDto: UpdateContratistaDto,
  ): Promise<Contratista> {
    return this.contratistasService.update(id, updateDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Eliminar un contratista - soft delete (CA-4)' })
  @ApiParam({ name: 'id', type: Number, description: 'ID del contratista' })
  @ApiResponse({ status: 204, description: 'Contratista eliminado (soft delete)' })
  @ApiResponse({ status: 404, description: 'Contratista no encontrado' })
  remove(@Param('id', ParseIntPipe) id: number): Promise<void> {
    return this.contratistasService.remove(id);
  }
}
