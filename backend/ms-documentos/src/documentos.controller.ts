import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { DocumentosService } from './documentos.service';
import { DOCUMENTOS_PATTERNS } from './common/constants';

/**
 * Controller de Documentos — Microservicio TCP
 * Recibe metadata de archivos desde el Gateway (el archivo físico
 * se guarda en el Gateway via Multer, aquí solo llega la metadata).
 */
@Controller()
export class DocumentosController {
  constructor(private readonly documentosService: DocumentosService) {}

  @MessagePattern(DOCUMENTOS_PATTERNS.CREATE)
  async create(@Payload() data: {
    nombreOriginal: string;
    storageId: string;
    mimeType: string;
    tamañoBytes: number;
    autorId: number;
  }) {
    return this.documentosService.create(data);
  }

  @MessagePattern(DOCUMENTOS_PATTERNS.FIND_ALL)
  async findAll() {
    return this.documentosService.findAll();
  }

  @MessagePattern(DOCUMENTOS_PATTERNS.GET_FILE_PATH)
  async getFilePath(@Payload() data: { id: number }) {
    return this.documentosService.getFileInfo(data.id);
  }
}
