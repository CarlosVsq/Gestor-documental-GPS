import { Injectable } from '@nestjs/common';
import { RpcException } from '@nestjs/microservices';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like } from 'typeorm';
import { Requerimiento, EstadoRequerimiento, PrioridadRequerimiento } from './requerimiento.entity';
import { CreateRequerimientoDto } from './dto/create-requerimiento.dto';
import { UpdateEstadoDto } from './dto/update-estado.dto';

@Injectable()
export class RequerimientosService {
    constructor(
        @InjectRepository(Requerimiento)
        private readonly requerimientoRepository: Repository<Requerimiento>,
    ) { }

    private async generateCodigoTicket(): Promise<string> {
        const year = new Date().getFullYear();
        const prefix = `REQ-${year}-`;
        
        // Buscamos el último ticket del año actual
        const lastReq = await this.requerimientoRepository.findOne({
            where: { codigoTicket: Like(`${prefix}%`) },
            order: { codigoTicket: 'DESC' },
        });

        let nextNumber = 1;
        if (lastReq && lastReq.codigoTicket) {
            const parts = lastReq.codigoTicket.split('-');
            if (parts.length === 3) {
                nextNumber = parseInt(parts[2], 10) + 1;
            }
        }

        const paddedNumber = nextNumber.toString().padStart(4, '0');
        return `${prefix}${paddedNumber}`;
    }

    async create(createDto: CreateRequerimientoDto): Promise<Requerimiento> {
        const codigoTicket = await this.generateCodigoTicket();

        const req = this.requerimientoRepository.create({
            ...createDto,
            codigoTicket,
            estado: EstadoRequerimiento.ABIERTO,
            prioridad: createDto.prioridad || PrioridadRequerimiento.MEDIA,
            // TODO: Modificar aquí la lógica de storage (campos storagePath y totalDocumentos)
            // cuando se implemente la carga de archivos
            storagePath: null,
            totalDocumentos: 0,
            creadoPor: 'admin', 
            actualizadoPor: 'admin',
        });
        return this.requerimientoRepository.save(req);
    }

    async findAll(
        page: number = 1, 
        limit: number = 10, 
        filtros?: {
            contratistaId?: number;
            estado?: string;
            prioridad?: string;
            proyectoId?: number;
            areaId?: number;
        }
    ): Promise<{ data: Requerimiento[]; total: number }> {
        const whereCondition: any = {};
        
        if (filtros?.contratistaId) whereCondition.contratistaId = filtros.contratistaId;
        if (filtros?.estado) whereCondition.estado = filtros.estado;
        if (filtros?.prioridad) whereCondition.prioridad = filtros.prioridad;
        if (filtros?.proyectoId) whereCondition.proyectoId = filtros.proyectoId;
        if (filtros?.areaId) whereCondition.areaId = filtros.areaId;

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

        if (req.estado === EstadoRequerimiento.CERRADO && updateDto.estado !== EstadoRequerimiento.CERRADO) {
            throw new RpcException({ statusCode: 400, message: 'Un requerimiento cerrado no puede volver a abrirse o ponerse en progreso.' });
        }

        if (updateDto.estado === EstadoRequerimiento.CERRADO && req.estado !== EstadoRequerimiento.CERRADO) {
            req.fechaCierre = new Date();
        }

        req.estado = updateDto.estado;
        if (updateDto.motivoRechazo) {
            req.motivoRechazo = updateDto.motivoRechazo;
        }
        
        req.actualizadoPor = 'admin';
        return this.requerimientoRepository.save(req);
    }
}
