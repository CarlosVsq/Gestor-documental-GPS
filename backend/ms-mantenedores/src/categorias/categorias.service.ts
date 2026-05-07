import { Injectable } from '@nestjs/common';
import { RpcException } from '@nestjs/microservices';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Categoria } from './categoria.entity';
import { Subtipo } from '../subtipos/subtipo.entity';
import { CreateCategoriaDto } from './dto/create-categoria.dto';
import { UpdateCategoriaDto } from './dto/update-categoria.dto';

@Injectable()
export class CategoriasService {
    constructor(
        @InjectRepository(Categoria)
        private readonly categoriaRepository: Repository<Categoria>,
        @InjectRepository(Subtipo)
        private readonly subtipoRepository: Repository<Subtipo>,
    ) { }

    async create(createDto: CreateCategoriaDto): Promise<Categoria> {
        const duplicada = await this.categoriaRepository.findOne({
            where: { nombre: createDto.nombre },
        });
        if (duplicada) {
            throw new RpcException({
                statusCode: 409,
                message: `Ya existe una categoría con el nombre "${createDto.nombre}"`,
            });
        }

        const categoria = this.categoriaRepository.create({
            ...createDto,
            creadoPor: 'admin',
            actualizadoPor: 'admin',
        });
        return this.categoriaRepository.save(categoria);
    }

    async findAll(page: number = 1, limit: number = 10): Promise<{ data: Categoria[]; total: number }> {
        const [data, total] = await this.categoriaRepository.findAndCount({
            skip: (page - 1) * limit,
            take: limit,
            order: { creadoEn: 'DESC' },
        });
        return { data, total };
    }

    async findOne(id: number): Promise<Categoria> {
        const categoria = await this.categoriaRepository.findOne({ where: { id } });
        if (!categoria) {
            throw new RpcException({ statusCode: 404, message: `Categoría #${id} no encontrada` });
        }
        return categoria;
    }

    async update(id: number, updateDto: UpdateCategoriaDto): Promise<Categoria> {
        const categoria = await this.findOne(id);

        if (updateDto.nombre && updateDto.nombre !== categoria.nombre) {
            const duplicada = await this.categoriaRepository.findOne({
                where: { nombre: updateDto.nombre },
            });
            if (duplicada && duplicada.id !== id) {
                throw new RpcException({
                    statusCode: 409,
                    message: `Ya existe una categoría "${updateDto.nombre}"`,
                });
            }
        }

        Object.assign(categoria, updateDto);
        categoria.actualizadoPor = 'admin';
        return this.categoriaRepository.save(categoria);
    }

    async toggle(id: number): Promise<{ activo: boolean }> {
        const categoria = await this.findOne(id);
        
        // Evitar desactivar si tiene subtipos asociados
        const subtiposCount = await this.subtipoRepository.count({
            where: { categoriaId: id },
            withDeleted: true,
        });
        if (subtiposCount > 0) {
            throw new RpcException({
                statusCode: 409,
                message: `No se puede desactivar la categoría "${categoria.nombre}": tiene ${subtiposCount} subtipo(s) asociado(s)`,
            });
        }

        categoria.activo = !categoria.activo;
        categoria.actualizadoPor = 'admin';
        await this.categoriaRepository.save(categoria);
        return { activo: categoria.activo };
    }
}
