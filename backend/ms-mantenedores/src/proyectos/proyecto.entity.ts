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
import { Area } from '../areas/area.entity';

import { Index } from 'typeorm';

/**
 * Entidad Proyecto - HU-03
 * Representa un proyecto vinculado a un Área.
 * Mantiene la jerarquía: Contratista → Área → Proyecto (RF1.2).
 * Usa soft delete para mantener historial.
 */
@Entity('proyectos')
@Index('idx_proyectos_estado', ['estadoProyecto'], { where: '"estadoProyecto" != \'Finalizado\'' })
@Index('idx_proyectos_ubicacion', ['ubicacion'])
export class Proyecto {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ length: 255 })
    nombre: string;

    @Column({ length: 50, unique: true })
    codigo: string;

    @Column({ type: 'date' })
    fechaInicio: Date;

    @Column({ type: 'date' })
    fechaFin: Date;

    @Column()
    areaId: number;

    @Column({ length: 255, nullable: true })
    ubicacion: string;

    @Column({ type: 'decimal', precision: 14, scale: 2, nullable: true, default: null })
    presupuestoEstimado: number;

    @Column({ type: 'integer', nullable: true, default: null })
    horasHombre: number;

    @Column({ length: 50, default: 'Ejecución' })
    estadoProyecto: 'En Licitación' | 'Ejecución' | 'Finalizado' | 'Suspendido';

    @Column({ default: true })
    activo: boolean;

    // --- Relación con Área ---
    @ManyToOne(() => Area, area => area.proyectos, { onDelete: 'RESTRICT' })
    @JoinColumn({ name: 'areaId' })
    area: Area;

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
