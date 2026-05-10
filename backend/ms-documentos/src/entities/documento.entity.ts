import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

/**
 * Entidad Documento — Desacoplada de User entity.
 * Usa autorId como número plano en lugar de @ManyToOne a User,
 * ya que User vive en ms-auth. La FK se mantiene a nivel de BD.
 */
@Entity('documentos')
export class Documento {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 255 })
  nombreOriginal: string;

  @Column({ length: 255 })
  storageId: string;

  @Column({ length: 100 })
  mimeType: string;

  @Column('int')
  tamañoBytes: number;

  @Column({ name: 'autorId' })
  autorId: number;

  @CreateDateColumn()
  creadoEn: Date;
}
