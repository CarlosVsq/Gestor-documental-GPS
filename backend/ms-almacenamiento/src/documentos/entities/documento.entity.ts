import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  Index,
} from 'typeorm';
import { EstadoDocumento } from '../../common/constants';

/**
 * Entidad Documento — ms-almacenamiento
 *
 * Evolución de la entidad anterior (ms-documentos). Ahora almacena el
 * path completo en SeaweedFS Filer, hash SHA-256 para ISO 30300,
 * versión del documento, estado del ciclo de vida y audit trail JSONB.
 *
 * NOTA: La "herencia de metadatos" (Contratista, Área, Proyecto, Categoría)
 * se obtiene mediante JOIN con la tabla `requerimientos` al consultar.
 * No se duplican datos aquí para mantener consistencia automática.
 */
@Entity('documentos')
export class Documento {
  @PrimaryGeneratedColumn()
  id: number;

  // ─── Identidad del archivo ─────────────────────────────────────────────
  @Column({ type: 'varchar', length: 255 })
  nombreOriginal: string;

  @Index({ unique: true })
  @Column({ type: 'varchar', length: 255 })
  nombreStorage: string;           // UUID-timestamp.ext (key en SeaweedFS)

  @Column({ type: 'text' })
  pathSeaweed: string;             // /{contratistaId}/{areaId}/{proyectoId}/{codigoTicket}/{file}

  @Column({ type: 'varchar', length: 100 })
  mimeType: string;

  @Column({ type: 'bigint' })
  tamañoBytes: number;

  @Column({ type: 'char', length: 64, nullable: true })
  sha256Hash: string;              // Huella digital para inmutabilidad ISO 30300

  // ─── Relación con Requerimiento (expediente padre) ────────────────────
  @Index()
  @Column({ type: 'int' })
  requerimientoId: number;

  // ─── Ciclo de vida ─────────────────────────────────────────────────────
  @Index()
  @Column({
    type: 'varchar',
    length: 20,
    default: EstadoDocumento.BORRADOR,
  })
  estadoDocumento: EstadoDocumento;

  @Column({ type: 'int', default: 1 })
  version: number;

  // ─── Auditoría ─────────────────────────────────────────────────────────
  /**
   * Guarda IP, User-Agent y opcionalmente geolocalización del upload.
   * Estructura: { ip: string, userAgent: string, lat?: number, lng?: number }
   */
  @Column({ type: 'jsonb', nullable: true })
  metadataAudit: Record<string, any>;

  @Index()
  @Column({ type: 'int' })
  autorId: number;

  @Column({ type: 'varchar', length: 255, default: 'sistema' })
  creadoPor: string;

  @Column({ type: 'varchar', length: 255, default: 'sistema' })
  actualizadoPor: string;

  @CreateDateColumn()
  creadoEn: Date;

  @UpdateDateColumn()
  actualizadoEn: Date;

  @DeleteDateColumn()              // Soft delete — dato nunca se pierde
  eliminadoEn: Date;
}
