import { Injectable } from '@nestjs/common';
import { RpcException } from '@nestjs/microservices';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Requerimiento, EstadoRequerimiento } from './requerimiento.entity';
import { CreateRequerimientoDto } from './dto/create-requerimiento.dto';
import { UpdateEstadoDto } from './dto/update-estado.dto';

@Injectable()
export class RequerimientosService {
    constructor(
        @InjectRepository(Requerimiento)
        private readonly requerimientoRepository: Repository<Requerimiento>,
    ) { }

    async create(createDto: CreateRequerimientoDto): Promise<Requerimiento> {
        // En una implementación completa con API Composition, el Gateway debería validar
        // previamente que los IDs (proyectoId, categoriaId, etc.) existan llamando a ms-mantenedores.
        // Aquí asumimos que los IDs que llegan ya están validados por el cliente o gateway.

        const req = this.requerimientoRepository.create({
            ...createDto,
            estado: EstadoRequerimiento.ABIERTO,
            creadoPor: 'admin', // Se inyectaría vía JWT en el Gateway
            actualizadoPor: 'admin',
        });
        return this.requerimientoRepository.save(req);
    }

    async findAll(page: number = 1, limit: number = 10, contratistaId?: number): Promise<{ data: Requerimiento[]; total: number }> {
        const whereCondition = contratistaId ? { contratistaId } : {};
        const [data, total] = await this.requerimientoRepository.findAndCount({
            where: whereCondition,
            skip: (page - 1) * limit,
            take: limit,
            order: { creadoEn: 'DESC' },
        });
        return { data, total };
    }

    async findOne(id: number): Promise<Requerimiento> {
        const req = await this.requerimientoRepository.findOne({ where: { id } });
        if (!req) {
            throw new RpcException({ statusCode: 404, message: `Requerimiento #${id} no encontrado` });
        }
        return req;
    }

    async updateState(id: number, updateDto: UpdateEstadoDto): Promise<Requerimiento> {
        const req = await this.findOne(id);

        // Reglas de negocio (transición estricta de estados)
        if (req.estado === EstadoRequerimiento.CERRADO && updateDto.estado !== EstadoRequerimiento.CERRADO) {
            throw new RpcException({ statusCode: 400, message: 'Un requerimiento cerrado no puede volver a abrirse o ponerse en progreso.' });
        }

        // Validación: HU-N7 (requiere documentos para pasar a En Progreso)
        // Por simplificación en esta versión, lo permitiremos, pero aquí se agregaría la lógica
        // para contar si el Document Set asociado tiene archivos.

        req.estado = updateDto.estado;
        req.actualizadoPor = 'admin';
        return this.requerimientoRepository.save(req);
    }
}
