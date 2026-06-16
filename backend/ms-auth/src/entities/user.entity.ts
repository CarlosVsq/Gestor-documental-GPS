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
import { Exclude } from 'class-transformer';
import { Role } from '../common/constants';
import { RoleEntity } from './role.entity';

/**
 * Entidad User — HU-25 / HU-17
 * Representa a los usuarios del sistema con sus credenciales y rol.
 * Usa soft delete para mantener historial.
 * 
 * HU-17: Se agrega roleId (FK a tabla roles) además del campo `rol` (string)
 * para compatibilidad. El campo `rol` se mantiene sincronizado con el nombre
 * del RoleEntity asociado.
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

  @Column({ nullable: true })
  roleId: number;

  @ManyToOne(() => RoleEntity, (role) => role.usuarios, { nullable: true })
  @JoinColumn({ name: 'roleId' })
  roleEntity: RoleEntity;

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
