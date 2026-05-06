import { Injectable } from '@nestjs/common';
import { RpcException } from '@nestjs/microservices';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Area } from './area.entity';
import { Proyecto } from '../proyectos/proyecto.entity';
import { CreateAreaDto } from './dto/create-area.dto';
import { UpdateAreaDto } from './dto/update-area.dto';
import { ContratistasService } from '../contratistas/contratistas.service';

/**
 * Servicio de Áreas - HU-02
 * Reglas de negocio:
 *   - Cada área debe estar vinculada a un contratista existente.
 *   - No se puede eliminar un área con proyectos asociados.
 *   - Nombre único dentro del mismo contratista.
 */
@Injectable()
export class AreasService {
    constructor(
        @InjectRepository(Area)
        private readonly areaRepository: Repository<Area>,

        @InjectRepository(Proyecto)
        private readonly proyectoRepository: Repository<Proyecto>,

        private readonly contratistasService: ContratistasService,
    ) { }

    async create(createDto: CreateAreaDto): Promise<Area> {
        await this.contratistasService.findOne(createDto.contratistaId);

        const duplicada = await this.areaRepository.findOne({
            where: {
                nombre: createDto.nombre,
                contratistaId: createDto.contratistaId,
            },
        });
        if (duplicada) {
            throw new RpcException({
                statusCode: 409,
                message: `Ya existe un área "${createDto.nombre}" para este contratista`,
            });
        }

        const area = this.areaRepository.create({
            ...createDto,
            creadoPor: 'admin',
            actualizadoPor: 'admin',
        });
        return this.areaRepository.save(area);
    }

    async findAll(
        page: number = 1,
        limit: number = 10,
        contratistaId?: number,
    ): Promise<{ data: Area[]; total: number }> {
        const whereCondition = contratistaId ? { contratistaId } : {};
        const [data, total] = await this.areaRepository.findAndCount({
            where: whereCondition,
            relations: ['contratista'],
            skip: (page - 1) * limit,
            take: limit,
            order: { creadoEn: 'DESC' },
        });
        return { data, total };
    }

    async findOne(id: number): Promise<Area> {
        const area = await this.areaRepository.findOne({
            where: { id },
            relations: ['contratista'],
        });
        if (!area) {
            throw new RpcException({ statusCode: 404, message: `Área con ID ${id} no encontrada` });
        }
        return area;
    }

    async update(id: number, updateDto: UpdateAreaDto): Promise<Area> {
        const area = await this.findOne(id);

        const targetContratistaId = updateDto.contratistaId ?? area.contratistaId;
        if (updateDto.contratistaId && updateDto.contratistaId !== area.contratistaId) {
            await this.contratistasService.findOne(updateDto.contratistaId);
        }

        const targetNombre = updateDto.nombre ?? area.nombre;
        if (targetNombre !== area.nombre || targetContratistaId !== area.contratistaId) {
            const duplicada = await this.areaRepository.findOne({
                where: {
                    nombre: targetNombre,
                    contratistaId: targetContratistaId,
                },
            });
            if (duplicada && duplicada.id !== id) {
                throw new RpcException({
                    statusCode: 409,
                    message: `Ya existe un área "${targetNombre}" para este contratista`,
                });
            }
        }

        Object.assign(area, updateDto);
        if (updateDto.contratistaId !== undefined) {
            area.contratista = { id: updateDto.contratistaId } as any;
        }
        area.actualizadoPor = 'admin';
        await this.areaRepository.save(area);
        return this.findOne(id);
    }

    async toggle(id: number): Promise<{ activo: boolean }> {
        const area = await this.findOne(id);

        // Verificar proyectos asociados (activos o inactivos, incluyendo soft-deleted)
        const proyectosCount = await this.proyectoRepository.count({
            where: { areaId: id },
            withDeleted: true,
        });
        if (proyectosCount > 0) {
            throw new RpcException({
                statusCode: 409,
                message: `No se puede desactivar el área "${area.nombre}": tiene ${proyectosCount} proyecto(s) asociado(s)`,
            });
        }

        area.activo = !area.activo;
        area.actualizadoPor = 'admin';
        await this.areaRepository.save(area);
        return { activo: area.activo };
    }

    async getStats(contratistaId?: number): Promise<{ total: number; activas: number; inactivas: number }> {
        const whereBase = contratistaId ? { contratistaId } : {};
        const total = await this.areaRepository.count({ where: whereBase });
        const activas = await this.areaRepository.count({ where: { ...whereBase, activo: true } });
        return {
            total,
            activas,
            inactivas: total - activas,
        };
    }
}
