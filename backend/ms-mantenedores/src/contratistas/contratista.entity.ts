import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  OneToMany,
} from 'typeorm';
import { Area } from '../areas/area.entity';

import { Index } from 'typeorm';

/**
 * Entidad Contratista - HU-01
 * Representa a las empresas contratistas que gestionan documentos en el sistema.
 * Incluye campos de auditoría para trazabilidad (RF3.2).
 * Usa soft delete para mantener historial (CA-4).
 */
@Entity('contratistas')
@Index('idx_contratistas_permisosObjectFS', ['permisosObjectFS'], { where: '"permisosObjectFS" IS NOT NULL' })
export class Contratista {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 255 })
  nombre: string;

  @Column({ length: 12, unique: true })
  rut: string;

  @Column({ length: 255 })
  email: string;

  @Column({ length: 20, nullable: true })
  telefono: string;

  @Column({ default: true })
  activo: boolean;

  // --- Integración Object File System ---
  @Column({
    type: 'varchar',
    length: 50,
    default: 'read_write',
    nullable: true,
  })
  permisosObjectFS: 'read' | 'write' | 'read_write' | 'admin' | null;

  // --- Campos de Auditoría (RF3.2) ---

  @Column({ default: 'sistema' })
  creadoPor: string;

  @Column({ default: 'sistema' })
  actualizadoPor: string;

  @CreateDateColumn()
  creadoEn: Date;

  @UpdateDateColumn()
  actualizadoEn: Date;

  @DeleteDateColumn()
  eliminadoEn: Date;

  @OneToMany(() => Area, area => area.contratista)
  areas: Area[];
}
