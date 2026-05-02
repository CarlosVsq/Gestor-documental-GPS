import { Injectable } from '@nestjs/common';
import { RpcException } from '@nestjs/microservices';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Documento } from './entities/documento.entity';

/**
 * Servicio Documentos — HU: Colaborador/Editor
 * Maneja la lógica de negocio para la tabla de documentos.
 * El almacenamiento físico de archivos se maneja en el API Gateway.
 */
@Injectable()
export class DocumentosService {
  constructor(
    @InjectRepository(Documento)
    private readonly documentoRepository: Repository<Documento>,
  ) {}

  /**
   * Registra un nuevo documento en la base de datos.
   */
  async create(data: {
    nombreOriginal: string;
    storageId: string;
    mimeType: string;
    tamañoBytes: number;
    autorId: number;
  }): Promise<Documento> {
    const doc = this.documentoRepository.create({
      nombreOriginal: data.nombreOriginal,
      storageId: data.storageId,
      mimeType: data.mimeType,
      tamañoBytes: data.tamañoBytes,
      autorId: data.autorId,
    });
    return this.documentoRepository.save(doc);
  }

  /**
   * Retorna todo el historial de documentos
   */
  async findAll(): Promise<Documento[]> {
    return this.documentoRepository.find({
      order: { creadoEn: 'DESC' },
    });
  }

  /**
   * Retorna la info de un documento para que el Gateway haga la descarga.
   */
  async getFileInfo(id: number): Promise<{ storageId: string; originalName: string }> {
    const doc = await this.documentoRepository.findOne({ where: { id } });
    if (!doc) {
      throw new RpcException({ statusCode: 404, message: 'Documento no encontrado' });
    }

    return { storageId: doc.storageId, originalName: doc.nombreOriginal };
  }
}
