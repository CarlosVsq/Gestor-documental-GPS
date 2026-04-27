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
import { ProyectosService } from './proyectos.service';
import { CreateProyectoDto } from './dto/create-proyecto.dto';
import { UpdateProyectoDto } from './dto/update-proyecto.dto';
import { Proyecto } from './proyecto.entity';

@ApiTags('proyectos')
@Controller('proyectos')
export class ProyectosController {
    constructor(private readonly proyectosService: ProyectosService) { }

    @Post()
    @ApiOperation({ summary: 'Crear un nuevo proyecto vinculado a un área (HU-03)' })
    @ApiResponse({ status: 201, description: 'Proyecto creado exitosamente', type: Proyecto })
    @ApiResponse({ status: 404, description: 'Área no encontrada' })
    @ApiResponse({ status: 409, description: 'Ya existe un proyecto con ese código' })
    @ApiResponse({ status: 400, description: 'Datos de entrada inválidos o fechas incorrectas' })
    create(@Body() createDto: CreateProyectoDto): Promise<Proyecto> {
        return this.proyectosService.create(createDto);
    }

    @Get()
    @ApiOperation({ summary: 'Listar todos los proyectos con paginación (HU-03)' })
    @ApiQuery({ name: 'page', required: false, type: Number, description: 'Número de página' })
    @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Registros por página' })
    @ApiResponse({ status: 200, description: 'Listado de proyectos con área y contratista' })
    findAll(
        @Query('page') page?: string,
        @Query('limit') limit?: string,
    ): Promise<{ data: Proyecto[]; total: number }> {
        const p = Number(page) || 1;
        const l = Number(limit) || 10;
        return this.proyectosService.findAll(p, l);
    }

    @Get('stats')
    @ApiOperation({ summary: 'Obtener estadísticas de proyectos' })
    @ApiResponse({ status: 200, description: 'Estadísticas de proyectos' })
    getStats() {
        return this.proyectosService.getStats();
    }

    @Get(':id')
    @ApiOperation({ summary: 'Obtener un proyecto por ID con su área y contratista' })
    @ApiParam({ name: 'id', type: Number, description: 'ID del proyecto' })
    @ApiResponse({ status: 200, description: 'Proyecto encontrado', type: Proyecto })
    @ApiResponse({ status: 404, description: 'Proyecto no encontrado' })
    findOne(@Param('id', ParseIntPipe) id: number): Promise<Proyecto> {
        return this.proyectosService.findOne(id);
    }

    @Put(':id')
    @ApiOperation({ summary: 'Actualizar un proyecto existente (HU-03)' })
    @ApiParam({ name: 'id', type: Number, description: 'ID del proyecto' })
    @ApiResponse({ status: 200, description: 'Proyecto actualizado', type: Proyecto })
    @ApiResponse({ status: 404, description: 'Proyecto o área no encontrado' })
    @ApiResponse({ status: 409, description: 'Ya existe un proyecto con ese código' })
    update(
        @Param('id', ParseIntPipe) id: number,
        @Body() updateDto: UpdateProyectoDto,
    ): Promise<Proyecto> {
        return this.proyectosService.update(id, updateDto);
    }

    @Delete(':id')
    @HttpCode(HttpStatus.NO_CONTENT)
    @ApiOperation({ summary: 'Eliminar un proyecto - soft delete (HU-03)' })
    @ApiParam({ name: 'id', type: Number, description: 'ID del proyecto' })
    @ApiResponse({ status: 204, description: 'Proyecto eliminado (soft delete)' })
    @ApiResponse({ status: 404, description: 'Proyecto no encontrado' })
    remove(@Param('id', ParseIntPipe) id: number): Promise<void> {
        return this.proyectosService.remove(id);
    }
}
