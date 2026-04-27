import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  OneToMany,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { Area } from '../areas/area.entity';

/**
 * Entidad Contratista - HU-01
 * Representa a las empresas contratistas que gestionan documentos en el sistema.
 * Incluye campos de auditoría para trazabilidad (RF3.2).
 * Usa soft delete para mantener historial (CA-4).
 */
@Entity('contratistas')
export class Contratista {
  @ApiProperty({ description: 'ID único del contratista', example: 1 })
  @PrimaryGeneratedColumn()
  id: number;

  @ApiProperty({ description: 'Nombre o razón social del contratista', example: 'Constructora Sur SpA' })
  @Column({ length: 255 })
  nombre: string;

  @ApiProperty({ description: 'RUT del contratista', example: '76.123.456-7' })
  @Column({ length: 12, unique: true })
  rut: string;

  @ApiProperty({ description: 'Email de contacto', example: 'contacto@constructorasur.cl' })
  @Column({ length: 255 })
  email: string;

  @ApiProperty({ description: 'Teléfono de contacto', example: '+56912345678' })
  @Column({ length: 20, nullable: true })
  telefono: string;

  @ApiProperty({ description: 'Estado activo/inactivo', example: true })
  @Column({ default: true })
  activo: boolean;

  // --- Campos de Auditoría (RF3.2) ---

  @ApiProperty({ description: 'Usuario que creó el registro' })
  @Column({ default: 'sistema' })
  creadoPor: string;

  @ApiProperty({ description: 'Usuario que actualizó el registro por última vez' })
  @Column({ default: 'sistema' })
  actualizadoPor: string;

  @ApiProperty({ description: 'Fecha de creación' })
  @CreateDateColumn()
  creadoEn: Date;

  @ApiProperty({ description: 'Fecha de última actualización' })
  @UpdateDateColumn()
  actualizadoEn: Date;

  @ApiProperty({ description: 'Fecha de eliminación (soft delete)', required: false })
  @DeleteDateColumn()
  eliminadoEn: Date;

  @OneToMany(() => Area, area => area.contratista)
  areas: Area[];
}
