import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Area } from './entities/area.entity';
import { Proyecto } from '../proyectos/entities/proyecto.entity';
import { CreateAreaDto } from './dto/create-area.dto';
import { UpdateAreaDto } from './dto/update-area.dto';

@Injectable()
export class AreasService {
  constructor(
    @InjectRepository(Area)
    private readonly areaRepository: Repository<Area>,
    @InjectRepository(Proyecto)
    private readonly proyectoRepository: Repository<Proyecto>,
  ) {}

  async create(createAreaDto: CreateAreaDto) {
    const area = this.areaRepository.create(createAreaDto);
    return await this.areaRepository.save(area);
  }

  async findAll() {
    return await this.areaRepository.find({ relations: ['contratista'] });
  }

  async findOne(id: number) {
    const area = await this.areaRepository.findOne({ 
      where: { id },
      relations: ['contratista']
    });
    if (!area) {
      throw new NotFoundException(`Área con ID ${id} no encontrada`);
    }
    return area;
  }

  async update(id: number, updateAreaDto: UpdateAreaDto) {
    const area = await this.findOne(id);
    const updatedArea = Object.assign(area, updateAreaDto);
    return await this.areaRepository.save(updatedArea);
  }

  async remove(id: number) {
    const area = await this.findOne(id);
    
    // Validar regla de negocio: no se puede eliminar un área con proyectos
    const proyectosCount = await this.proyectoRepository.count({
      where: { area_id: id }
    });

    if (proyectosCount > 0) {
      throw new ConflictException('No se puede eliminar el área porque tiene proyectos asociados.');
    }

    // Usamos soft delete
    return await this.areaRepository.softRemove(area);
  }
}
