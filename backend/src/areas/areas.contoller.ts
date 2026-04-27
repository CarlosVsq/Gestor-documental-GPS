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
import { AreasService } from './areas.service';
import { CreateAreaDto } from './dto/create-area.dto';
import { UpdateAreaDto } from './dto/update-area-dto';
import { Area } from './area.entity';


@ApiTags('areas')
@Controller('areas')
export class AreasController {
    constructor(private readonly areasService: AreasService) { }

    @Post()
    @ApiOperation({ summary: 'Crear una nueva área vinculada a un contratista (HU-02)' })
    @ApiResponse({ status: 201, description: 'Área creada exitosamente', type: Area })
    @ApiResponse({ status: 404, description: 'Contratista no encontrado' })
    @ApiResponse({ status: 409, description: 'Ya existe un área con ese nombre para el contratista' })
    @ApiResponse({ status: 400, description: 'Datos de entrada inválidos' })
    create(@Body() createDto: CreateAreaDto): Promise<Area> {
        return this.areasService.create(createDto);
    }

    @Get()
    @ApiOperation({ summary: 'Listar todas las áreas con paginación (HU-02)' })
    @ApiQuery({ name: 'page', required: false, type: Number, description: 'Número de página' })
    @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Registros por página' })
    @ApiResponse({ status: 200, description: 'Listado de áreas' })
    findAll(
        @Query('page') page?: string,
        @Query('limit') limit?: string,
    ): Promise<{ data: Area[]; total: number }> {
        const p = Number(page) || 1;
        const l = Number(limit) || 10;
        return this.areasService.findAll(p, l);
    }

    @Get('stats')
    @ApiOperation({ summary: 'Obtener estadísticas de áreas' })
    @ApiResponse({ status: 200, description: 'Estadísticas de áreas' })
    getStats() {
        return this.areasService.getStats();
    }

    @Get(':id')
    @ApiOperation({ summary: 'Obtener un área por ID' })
    @ApiParam({ name: 'id', type: Number, description: 'ID del área' })
    @ApiResponse({ status: 200, description: 'Área encontrada', type: Area })
    @ApiResponse({ status: 404, description: 'Área no encontrada' })
    findOne(@Param('id', ParseIntPipe) id: number): Promise<Area> {
        return this.areasService.findOne(id);
    }

    @Put(':id')
    @ApiOperation({ summary: 'Actualizar un área existente (HU-02)' })
    @ApiParam({ name: 'id', type: Number, description: 'ID del área' })
    @ApiResponse({ status: 200, description: 'Área actualizada', type: Area })
    @ApiResponse({ status: 404, description: 'Área o contratista no encontrado' })
    @ApiResponse({ status: 409, description: 'Ya existe un área con ese nombre para el contratista' })
    update(
        @Param('id', ParseIntPipe) id: number,
        @Body() updateDto: UpdateAreaDto,
    ): Promise<Area> {
        return this.areasService.update(id, updateDto);
    }

    @Delete(':id')
    @HttpCode(HttpStatus.NO_CONTENT)
    @ApiOperation({ summary: 'Eliminar un área - soft delete (HU-02). Bloqueado si tiene proyectos.' })
    @ApiParam({ name: 'id', type: Number, description: 'ID del área' })
    @ApiResponse({ status: 204, description: 'Área eliminada (soft delete)' })
    @ApiResponse({ status: 404, description: 'Área no encontrada' })
    @ApiResponse({ status: 409, description: 'No se puede eliminar: tiene proyectos asociados' })
    remove(@Param('id', ParseIntPipe) id: number): Promise<void> {
        return this.areasService.remove(id);
    }
}
