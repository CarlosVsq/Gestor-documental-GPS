import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { Area } from '../../areas/entities/area.entity';

/**
 * Entidad Proyecto (Stub básico para HU2)
 */
@Entity('proyectos')
export class Proyecto {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 255 })
  nombre: string;

  @Column()
  area_id: number;

  @ManyToOne(() => Area, area => area.proyectos, { nullable: false })
  @JoinColumn({ name: 'area_id' })
  area: Area;
}
