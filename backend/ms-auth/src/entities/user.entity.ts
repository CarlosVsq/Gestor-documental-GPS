import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
} from 'typeorm';
import { Exclude } from 'class-transformer';
import { Role } from '../common/constants';

/**
 * Entidad User — HU-25
 * Representa a los usuarios del sistema con sus credenciales y rol.
 * Usa soft delete para mantener historial.
 */
@Entity('usuarios')
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 255 })
  nombre: string;

  @Column({ length: 255, unique: true })
  email: string;

  @Exclude()
  @Column({ length: 255 })
  password: string;

  @Column({ type: 'varchar', default: Role.ADMIN })
  rol: Role;

  @Column({ default: true })
  activo: boolean;

  @Column({ nullable: true })
  contratistaId: number;

  @CreateDateColumn()
  creadoEn: Date;

  @UpdateDateColumn()
  actualizadoEn: Date;

  @DeleteDateColumn()
  eliminadoEn: Date;
}
