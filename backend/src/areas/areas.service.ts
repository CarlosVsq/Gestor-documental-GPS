import {
    Injectable,
    NotFoundException,
    ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Area } from './area.entity';
import { Proyecto } from '../proyectos/proyecto.entity';
import { CreateAreaDto } from './dto/create-area.dto';
import { UpdateAreaDto } from './dto/update-area.dto';
import { ContratistasService } from '../contratistas/contratistas.service';

/**
 * Servicio de Áreas - HU-02
 * Implementa la lógica de negocio para el CRUD de áreas.
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

    /**
     * Crear una nueva área vinculada a un contratista.
     * Valida que el contratista exista y que no haya otra área
     * con el mismo nombre para ese contratista.
     */
    async create(createDto: CreateAreaDto): Promise<Area> {
        // Verificar que el contratista exista (lanza NotFoundException si no)
        await this.contratistasService.findOne(createDto.contratistaId);

        // Verificar unicidad de nombre dentro del contratista
        const duplicada = await this.areaRepository.findOne({
            where: {
                nombre: createDto.nombre,
                contratistaId: createDto.contratistaId,
            },
        });
        if (duplicada) {
            throw new ConflictException(
                `Ya existe un área "${createDto.nombre}" para este contratista`,
            );
        }

        const area = this.areaRepository.create({
            ...createDto,
            creadoPor: 'admin', // En producción viene del JWT
            actualizadoPor: 'admin',
        });
        return this.areaRepository.save(area);
    }

    /**
     * Obtener todas las áreas con paginación.
     * Incluye la relación con contratista para mostrar su nombre.
     */
    async findAll(
        page: number = 1,
        limit: number = 10,
    ): Promise<{ data: Area[]; total: number }> {
        const [data, total] = await this.areaRepository.findAndCount({
            relations: ['contratista'],
            skip: (page - 1) * limit,
            take: limit,
            order: { creadoEn: 'DESC' },
        });
        return { data, total };
    }

    /**
     * Obtener un área por ID con su contratista.
     */
    async findOne(id: number): Promise<Area> {
        const area = await this.areaRepository.findOne({
            where: { id },
            relations: ['contratista'],
        });
        if (!area) {
            throw new NotFoundException(`Área con ID ${id} no encontrada`);
        }
        return area;
    }

    /**
     * Actualizar un área existente.
     * Si se cambia el contratista, verifica que exista.
     * Si se cambia el nombre, verifica unicidad dentro del contratista.
     */
    async update(id: number, updateDto: UpdateAreaDto): Promise<Area> {
        const area = await this.findOne(id);

        // Si se cambia el contratista, verificar que exista
        const targetContratistaId = updateDto.contratistaId ?? area.contratistaId;
        if (updateDto.contratistaId && updateDto.contratistaId !== area.contratistaId) {
            await this.contratistasService.findOne(updateDto.contratistaId);
        }

        // Si se cambia el nombre, verificar unicidad dentro del contratista
        const targetNombre = updateDto.nombre ?? area.nombre;
        if (targetNombre !== area.nombre || targetContratistaId !== area.contratistaId) {
            const duplicada = await this.areaRepository.findOne({
                where: {
                    nombre: targetNombre,
                    contratistaId: targetContratistaId,
                },
            });
            if (duplicada && duplicada.id !== id) {
                throw new ConflictException(
                    `Ya existe un área "${targetNombre}" para este contratista`,
                );
            }
        }

        Object.assign(area, updateDto);
        if (updateDto.contratistaId !== undefined) {
            area.contratista = { id: updateDto.contratistaId } as any;
        }
        area.actualizadoPor = 'admin'; // En producción viene del JWT
        await this.areaRepository.save(area);
        return this.findOne(id);
    }

    /**
     * Eliminar un área (soft delete).
     * REGLA DE NEGOCIO: No se puede eliminar si tiene proyectos asociados.
     */
    async remove(id: number): Promise<void> {
        const area = await this.findOne(id);

        // Verificar dependencias: proyectos asociados (no eliminados)
        const proyectosCount = await this.proyectoRepository.count({
            where: { areaId: id },
        });
        if (proyectosCount > 0) {
            throw new ConflictException(
                `No se puede eliminar el área "${area.nombre}": tiene ${proyectosCount} proyecto(s) asociado(s)`,
            );
        }

        await this.areaRepository.softRemove(area);
    }

    async getStats(): Promise<{ total: number; activas: number; inactivas: number }> {
        const total = await this.areaRepository.count();
        const activas = await this.areaRepository.count({ where: { activo: true } });
        return {
            total,
            activas,
            inactivas: total - activas,
        };
    }
}
