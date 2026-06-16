import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
} from 'typeorm';
import { AccionAuditoria } from '../../common/constants';

const JSON_COLUMN_TYPE = process.env.DB_HOST ? 'jsonb' : 'simple-json';

@Entity('auditoria')
export class Auditoria {
  @PrimaryGeneratedColumn()
  id: number;

  @Index()
  @Column({ type: 'varchar', length: 20, update: false })
  accion: AccionAuditoria;

  @Index()
  @Column({ type: 'varchar', length: 60, update: false })
  entidad: string;

  @Column({ type: 'int', nullable: true, update: false })
  entidadId: number | null;

  @Index()
  @Column({ type: 'int', nullable: true, update: false })
  requerimientoId: number | null;

  @Index()
  @Column({ type: 'int', nullable: true, update: false })
  usuarioId: number | null;

  @Column({ type: 'varchar', length: 255, nullable: true, update: false })
  usuarioEmail: string | null;

  @Column({ type: 'varchar', length: 40, nullable: true, update: false })
  usuarioRol: string | null;

  @Column({ type: 'varchar', length: 10, nullable: true, update: false })
  metodoHttp: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true, update: false })
  ruta: string | null;

  @Column({ type: 'int', nullable: true, update: false })
  statusCode: number | null;

  @Column({ type: 'varchar', length: 60, nullable: true, update: false })
  ip: string | null;

  @Column({ type: 'varchar', length: 512, nullable: true, update: false })
  userAgent: string | null;

  @Column({ type: JSON_COLUMN_TYPE, nullable: true, update: false })
  datosAntes: Record<string, any> | null;

  @Column({ type: JSON_COLUMN_TYPE, nullable: true, update: false })
  datosDespues: Record<string, any> | null;

  @CreateDateColumn({ update: false })
  timestamp: Date;
}
