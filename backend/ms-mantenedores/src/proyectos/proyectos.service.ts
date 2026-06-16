import { Injectable } from '@nestjs/common';
import { RpcException } from '@nestjs/microservices';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Proyecto } from './proyecto.entity';
import { CreateProyectoDto } from './dto/create-proyecto.dto';
import { UpdateProyectoDto } from './dto/update-proyecto.dto';
import { AreasService } from '../areas/areas.service';

/**
 * Servicio de Proyectos - HU-03
 * Reglas de negocio:
 *   - Cada proyecto debe estar vinculado a un área existente.
 *   - Código de proyecto único (generado automáticamente).
 *   - fecha_fin debe ser posterior a fecha_inicio.
 *   - Se valida la cadena Proyecto → Área → Contratista (RF1.2).
 */
@Injectable()
export class ProyectosService {
    constructor(
        @InjectRepository(Proyecto)
        private readonly proyectoRepository: Repository<Proyecto>,

        private readonly areasService: AreasService,
    ) { }

    async create(createDto: CreateProyectoDto): Promise<Proyecto> {
        const area = await this.areasService.findOne(createDto.areaId);

        if (new Date(createDto.fechaFin) <= new Date(createDto.fechaInicio)) {
            throw new RpcException({ statusCode: 400, message: 'La fecha de fin debe ser posterior a la fecha de inicio' });
        }

        // Skip generic words like "Area"/"\u00c1rea" so sibling areas don't share the same prefix
        const meaningfulPart = area.nombre
            .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
            .replace(/[^a-zA-Z\s]/g, '')
            .split(/\s+/)
            .filter(w => w.toLowerCase() !== 'area' && w.length > 0)
            .join('');

        const prefix = (meaningfulPart.substring(0, 3) || area.nombre.substring(0, 3)).toUpperCase();

        // Count per prefix (not per area) to avoid collisions across areas with same prefix
        const count = await this.proyectoRepository
            .createQueryBuilder('p')
            .withDeleted()
            .where('p.codigo LIKE :pattern', { pattern: `${prefix}-%` })
            .getCount();

        const sequentialNum = String(count + 1).padStart(3, '0');
        const codigo = `${prefix}-${sequentialNum}`;

        const proyecto = this.proyectoRepository.create({
            ...createDto,
            codigo,
            creadoPor: createDto.creadoPor || 'sistema',
            actualizadoPor: createDto.creadoPor || 'sistema',
        });
        return this.proyectoRepository.save(proyecto);
    }

    async findAll(
        page: number = 1,
        limit: number = 10,
        contratistaId?: number,
    ): Promise<{ data: Proyecto[]; total: number }> {
        const whereCondition = contratistaId ? { area: { contratistaId } } : {};
        const [data, total] = await this.proyectoRepository.findAndCount({
            where: whereCondition,
            relations: ['area', 'area.contratista'],
            skip: (page - 1) * limit,
            take: limit,
            order: { creadoEn: 'DESC' },
        });
        return { data, total };
    }

    async findOne(id: number): Promise<Proyecto> {
        const proyecto = await this.proyectoRepository.findOne({
            where: { id },
            relations: ['area', 'area.contratista'],
        });
        if (!proyecto) {
            throw new RpcException({ statusCode: 404, message: `Proyecto con ID ${id} no encontrado` });
        }
        return proyecto;
    }

    async update(id: number, updateDto: UpdateProyectoDto): Promise<Proyecto> {
        const proyecto = await this.findOne(id);

        if (updateDto.areaId && updateDto.areaId !== proyecto.areaId) {
            await this.areasService.findOne(updateDto.areaId);
        }

        const fechaInicio = updateDto.fechaInicio ? new Date(updateDto.fechaInicio) : proyecto.fechaInicio;
        const fechaFin = updateDto.fechaFin ? new Date(updateDto.fechaFin) : proyecto.fechaFin;
        if (fechaFin <= fechaInicio) {
            throw new RpcException({ statusCode: 400, message: 'La fecha de fin debe ser posterior a la fecha de inicio' });
        }

        Object.assign(proyecto, updateDto);
        if (updateDto.areaId !== undefined) {
            proyecto.area = { id: updateDto.areaId } as any;
        }
        proyecto.actualizadoPor = updateDto.actualizadoPor || 'sistema';
        await this.proyectoRepository.save(proyecto);
        return this.findOne(id);
    }

    async toggle(id: number, actualizadoPor?: string): Promise<{ activo: boolean }> {
        const proyecto = await this.findOne(id);
        proyecto.activo = !proyecto.activo;
        proyecto.actualizadoPor = actualizadoPor || 'sistema';
        await this.proyectoRepository.save(proyecto);
        return { activo: proyecto.activo };
    }

    async getStats(contratistaId?: number): Promise<{ total: number; activos: number; inactivos: number }> {
        const whereBase = contratistaId ? { area: { contratistaId } } : {};
        const total = await this.proyectoRepository.count({ where: whereBase });
        const activos = await this.proyectoRepository.count({ where: { ...whereBase, activo: true } });
        return {
            total,
            activos,
            inactivos: total - activos,
        };
    }
}
