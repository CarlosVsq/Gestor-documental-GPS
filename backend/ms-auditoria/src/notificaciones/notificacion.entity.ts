import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
} from 'typeorm';
import { TipoNotificacion } from '../common/constants';

const JSON_COLUMN_TYPE = process.env.DB_HOST ? 'jsonb' : 'simple-json';

/**
 * Entidad Notificacion — HU-34/HU-35
 * 
 * Almacena notificaciones para usuarios del sistema.
 * - HU-34: Supervisores notificados cuando se sube un documento.
 * - HU-35: Colaboradores notificados cuando cambia el estado de un requerimiento.
 * 
 * El campo `leida` permite el badge de "no leídas".
 * El campo `entidadId` permite click → navegar directamente al recurso.
 */
@Entity('notificaciones')
export class Notificacion {
  @PrimaryGeneratedColumn()
  id: number;

  /** ID del usuario destinatario de la notificación */
  @Index()
  @Column({ type: 'int' })
  usuarioDestinoId: number;

  /** Tipo de notificación para renderizado en frontend */
  @Column({ type: 'varchar', length: 30 })
  tipo: TipoNotificacion;

  /** Título corto para la lista de notificaciones */
  @Column({ type: 'varchar', length: 200 })
  titulo: string;

  /** Mensaje descriptivo */
  @Column({ type: 'text', nullable: true })
  mensaje: string;

  /** Entidad relacionada (ej: 'documentos', 'requerimientos') */
  @Column({ type: 'varchar', length: 60, nullable: true })
  entidad: string;

  /** ID de la entidad para navegación directa (click → documento/requerimiento) */
  @Column({ type: 'int', nullable: true })
  entidadId: number;

  /** ID del requerimiento relacionado (para contexto adicional) */
  @Index()
  @Column({ type: 'int', nullable: true })
  requerimientoId: number;

  /** ¿El usuario ya leyó esta notificación? */
  @Index()
  @Column({ type: 'boolean', default: false })
  leida: boolean;

  /** Cuándo se marcó como leída */
  @Column({ type: 'timestamp', nullable: true })
  leidaEn: Date;

  /** Datos adicionales (metadata del evento) */
  @Column({ type: JSON_COLUMN_TYPE, nullable: true })
  metadata: Record<string, any>;

  @CreateDateColumn()
  creadaEn: Date;
}
