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

/**
 * Entidad Proyecto - HU-03
 * Representa un proyecto vinculado a un Área.
 * Mantiene la jerarquía: Contratista → Área → Proyecto (RF1.2).
 * Usa soft delete para mantener historial.
 */
@Entity('proyectos')
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
