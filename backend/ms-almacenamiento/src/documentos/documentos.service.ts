import { Injectable, Logger } from '@nestjs/common';
import { RpcException } from '@nestjs/microservices';
import * as crypto from 'crypto';
import * as path from 'path';
import sharp from 'sharp';
import { DocumentosRepository, SearchFiltros } from './documentos.repository';
import { SeaweedFsService } from '../seaweedfs/seaweedfs.service';
import { Documento } from './entities/documento.entity';
import { CreateDocumentoDto } from './dto/create-documento.dto';
import { DEFAULT_ALLOWED_MIME_TYPES, EstadoDocumento, getMaxFileSizeBytes } from '../common/constants';

/**
 * DocumentosService — Lógica de negocio para gestión documental
 *
 * Responsabilidades (Single Responsibility — NestJS best practice arch-single-responsibility):
 *   - Validación de archivos (tipo, tamaño)
 *   - Compresión de imágenes server-side (sharp)
 *   - Cálculo SHA-256 para inmutabilidad ISO 30300
 *   - Generación de path jerárquico en SeaweedFS
 *   - Coordinación con SeaweedFsService y DocumentosRepository
 *
 * Las queries complejas (búsqueda, árbol) están en DocumentosRepository.
 */
@Injectable()
export class DocumentosService {
  private readonly logger = new Logger(DocumentosService.name);

  // Tipos MIME permitidos — configurables via env ALLOWED_MIME_TYPES
  private readonly allowedMimeTypes: string[];
  private readonly maxFileSizeBytes: number;

  constructor(
    private readonly documentosRepository: DocumentosRepository,
    private readonly seaweedFsService: SeaweedFsService,
  ) {
    const envMimes = process.env.ALLOWED_MIME_TYPES;
    this.allowedMimeTypes = envMimes
      ? envMimes.split(',').map((m) => m.trim())
      : DEFAULT_ALLOWED_MIME_TYPES;

    this.maxFileSizeBytes = getMaxFileSizeBytes();
  }

  // ─── Procesamiento de imágenes ───────────────────────────────────────────

  /**
   * Comprime imágenes server-side con sharp antes de subirlas a SeaweedFS.
   * Solo aplica a tipos de imagen — PDF y Office no se tocan.
   */
  private async processBuffer(buffer: Buffer, mimeType: string): Promise<Buffer> {
    if (!mimeType.startsWith('image/')) {
      return buffer;
    }

    try {
      return await sharp(buffer)
        .resize({ width: 2048, height: 2048, fit: 'inside', withoutEnlargement: true })
        .toBuffer();
    } catch (err) {
      this.logger.warn(`Compresión de imagen falló, usando buffer original: ${err?.message}`);
      return buffer;
    }
  }

  // ─── Helpers ─────────────────────────────────────────────────────────────

  private calculateSha256(buffer: Buffer): string {
    return crypto.createHash('sha256').update(buffer).digest('hex');
  }

