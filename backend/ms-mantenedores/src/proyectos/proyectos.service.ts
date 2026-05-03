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

        const prefix = area.nombre
            .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
            .replace(/[^a-zA-Z]/g, '')
            .substring(0, 3)
            .toUpperCase();

        const count = await this.proyectoRepository
            .createQueryBuilder('p')
            .withDeleted()
            .where('p.areaId = :areaId', { areaId: createDto.areaId })
            .getCount();

        const sequentialNum = String(count + 1).padStart(3, '0');
        const codigo = `${prefix}-${sequentialNum}`;

        const proyecto = this.proyectoRepository.create({
            ...createDto,
            codigo,
            creadoPor: 'admin',
            actualizadoPor: 'admin',
        });
        return this.proyectoRepository.save(proyecto);
    }

    async findAll(
        page: number = 1,
        limit: number = 10,
    ): Promise<{ data: Proyecto[]; total: number }> {
        const [data, total] = await this.proyectoRepository.findAndCount({
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
        proyecto.actualizadoPor = 'admin';
        await this.proyectoRepository.save(proyecto);
        return this.findOne(id);
    }

    async remove(id: number): Promise<void> {
        const proyecto = await this.findOne(id);
        await this.proyectoRepository.softRemove(proyecto);
    }

    async getStats(): Promise<{ total: number; activos: number; inactivos: number }> {
        const total = await this.proyectoRepository.count();
        const activos = await this.proyectoRepository.count({ where: { activo: true } });
        return {
            total,
            activos,
            inactivos: total - activos,
        };
    }
}
