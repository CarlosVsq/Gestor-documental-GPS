import { Injectable, Logger } from '@nestjs/common';
import { SeaweedFsService } from '../seaweedfs/seaweedfs.service';

/**
 * ExpedientesService — Gestión de "Document Sets" virtuales
 *
 * Un expediente es un directorio lógico en SeaweedFS que agrupa todos
 * los archivos de un Requerimiento. La convención de path es:
 *   /{contratistaId}/{areaId}/{proyectoId}/{codigoTicket}/
 *
 * No hay tabla en PostgreSQL para expedientes — son directorios en SeaweedFS.
 * El campo `storagePath` en la tabla `requerimientos` guarda esta ruta.
 */
@Injectable()
export class ExpedientesService {
  private readonly logger = new Logger(ExpedientesService.name);

  constructor(private readonly seaweedFsService: SeaweedFsService) {}

  /**
   * Construye y asegura el directorio del expediente en SeaweedFS.
   * Llamado automáticamente al crear un Requerimiento (HU-N4).
   *
   * @returns El storagePath que debe guardarse en el requerimiento.
   */
  async createExpediente(params: {
    contratistaId: number;
    areaId: number;
    proyectoId: number;
    codigoTicket: string;
  }): Promise<string> {
    const { contratistaId, areaId, proyectoId, codigoTicket } = params;
    const storagePath = `/${contratistaId}/${areaId}/${proyectoId}/${codigoTicket}`;

    await this.seaweedFsService.ensureDirectory(storagePath);
    this.logger.log(`Expediente creado: ${storagePath}`);

    return storagePath;
  }
}
