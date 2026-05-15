import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { DocumentosService } from './documentos.service';
import { ALMACENAMIENTO_PATTERNS } from '../common/constants';
import { CreateDocumentoDto, SearchDocumentosDto } from './dto/create-documento.dto';

/**
 * DocumentosController — Recibe mensajes TCP del API Gateway
 *
 * Todos los handlers usan MessagePattern (request-reply).
 * Los archivos llegan como base64 dentro del payload (TCP no soporta streams).
 */
@Controller()
export class DocumentosController {
  constructor(private readonly documentosService: DocumentosService) {}

  /** HU-07: Subir un documento individual */
  @MessagePattern(ALMACENAMIENTO_PATTERNS.UPLOAD)
  async upload(@Payload() data: CreateDocumentoDto & { storagePath?: string }) {
    return this.documentosService.upload(data);
  }

  /** HU-08: Carga masiva de documentos */
  @MessagePattern(ALMACENAMIENTO_PATTERNS.UPLOAD_BULK)
  async uploadBulk(@Payload() data: { files: Array<CreateDocumentoDto & { storagePath?: string }> }) {
    return this.documentosService.uploadBulk(data);
  }

  /** Descarga archivo (retorna base64 + contentType) */
  @MessagePattern(ALMACENAMIENTO_PATTERNS.DOWNLOAD)
  async download(@Payload() data: { id: number }) {
    return this.documentosService.download(data.id);
  }

  /** Obtener todos los documentos de un requerimiento */
  @MessagePattern(ALMACENAMIENTO_PATTERNS.FIND_BY_REQUERIMIENTO)
  async findByRequerimiento(@Payload() data: { requerimientoId: number }) {
    return this.documentosService.findByRequerimiento(data.requerimientoId);
  }

  /** Obtener un documento por ID */
  @MessagePattern(ALMACENAMIENTO_PATTERNS.FIND_ONE)
  async findOne(@Payload() data: { id: number }) {
    return this.documentosService.findOne(data.id);
  }

  /** HU-09, HU-31: Búsqueda por metadatos heredados */
  @MessagePattern(ALMACENAMIENTO_PATTERNS.SEARCH)
  async search(@Payload() filtros: SearchDocumentosDto) {
    return this.documentosService.search(filtros);
  }

  /** HU-32: Árbol jerárquico Contratista→Área→Proyecto→Requerimiento */
  @MessagePattern(ALMACENAMIENTO_PATTERNS.GET_TREE)
  async getTree() {
    return this.documentosService.getTree();
  }

  /** Soft-delete de un documento */
  @MessagePattern(ALMACENAMIENTO_PATTERNS.DELETE)
  async delete(@Payload() data: { id: number }) {
    return this.documentosService.delete(data.id);
  }

  /** Cambiar estado de documento: BORRADOR → OFICIAL → OBSOLETO */
  @MessagePattern(ALMACENAMIENTO_PATTERNS.UPDATE_ESTADO)
  async updateEstado(@Payload() data: { id: number; estado: string }) {
    return this.documentosService.updateEstado(data.id, data.estado as any);
  }
}
