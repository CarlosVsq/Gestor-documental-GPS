import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { AreasService } from './areas.service';
import { CreateAreaDto } from './dto/create-area.dto';
import { UpdateAreaDto } from './dto/update-area.dto';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';

@ApiTags('areas')
@Controller('areas')
export class AreasController {
  constructor(private readonly areasService: AreasService) {}

  @Post()
  @ApiOperation({ summary: 'Crear una nueva Área' })
  @ApiResponse({ status: 201, description: 'Área creada exitosamente.' })
  create(@Body() createAreaDto: CreateAreaDto) {
    return this.areasService.create(createAreaDto);
  }

  @Get()
  @ApiOperation({ summary: 'Listar todas las áreas' })
  findAll() {
    return this.areasService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener un área por ID' })
  findOne(@Param('id') id: string) {
    return this.areasService.findOne(+id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Actualizar un área' })
  update(@Param('id') id: string, @Body() updateAreaDto: UpdateAreaDto) {
    return this.areasService.update(+id, updateAreaDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Eliminar un área (Soft Delete)' })
  @ApiResponse({ status: 200, description: 'Área eliminada exitosamente.' })
  @ApiResponse({ status: 409, description: 'Conflicto: El área tiene proyectos asociados.' })
  remove(@Param('id') id: string) {
    return this.areasService.remove(+id);
  }
}
