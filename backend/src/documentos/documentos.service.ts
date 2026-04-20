import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Documento } from './entities/documento.entity';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Servicio Documentos — HU: Colaborador/Editor
 * Maneja la lógica de negocio para la tabla de documentos y operaciones con el sistema de archivos local.
 */
@Injectable()
export class DocumentosService {
  constructor(
    @InjectRepository(Documento)
    private readonly documentoRepository: Repository<Documento>,
  ) {}

  /**
   * Registra un nuevo documento en la base de datos tras ser subido.
   */
  async create(file: Express.Multer.File, autorId: number): Promise<Documento> {
    const doc = this.documentoRepository.create({
      nombreOriginal: file.originalname,
      storageId: file.filename,
      mimeType: file.mimetype,
      tamañoBytes: file.size,
      autor: { id: autorId },
    });
    return this.documentoRepository.save(doc);
  }

  /**
   * Retorna todo el historial de documentos
   */
  async findAll(): Promise<Documento[]> {
    return this.documentoRepository.find({
      relations: ['autor'],
      order: { creadoEn: 'DESC' },
    });
  }

  /**
   * Encuentra un documento y retorna su ruta absoluta local para descarga
   */
  async getFilePathConfig(id: number): Promise<{ filePath: string; originalName: string }> {
    const doc = await this.documentoRepository.findOne({ where: { id } });
    if (!doc) {
      throw new NotFoundException('Documento no encontrado en PostgreSQL');
    }

    const filePath = path.join(process.cwd(), 'uploads', doc.storageId);
    if (!fs.existsSync(filePath)) {
      throw new NotFoundException('El archivo físico no se encuentra en el disco');
    }

    return { filePath, originalName: doc.nombreOriginal };
  }
}
