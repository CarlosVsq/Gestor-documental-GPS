import { Injectable } from '@nestjs/common';
import { RpcException } from '@nestjs/microservices';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Documento } from './entities/documento.entity';
import { EstadoDocumento } from '../common/constants';

export interface SearchFiltros {
  requerimientoId?: number;
  contratistaId?: number;
  proyectoId?: number;
  areaId?: number;
  categoriaId?: number;
  estadoDocumento?: EstadoDocumento;
  mimeType?: string;
  autorId?: number;
  q?: string;           // búsqueda por texto parcial en nombreOriginal
  page?: number;
  limit?: number;
}

/**
 * DocumentosRepository — Encapsula todas las queries complejas.
 * Siguiendo el Repository Pattern (NestJS best practice arch-use-repository-pattern)
 * para mantener DocumentosService enfocado en lógica de negocio.
 */
@Injectable()
export class DocumentosRepository {
  constructor(
    @InjectRepository(Documento)
    private readonly repo: Repository<Documento>,
    private readonly dataSource: DataSource,
  ) {}

  async save(doc: Partial<Documento>): Promise<Documento> {
    return this.repo.save(doc as Documento);
  }

  async findById(id: number): Promise<Documento | null> {
    return this.repo.findOne({ where: { id } });
  }

  async findByNombreStorage(nombreStorage: string): Promise<Documento | null> {
    return this.repo.findOne({ where: { nombreStorage } });
  }

  async findByRequerimiento(requerimientoId: number): Promise<Documento[]> {
    return this.repo.find({
      where: { requerimientoId },
      order: { version: 'DESC', creadoEn: 'DESC' },
    });
  }

  async softDelete(id: number): Promise<void> {
    await this.repo.softDelete(id);
  }

  /**
   * Búsqueda avanzada por metadatos.
   * La herencia de metadatos (contratistaId, proyectoId, etc.) se obtiene
   * mediante JOIN con la tabla requerimientos — sin duplicar datos.
   */
  async search(filtros: SearchFiltros): Promise<{ data: any[]; total: number }> {
    const page = filtros.page || 1;
    const limit = Math.min(filtros.limit || 20, 100);
    const offset = (page - 1) * limit;

    const query = this.dataSource
      .createQueryBuilder()
      .select([
        'd.id               AS id',
        'd."nombreOriginal" AS "nombreOriginal"',
        'd."nombreStorage"  AS "nombreStorage"',
        'd."pathSeaweed"    AS "pathSeaweed"',
        'd."mimeType"       AS "mimeType"',
        'd."tamañoBytes"    AS "tamañoBytes"',
        'd."sha256Hash"     AS "sha256Hash"',
        'd."requerimientoId" AS "requerimientoId"',
        'd."estadoDocumento" AS "estadoDocumento"',
        'd.version          AS version',
        'd."autorId"        AS "autorId"',
        'd."creadoPor"      AS "creadoPor"',
        'd."creadoEn"       AS "creadoEn"',
        // Herencia de metadatos del requerimiento padre
        'r."codigoTicket"   AS "codigoTicket"',
        'r."titulo"         AS "tituloRequerimiento"',
        'r."proyectoId"     AS "proyectoId"',
        'r."areaId"         AS "areaId"',
        'r."contratistaId"  AS "contratistaId"',
        'r."categoriaId"    AS "categoriaId"',
        'r."subtipoId"      AS "subtipoId"',
      ])
      .from('documentos', 'd')
      .innerJoin('requerimientos', 'r', 'r.id = d."requerimientoId"')
      .where('d."eliminadoEn" IS NULL');

    // Filtros dinámicos
    if (filtros.requerimientoId) {
      query.andWhere('d."requerimientoId" = :reqId', { reqId: filtros.requerimientoId });
    }
    if (filtros.contratistaId) {
      query.andWhere('r."contratistaId" = :cId', { cId: filtros.contratistaId });
    }
    if (filtros.proyectoId) {
      query.andWhere('r."proyectoId" = :pId', { pId: filtros.proyectoId });
    }
    if (filtros.areaId) {
      query.andWhere('r."areaId" = :aId', { aId: filtros.areaId });
    }
    if (filtros.categoriaId) {
      query.andWhere('r."categoriaId" = :catId', { catId: filtros.categoriaId });
    }
    if (filtros.estadoDocumento) {
      query.andWhere('d."estadoDocumento" = :estado', { estado: filtros.estadoDocumento });
    }
    if (filtros.mimeType) {
      query.andWhere('d."mimeType" ILIKE :mime', { mime: `%${filtros.mimeType}%` });
    }
    if (filtros.autorId) {
      query.andWhere('d."autorId" = :autId', { autId: filtros.autorId });
    }
    if (filtros.q) {
      query.andWhere('d."nombreOriginal" ILIKE :q', { q: `%${filtros.q}%` });
    }

    const total = await query.getCount();
    const data = await query.orderBy('d."creadoEn"', 'DESC').limit(limit).offset(offset).getRawMany();

    return { data, total };
  }

  /**
   * Árbol jerárquico: contratistas → áreas → proyectos → requerimientos con conteo de docs
   */
  async getTree(): Promise<any[]> {
    const rows = await this.dataSource.query(`
      SELECT
        r."contratistaId",
        c.nombre AS "contratistaNombre",
        r."areaId",
        a.nombre AS "areaNombre",
        r."proyectoId",
        p.nombre AS "proyectoNombre",
        r.id AS "requerimientoId",
        r."codigoTicket",
        r.titulo,
        COUNT(d.id)::int AS "totalDocumentos"
      FROM requerimientos r
      LEFT JOIN contratistas c ON c.id = r."contratistaId" AND c."eliminadoEn" IS NULL
      LEFT JOIN areas a ON a.id = r."areaId" AND a."eliminadoEn" IS NULL
      LEFT JOIN proyectos p ON p.id = r."proyectoId" AND p."eliminadoEn" IS NULL
      LEFT JOIN documentos d ON d."requerimientoId" = r.id AND d."eliminadoEn" IS NULL
      WHERE r."eliminadoEn" IS NULL
      GROUP BY r."contratistaId", c.nombre, r."areaId", a.nombre, r."proyectoId", p.nombre, r.id, r."codigoTicket", r.titulo
      ORDER BY r."contratistaId", r."areaId", r."proyectoId", r."codigoTicket"
    `);
    return rows;
  }

  /**
   * Cuenta documentos de un requerimiento (para actualizar totalDocumentos)
   */
  async countByRequerimiento(requerimientoId: number): Promise<number> {
    return this.repo.count({ where: { requerimientoId } });
  }

  /**
   * Actualiza el estado de un documento directamente en la base de datos.
   */
  async updateEstado(id: number, estado: EstadoDocumento): Promise<void> {
    await this.repo.update(id, { estadoDocumento: estado });
  }
}