  private generateStorageName(originalName: string): string {
    const ext = path.extname(originalName).toLowerCase();
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 8);
    return `${timestamp}-${random}${ext}`;
  }

  /**
   * Convención de path en SeaweedFS:
   * /{contratistaId}/{areaId}/{proyectoId}/{codigoTicket}/
   *
   * El `storagePath` del requerimiento ya tiene este formato (sin el archivo).
   */
  private buildDirPath(storagePath: string): string {
    // storagePath ya viene formateado desde ms-requerimientos
    // Si está vacío o null, usamos /misc
    return storagePath || '/misc';
  }

  // ─── CRUD ─────────────────────────────────────────────────────────────────

  /**
   * Sube un documento individual (HU-07).
   * El file llega como base64 string desde el Gateway vía TCP.
   */
  async upload(dto: CreateDocumentoDto & { storagePath?: string }): Promise<Documento> {
    // Validate MIME type before processing (fast reject)
    if (!this.allowedMimeTypes.includes(dto.mimeType)) {
      throw new RpcException({
        statusCode: 400,
        message: `Tipo de archivo no permitido: ${dto.mimeType}. Tipos aceptados: PDF, DOCX, XLSX, PNG, JPG, GIF, WEBP`,
      });
    }

    const rawBuffer = Buffer.from(dto.fileBase64, 'base64');
    const processedBuffer = await this.processBuffer(rawBuffer, dto.mimeType);

    // Validate size against the final (post-compression) buffer
    if (processedBuffer.length > this.maxFileSizeBytes) {
      const maxMB = this.maxFileSizeBytes / (1024 * 1024);
      throw new RpcException({
        statusCode: 413,
        message: `El archivo excede el tamaño máximo permitido de ${maxMB}MB`,
      });
    }

    // Hash SHA-256 del buffer final
    const sha256Hash = this.calculateSha256(processedBuffer);

    // Generar nombre único de storage
    const nombreStorage = this.generateStorageName(dto.nombreOriginal);

    // Subir a SeaweedFS
    const dirPath = this.buildDirPath(dto.storagePath);
    const { path: pathSeaweed } = await this.seaweedFsService.uploadFile(
      dirPath,
      nombreStorage,
      processedBuffer,
      dto.mimeType,
    );

    // Guardar metadata en PostgreSQL
    const doc = await this.documentosRepository.save({
      nombreOriginal: dto.nombreOriginal,
      nombreStorage,
      pathSeaweed,
      mimeType: dto.mimeType,
      tamañoBytes: processedBuffer.length,
      sha256Hash,
      requerimientoId: dto.requerimientoId,
      estadoDocumento: EstadoDocumento.BORRADOR,
      version: 1,
      autorId: dto.autorId,
      creadoPor: dto.creadoPor,
      actualizadoPor: dto.creadoPor,
      metadataAudit: dto.metadataAudit || null,
    });

    this.logger.log(`Documento registrado: id=${doc.id}, req=${dto.requerimientoId}`);
    return doc;
  }

  /**
   * Carga masiva de documentos (HU-08).
   * Procesa archivos en paralelo y retorna resumen de éxitos/errores.
   */
  async uploadBulk(dto: { files: Array<CreateDocumentoDto & { storagePath?: string }> }): Promise<{
    exitosos: Documento[];
    errores: Array<{ nombreOriginal: string; motivo: string }>;
  }> {
    const exitosos: Documento[] = [];
    const errores: Array<{ nombreOriginal: string; motivo: string }> = [];

    await Promise.all(
      dto.files.map(async (file) => {
        try {
          const doc = await this.upload(file);
          exitosos.push(doc);
        } catch (err) {
          errores.push({
            nombreOriginal: file.nombreOriginal,
            motivo: err?.error?.message || err?.message || 'Error desconocido',
          });
        }
      }),
    );

    return { exitosos, errores };
  }

  /**
   * Descarga un archivo de SeaweedFS (HU-09 vista integrada).
   * Retorna el buffer como base64 para enviarlo por TCP.
   */
  async download(id: number): Promise<{ base64: string; contentType: string; nombreOriginal: string }> {
    const doc = await this.documentosRepository.findById(id);
    if (!doc) {
      throw new RpcException({ statusCode: 404, message: `Documento #${id} no encontrado` });
    }

    const { buffer, contentType } = await this.seaweedFsService.downloadFile(doc.pathSeaweed);

    return {
      base64: buffer.toString('base64'),
      contentType,
      nombreOriginal: doc.nombreOriginal,
    };
  }

  async findByRequerimiento(requerimientoId: number): Promise<Documento[]> {
    return this.documentosRepository.findByRequerimiento(requerimientoId);
  }

  async findOne(id: number): Promise<Documento> {
    const doc = await this.documentosRepository.findById(id);
    if (!doc) {
      throw new RpcException({ statusCode: 404, message: `Documento #${id} no encontrado` });
    }
    return doc;
  }

  async search(filtros: SearchFiltros) {
    return this.documentosRepository.search(filtros);
  }

  async getTree() {
    return this.documentosRepository.getTree();
  }

  /**
   * Soft-delete de documento (elimina registro y el archivo de SeaweedFS).
   */
  async delete(id: number): Promise<{ success: boolean }> {
    const doc = await this.findOne(id);
    await Promise.all([
      this.seaweedFsService.deleteFile(doc.pathSeaweed),
      this.documentosRepository.softDelete(id),
    ]);
    this.logger.log(`Documento eliminado: id=${id}`);
    return { success: true };
  }

  async countByRequerimiento(requerimientoId: number): Promise<number> {
    return this.documentosRepository.countByRequerimiento(requerimientoId);
  }

  /**
   * Cambia el estado de un documento.
   * Transiciones permitidas: BORRADOR → OFICIAL → OBSOLETO
   * No se puede retroceder ni saltar estados.
   */
  async updateEstado(id: number, nuevoEstado: EstadoDocumento): Promise<Documento> {
    const doc = await this.findOne(id);

    // Mapa de transiciones válidas
    const TRANSICIONES: Record<EstadoDocumento, EstadoDocumento | null> = {
      [EstadoDocumento.BORRADOR]: EstadoDocumento.OFICIAL,
      [EstadoDocumento.OFICIAL]: EstadoDocumento.OBSOLETO,
      [EstadoDocumento.OBSOLETO]: null,
    };

    const siguiente = TRANSICIONES[doc.estadoDocumento as EstadoDocumento];
    if (!siguiente) {
      throw new RpcException({
        statusCode: 409,
        message: `El documento ya está en estado OBSOLETO y no puede cambiar de estado`,
      });
    }
    if (nuevoEstado !== siguiente) {
      throw new RpcException({
        statusCode: 409,
        message: `Transición inválida: ${doc.estadoDocumento} → ${nuevoEstado}. Solo se permite → ${siguiente}`,
      });
    }

    await this.documentosRepository.updateEstado(id, nuevoEstado);
    this.logger.log(`Documento #${id}: ${doc.estadoDocumento} → ${nuevoEstado}`);
    return { ...doc, estadoDocumento: nuevoEstado };
  }
}
