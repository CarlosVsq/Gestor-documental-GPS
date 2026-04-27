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
import { ApiProperty } from '@nestjs/swagger';
import { Contratista } from '../contratistas/contratista.entity';
import { Proyecto } from '../proyectos/proyecto.entity';

/**
 * Entidad Área - HU-02
 * Usa soft delete para mantener historial.
 */
@Entity('areas')
export class Area {
    @ApiProperty({ description: 'ID único del área', example: 1 })
    @PrimaryGeneratedColumn()
    id: number;

    @ApiProperty({ description: 'Nombre del área', example: 'Área de Ingeniería' })
    @Column({ length: 255 })
    nombre: string;

    @ApiProperty({ description: 'Descripción del área', example: 'Área encargada de los proyectos de ingeniería', required: false })
    @Column({ type: 'text', nullable: true })
    descripcion: string;

    @ApiProperty({ description: 'ID del contratista asociado', example: 1 })
    @Column()
    contratistaId: number;

    @ApiProperty({ description: 'Estado activo/inactivo', example: true })
    @Column({ default: true })
    activo: boolean;

    // --- Relaciones ---

    @ManyToOne(() => Contratista, { onDelete: 'RESTRICT' })
    @JoinColumn({ name: 'contratistaId' })
    contratista: Contratista;

    // Relación inversa para verificar dependencias antes de eliminar
    @OneToMany(() => Proyecto, (proyecto) => proyecto.area)
    proyectos: Proyecto[];

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
