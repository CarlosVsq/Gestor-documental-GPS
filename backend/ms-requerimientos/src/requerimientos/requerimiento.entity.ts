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

export enum PrioridadRequerimiento {
    BAJA = 'BAJA',
    MEDIA = 'MEDIA',
    ALTA = 'ALTA',
    CRITICA = 'CRITICA',
}

@Entity('requerimientos')
export class Requerimiento {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ length: 50, unique: true })
    codigoTicket: string;

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

    @Column({
        type: 'varchar',
        length: 20,
        default: PrioridadRequerimiento.MEDIA,
    })
    prioridad: PrioridadRequerimiento;

    @Column({ type: 'timestamp', nullable: true })
    fechaVencimiento: Date;

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

    // --- Actores ---
    @Column({ nullable: true })
    usuarioCreadorId: number;

    @Column({ nullable: true })
    asignadoAId: number;

    // --- Storage ---
    // TODO: Implementar aquí la lógica de los campos storage y total_documentos cuando corresponda
    @Column({ type: 'varchar', length: 500, nullable: true })
    storagePath: string;

    @Column({ type: 'int', default: 0 })
    totalDocumentos: number;

    // --- Auditoría y Cierre ---
    @Column({ type: 'timestamp', nullable: true })
    fechaCierre: Date;

    @Column({ type: 'text', nullable: true })
    motivoRechazo: string;

    @Column({ default: 'sistema' })
    creadoPor: string;

    @Column({ default: 'sistema' })
    actualizadoPor: string;

    @CreateDateColumn()
    creadoEn: Date;

    @UpdateDateColumn()
    actualizadoEn: Date;
}
