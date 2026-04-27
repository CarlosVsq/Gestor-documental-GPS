import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    UpdateDateColumn,
    DeleteDateColumn,
    ManyToOne,
    JoinColumn,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { Area } from '../areas/area.entity';

/**
 * Entidad Proyecto - HU-03
 * Representa un proyecto vinculado a un Área.
 * Mantiene la jerarquía: Contratista → Área → Proyecto (RF1.2).
 * Usa soft delete para mantener historial.
 */
@Entity('proyectos')
export class Proyecto {
    @ApiProperty({ description: 'ID único del proyecto', example: 1 })
    @PrimaryGeneratedColumn()
    id: number;

    @ApiProperty({ description: 'Nombre del proyecto', example: 'Proyecto Puente Norte' })
    @Column({ length: 255 })
    nombre: string;

    @ApiProperty({ description: 'Código único del proyecto', example: 'PRY-001' })
    @Column({ length: 50, unique: true })
    codigo: string;

    @ApiProperty({ description: 'Fecha de inicio del proyecto', example: '2026-05-01' })
    @Column({ type: 'date' })
    fechaInicio: Date;

    @ApiProperty({ description: 'Fecha de fin del proyecto', example: '2026-12-31' })
    @Column({ type: 'date' })
    fechaFin: Date;

    @ApiProperty({ description: 'ID del área asociada', example: 1 })
    @Column()
    areaId: number;

    @ApiProperty({ description: 'Estado activo/inactivo', example: true })
    @Column({ default: true })
    activo: boolean;

    // --- Relación con Área ---
    @ManyToOne(() => Area, area => area.proyectos, { onDelete: 'RESTRICT' })
    @JoinColumn({ name: 'areaId' })
    area: Area;

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
}
