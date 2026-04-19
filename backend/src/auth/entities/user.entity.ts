import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { Role } from '../enums/role.enum';
import { Exclude } from 'class-transformer';

/**
 * Entidad User — HU-25
 * Representa a los usuarios del sistema con sus credenciales y rol.
 * Usa soft delete para mantener historial.
 */
@Entity('usuarios')
export class User {
  @ApiProperty({ description: 'ID único del usuario', example: 1 })
  @PrimaryGeneratedColumn()
  id: number;

  @ApiProperty({ description: 'Nombre completo del usuario', example: 'Administrador SGD' })
  @Column({ length: 255 })
  nombre: string;

  @ApiProperty({ description: 'Email del usuario (único)', example: 'admin@sgd.cl' })
  @Column({ length: 255, unique: true })
  email: string;

  @Exclude()
  @Column({ length: 255 })
  password: string;

  @ApiProperty({ description: 'Rol del usuario', enum: Role, example: Role.ADMIN })
  @Column({ type: 'varchar', default: Role.ADMIN })
  rol: Role;

  @ApiProperty({ description: 'Estado activo/inactivo', example: true })
  @Column({ default: true })
  activo: boolean;

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
