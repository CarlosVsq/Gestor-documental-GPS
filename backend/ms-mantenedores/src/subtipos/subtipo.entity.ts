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
import { Categoria } from '../categorias/categoria.entity';

@Entity('subtipos')
export class Subtipo {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ length: 255 })
    nombre: string;

    @Column({ type: 'text', nullable: true })
    descripcion: string;

    @Column()
    categoriaId: number;

    @Column({ default: true })
    activo: boolean;

    // --- Relaciones ---
    @ManyToOne(() => Categoria, (categoria) => categoria.subtipos, { onDelete: 'RESTRICT' })
    @JoinColumn({ name: 'categoriaId' })
    categoria: Categoria;

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
