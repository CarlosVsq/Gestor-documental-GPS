import { Injectable, Logger } from '@nestjs/common';
import { RpcException } from '@nestjs/microservices';
import axios from 'axios';
import * as FormData from 'form-data';

export interface SeaweedUploadResult {
  path: string;        // path completo en el Filer
  filename: string;    // nombre del archivo en SeaweedFS
}

/**
 * SeaweedFsService — Cliente HTTP para el SeaweedFS Filer
 *
 * El Filer expone una API REST simple:
 *   PUT/POST  http://filer:8888/{path}   — sube un archivo
 *   GET       http://filer:8888/{path}   — descarga un archivo
 *   DELETE    http://filer:8888/{path}   — elimina un archivo
 *   GET       http://filer:8888/{dir}/?pretty=y — lista un directorio
 *
 * Variables de entorno:
 *   SEAWEEDFS_FILER_URL  (default: http://seaweedfs-filer:8888)
 */
@Injectable()
export class SeaweedFsService {
  private readonly logger = new Logger(SeaweedFsService.name);
  private readonly filerUrl: string;

  constructor() {
    this.filerUrl = process.env.SEAWEEDFS_FILER_URL || 'http://seaweedfs-filer:8888';
  }

  /**
   * Sube un archivo al Filer de SeaweedFS.
   * @param dirPath  Ruta del directorio (sin slash al final): /1/2/3/REQ-2026-0001
   * @param filename Nombre del archivo (con extensión)
   * @param buffer   Buffer del archivo
   * @param mimeType MIME type del archivo
   */
  async uploadFile(
    dirPath: string,
    filename: string,
    buffer: Buffer,
    mimeType: string,
  ): Promise<SeaweedUploadResult> {
    const fullPath = `${dirPath}/${filename}`;
    const url = `${this.filerUrl}${fullPath}`;

    const form = new FormData();
    form.append('file', buffer, {
      filename,
      contentType: mimeType,
    });

    try {
      await axios.post(url, form, {
        headers: form.getHeaders(),
        maxBodyLength: Infinity,
        maxContentLength: Infinity,
      });

      this.logger.log(`Archivo subido a SeaweedFS: ${fullPath}`);
      return { path: fullPath, filename };
    } catch (error) {
      this.logger.error(`Error subiendo a SeaweedFS: ${fullPath}`, error?.message);
      throw new RpcException({
        statusCode: 502,
        message: `Error al subir archivo a SeaweedFS: ${error?.message}`,
      });
    }
  }

  /**
   * Descarga un archivo del Filer como Buffer.
   */
  async downloadFile(filePath: string): Promise<{ buffer: Buffer; contentType: string }> {
    const url = `${this.filerUrl}${filePath}`;

    try {
      const response = await axios.get(url, { responseType: 'arraybuffer' });
      return {
        buffer: Buffer.from(response.data),
        contentType: (response.headers['content-type'] as string) || 'application/octet-stream',
      };
    } catch (error) {
      this.logger.error(`Error descargando de SeaweedFS: ${filePath}`, error?.message);
      throw new RpcException({
        statusCode: 404,
        message: `Archivo no encontrado en SeaweedFS: ${filePath}`,
      });
    }
  }

  /**
   * Elimina un archivo del Filer.
   */
  async deleteFile(filePath: string): Promise<void> {
    const url = `${this.filerUrl}${filePath}`;

    try {
      await axios.delete(url);
      this.logger.log(`Archivo eliminado de SeaweedFS: ${filePath}`);
    } catch (error) {
      this.logger.warn(`No se pudo eliminar de SeaweedFS: ${filePath}`, error?.message);
      // No lanzamos excepción — el archivo puede ya no existir
    }
  }

  /**
   * Asegura que un directorio exista en el Filer.
   * SeaweedFS crea directorios automáticamente al subir, pero esto lo hace explícito.
   */
  async ensureDirectory(dirPath: string): Promise<void> {
    const url = `${this.filerUrl}${dirPath}/`;

    try {
      // Un PUT vacío al directorio lo crea si no existe
      await axios.post(url, '', {
        headers: { 'Content-Type': 'application/octet-stream' },
      });
      this.logger.log(`Directorio asegurado en SeaweedFS: ${dirPath}`);
    } catch (error) {
      // Los errores de directorio existente son normales, no los lanzamos
      this.logger.debug(`ensureDirectory: ${dirPath} — ${error?.message}`);
    }
  }

  /**
   * Lista el contenido de un directorio en el Filer.
   */
  async listDirectory(dirPath: string): Promise<any> {
    const url = `${this.filerUrl}${dirPath}/?pretty=y`;

    try {
      const response = await axios.get(url, {
        headers: { Accept: 'application/json' },
      });
      return response.data;
    } catch {
      return { Entries: [] };
    }
  }
}
