import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Unique,
} from 'typeorm';
import { RoleEntity } from './role.entity';
import { PermissionEntity } from './permission.entity';

/**
 * Tabla pivot role_permissions — HU-17
 * Vincula roles con permisos granulares.
 */
@Entity('role_permissions')
@Unique(['roleId', 'permissionId'])
export class RolePermission {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  roleId: number;

  @Column()
  permissionId: number;

  @ManyToOne(() => RoleEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'roleId' })
  role: RoleEntity;

  @ManyToOne(() => PermissionEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'permissionId' })
  permission: PermissionEntity;

  @CreateDateColumn()
  creadoEn: Date;
}
