import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    UpdateDateColumn,
    DeleteDateColumn,
    ManyToOne,
    OneToMany,
    JoinColumn,
} from 'typeorm';
import { Contratista } from '../contratistas/contratista.entity';
import { Proyecto } from '../proyectos/proyecto.entity';

/**
 * Entidad Área - HU-02
 * Usa soft delete para mantener historial.
 */
@Entity('areas')
export class Area {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ length: 255 })
    nombre: string;

    @Column({ type: 'text', nullable: true })
    descripcion: string;

    @Column()
    contratistaId: number;

    @Column({ default: true })
    activo: boolean;

    // --- Relaciones ---

    @ManyToOne(() => Contratista, { onDelete: 'RESTRICT' })
    @JoinColumn({ name: 'contratistaId' })
    contratista: Contratista;

    @OneToMany(() => Proyecto, (proyecto) => proyecto.area)
    proyectos: Proyecto[];

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
