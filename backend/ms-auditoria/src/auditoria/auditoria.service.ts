import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Auditoria } from './entities/auditoria.entity';
import { RegistrarAuditoriaDto } from './dto/registrar-auditoria.dto';

/**
 * AuditoriaService
 *
 * Sink append-only del log de auditoría (ISO 30300). NO produce
 * notificaciones: a partir del Fix 1 (HU-34/HU-35), el despacho de
 * notificaciones se resuelve en el API Gateway
 * (`NotificacionesDispatchService`), que es el único punto con acceso a la
 * lista de usuarios y al actor de la petición.
 */
@Injectable()
export class AuditoriaService {
  private readonly logger = new Logger(AuditoriaService.name);

  constructor(
    @InjectRepository(Auditoria)
    private readonly repo: Repository<Auditoria>,
  ) {}

  async registrar(dto: RegistrarAuditoriaDto): Promise<Auditoria> {
    const guardado = await this.repo.save(this.repo.create(dto));
    this.logger.log(
      `AUDIT #${guardado.id} ${guardado.accion} ${guardado.entidad}` +
        `${guardado.entidadId ? `:${guardado.entidadId}` : ''} ` +
        `usuario ${guardado.usuarioId ?? 'anonimo'}`,
    );
    return guardado;
  }

  findRecientes(limit = 20): Promise<Auditoria[]> {
    return this.repo.find({
      order: { timestamp: 'DESC' },
      take: Math.min(Math.max(limit, 1), 200),
    });
  }

  findByEntidad(entidad: string, entidadId: number): Promise<Auditoria[]> {
    return this.repo.find({
      where: { entidad, entidadId },
      order: { timestamp: 'DESC' },
    });
  }

  findByRequerimiento(requerimientoId: number): Promise<Auditoria[]> {
    return this.repo.find({
      where: { requerimientoId },
      order: { timestamp: 'ASC' },
    });
  }
}
