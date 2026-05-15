import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { ExpedientesService } from './expedientes.service';
import { ALMACENAMIENTO_PATTERNS } from '../common/constants';

@Controller()
export class ExpedientesController {
  constructor(private readonly expedientesService: ExpedientesService) {}

  /** HU-N4: Crear expediente (directorio en SeaweedFS) al crear un Requerimiento */
  @MessagePattern(ALMACENAMIENTO_PATTERNS.CREATE_EXPEDIENTE)
  async createExpediente(@Payload() data: {
    contratistaId: number;
    areaId: number;
    proyectoId: number;
    codigoTicket: string;
  }) {
    const storagePath = await this.expedientesService.createExpediente(data);
    return { storagePath };
  }
}
