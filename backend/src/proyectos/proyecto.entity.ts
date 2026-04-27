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

/**
 * Entidad Proyecto - HU-03 (STUB)
 *
 * Entidad mínima para soportar la validación de dependencias en el módulo de Áreas.
 * La persona que implemente HU-03 debe ampliar esta entidad con los campos completos:
 *   - codigo: string (único)
 *   - fecha_inicio: Date
 *   - fecha_fin: Date
 *   - Y crear el Controller + Service con CRUD completo.
 *
 * Parte de la jerarquía: Contratista → Área → Proyecto (RF1.2).
 */
@Entity('proyectos')
export class Proyecto {
    @ApiProperty({ description: 'ID único del proyecto', example: 1 })
    @PrimaryGeneratedColumn()
    id: number;

    @ApiProperty({ description: 'Nombre del proyecto', example: 'Proyecto Puente Norte' })
    @Column({ length: 255 })
    nombre: string;

    @ApiProperty({ description: 'ID del área asociada', example: 1 })
    @Column()
    areaId: number;

    // --- Relación con Área ---
    @ManyToOne('Area', 'proyectos', { onDelete: 'RESTRICT' })
    @JoinColumn({ name: 'areaId' })
    area: any;

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
}
