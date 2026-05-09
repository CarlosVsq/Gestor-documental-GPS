import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    UpdateDateColumn,
    DeleteDateColumn,
    OneToMany,
} from 'typeorm';
import { Subtipo } from '../subtipos/subtipo.entity';

@Entity('categorias')
export class Categoria {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ length: 255, unique: true })
    nombre: string;

    @Column({ type: 'text', nullable: true })
    descripcion: string;

    @Column({ default: true })
    activo: boolean;

    // --- Relaciones ---
    @OneToMany(() => Subtipo, (subtipo) => subtipo.categoria)
    subtipos: Subtipo[];

    // --- Campos de Auditoría ---
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
