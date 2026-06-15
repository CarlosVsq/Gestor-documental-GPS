import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { AuditoriaService } from './auditoria.service';
import { AUDITORIA_PATTERNS } from '../common/constants';
import { RegistrarAuditoriaDto } from './dto/registrar-auditoria.dto';

@Controller()
export class AuditoriaController {
  constructor(private readonly auditoriaService: AuditoriaService) {}

  @MessagePattern(AUDITORIA_PATTERNS.REGISTRAR)
  registrar(@Payload() dto: RegistrarAuditoriaDto) {
    return this.auditoriaService.registrar(dto);
  }

  @MessagePattern(AUDITORIA_PATTERNS.FIND_RECIENTES)
  findRecientes(@Payload() payload: { limit?: number }) {
    return this.auditoriaService.findRecientes(payload?.limit);
  }

  @MessagePattern(AUDITORIA_PATTERNS.FIND_BY_ENTIDAD)
  findByEntidad(@Payload() payload: { entidad: string; entidadId: number }) {
    return this.auditoriaService.findByEntidad(payload.entidad, payload.entidadId);
  }

  @MessagePattern(AUDITORIA_PATTERNS.FIND_BY_REQUERIMIENTO)
  findByRequerimiento(@Payload() payload: { requerimientoId: number }) {
    return this.auditoriaService.findByRequerimiento(payload.requerimientoId);
  }
}
