import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    UpdateDateColumn,
} from 'typeorm';

export enum EstadoRequerimiento {
    ABIERTO = 'Abierto',
    EN_PROGRESO = 'En Progreso',
    CERRADO = 'Cerrado',
}

@Entity('requerimientos')
export class Requerimiento {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ length: 255 })
    titulo: string;

    @Column({ type: 'text', nullable: true })
    descripcion: string;

    @Column({
        type: 'varchar',
        length: 50,
        default: EstadoRequerimiento.ABIERTO,
    })
    estado: EstadoRequerimiento;

    // --- Jerarquía ---
    @Column()
    proyectoId: number;

    @Column()
    areaId: number;

    @Column()
    contratistaId: number;

    // --- Taxonomía ---
    @Column()
    categoriaId: number;

    @Column()
    subtipoId: number;

    // --- Campos de Auditoría ---
    @Column({ default: 'sistema' })
    creadoPor: string;

    @Column({ default: 'sistema' })
    actualizadoPor: string;

    @CreateDateColumn()
    creadoEn: Date;

    @UpdateDateColumn()
    actualizadoEn: Date;
}
