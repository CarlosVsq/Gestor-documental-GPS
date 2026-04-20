import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, DeleteDateColumn, ManyToOne, JoinColumn, OneToMany } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { Contratista } from '../../contratistas/contratista.entity';
import { Proyecto } from '../../proyectos/entities/proyecto.entity';

@Entity('areas')
export class Area {
  @ApiProperty({ description: 'ID único del área', example: 1 })
  @PrimaryGeneratedColumn()
  id: number;

  @ApiProperty({ description: 'Nombre del área', example: 'Recursos Humanos' })
  @Column({ length: 255 })
  nombre: string;

  @ApiProperty({ description: 'Descripción del área', example: 'Área encargada de personal' })
  @Column({ type: 'text', nullable: true })
  descripcion: string;

  @ApiProperty({ description: 'ID del contratista al que pertenece' })
  @Column()
  contratista_id: number;

  @ManyToOne(() => Contratista, contratista => contratista.areas, { nullable: false })
  @JoinColumn({ name: 'contratista_id' })
  contratista: Contratista;

  @OneToMany(() => Proyecto, proyecto => proyecto.area)
  proyectos: Proyecto[];

  // --- Campos de Auditoría ---
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
