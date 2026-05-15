import { Injectable, Inject, Logger } from '@nestjs/common';
import { RpcException, ClientProxy } from '@nestjs/microservices';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like } from 'typeorm';
import { Requerimiento, EstadoRequerimiento, PrioridadRequerimiento } from './requerimiento.entity';
import { CreateRequerimientoDto } from './dto/create-requerimiento.dto';
import { UpdateEstadoDto } from './dto/update-estado.dto';
import { ALMACENAMIENTO_CLIENT } from '../common/constants';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class RequerimientosService {
    private readonly logger = new Logger(RequerimientosService.name);

    constructor(
        @InjectRepository(Requerimiento)
        private readonly requerimientoRepository: Repository<Requerimiento>,
        @Inject(ALMACENAMIENTO_CLIENT)
        private readonly almacenamientoClient: ClientProxy,
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

        // Generamos el storagePath usando IDs para evitar caracteres especiales
        // Formato: /{contratistaId}/{areaId}/{proyectoId}/{codigoTicket}
        const storagePath = `/${createDto.contratistaId}/${createDto.areaId}/${createDto.proyectoId}/${codigoTicket}`;

        const req = this.requerimientoRepository.create({
            ...createDto,
            codigoTicket,
            estado: EstadoRequerimiento.ABIERTO,
            prioridad: createDto.prioridad || PrioridadRequerimiento.MEDIA,
            storagePath,
            totalDocumentos: 0,
            creadoPor: 'admin',
            actualizadoPor: 'admin',
        });
        const saved = await this.requerimientoRepository.save(req);

        // HU-N4: Crear el expediente (directorio) en SeaweedFS de forma asíncrona.
        // No bloqueamos la respuesta al cliente — si falla, el expediente se puede
        // crear manualmente luego mediante POST /api/almacenamiento/expediente.
        this.almacenamientoClient
            .send('almacenamiento.expediente.create', {
                contratistaId: createDto.contratistaId,
                areaId: createDto.areaId,
                proyectoId: createDto.proyectoId,
                codigoTicket,
            })
            .subscribe({
                next: () => this.logger.log(`Expediente creado en SeaweedFS: ${storagePath}`),
                error: (err) => this.logger.warn(`No se pudo crear expediente en SeaweedFS: ${err?.message}`),
            });

        return saved;
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
