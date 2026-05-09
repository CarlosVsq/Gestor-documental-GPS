import { Injectable } from '@nestjs/common';
import { RpcException } from '@nestjs/microservices';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Subtipo } from './subtipo.entity';
import { Categoria } from '../categorias/categoria.entity';
import { CreateSubtipoDto } from './dto/create-subtipo.dto';
import { UpdateSubtipoDto } from './dto/update-subtipo.dto';

@Injectable()
export class SubtiposService {
    constructor(
        @InjectRepository(Subtipo)
        private readonly subtipoRepository: Repository<Subtipo>,
        @InjectRepository(Categoria)
        private readonly categoriaRepository: Repository<Categoria>,
    ) { }

    async create(createDto: CreateSubtipoDto): Promise<Subtipo> {
        // Validar que la categoría exista
        const categoria = await this.categoriaRepository.findOne({ where: { id: createDto.categoriaId } });
        if (!categoria) {
            throw new RpcException({ statusCode: 404, message: `Categoría #${createDto.categoriaId} no encontrada` });
        }

        const duplicado = await this.subtipoRepository.findOne({
            where: { 
                nombre: createDto.nombre,
                categoriaId: createDto.categoriaId,
            },
        });
        if (duplicado) {
            throw new RpcException({
                statusCode: 409,
                message: `Ya existe un subtipo con el nombre "${createDto.nombre}" en esta categoría`,
            });
        }

        const subtipo = this.subtipoRepository.create({
            ...createDto,
            creadoPor: 'admin',
            actualizadoPor: 'admin',
        });
        return this.subtipoRepository.save(subtipo);
    }

    async findAll(page: number = 1, limit: number = 10, categoriaId?: number): Promise<{ data: Subtipo[]; total: number }> {
        const whereCondition = categoriaId ? { categoriaId } : {};
        const [data, total] = await this.subtipoRepository.findAndCount({
            where: whereCondition,
            relations: ['categoria'],
            skip: (page - 1) * limit,
            take: limit,
            order: { creadoEn: 'DESC' },
        });
        return { data, total };
    }

    async findOne(id: number): Promise<Subtipo> {
        const subtipo = await this.subtipoRepository.findOne({ 
            where: { id },
            relations: ['categoria'],
        });
        if (!subtipo) {
            throw new RpcException({ statusCode: 404, message: `Subtipo #${id} no encontrado` });
        }
        return subtipo;
    }

    async update(id: number, updateDto: UpdateSubtipoDto): Promise<Subtipo> {
        const subtipo = await this.findOne(id);

        const targetCategoriaId = updateDto.categoriaId ?? subtipo.categoriaId;
        if (updateDto.categoriaId && updateDto.categoriaId !== subtipo.categoriaId) {
            const categoria = await this.categoriaRepository.findOne({ where: { id: updateDto.categoriaId } });
            if (!categoria) {
                throw new RpcException({ statusCode: 404, message: `Categoría #${updateDto.categoriaId} no encontrada` });
            }
        }

        const targetNombre = updateDto.nombre ?? subtipo.nombre;
        if (targetNombre !== subtipo.nombre || targetCategoriaId !== subtipo.categoriaId) {
            const duplicado = await this.subtipoRepository.findOne({
                where: {
                    nombre: targetNombre,
                    categoriaId: targetCategoriaId,
                },
            });
            if (duplicado && duplicado.id !== id) {
                throw new RpcException({
                    statusCode: 409,
                    message: `Ya existe un subtipo "${targetNombre}" en esta categoría`,
                });
            }
        }

        Object.assign(subtipo, updateDto);
        if (updateDto.categoriaId !== undefined) {
            subtipo.categoria = { id: updateDto.categoriaId } as any;
        }
        subtipo.actualizadoPor = 'admin';
        await this.subtipoRepository.save(subtipo);
        return this.findOne(id);
    }

    async toggle(id: number): Promise<{ activo: boolean }> {
        const subtipo = await this.findOne(id);
        
        subtipo.activo = !subtipo.activo;
        subtipo.actualizadoPor = 'admin';
        await this.subtipoRepository.save(subtipo);
        return { activo: subtipo.activo };
    }
}
