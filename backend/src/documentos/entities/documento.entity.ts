import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { User } from '../../auth/entities/user.entity';

@Entity('documentos')
export class Documento {
  @ApiProperty({ description: 'ID único del documento', example: 1 })
  @PrimaryGeneratedColumn()
  id: number;

  @ApiProperty({ description: 'Nombre original del archivo', example: 'plano.pdf' })
  @Column({ length: 255 })
  nombreOriginal: string;

  @ApiProperty({ description: 'ID o nombre interno de almacenamiento local', example: 'doc_12345.pdf' })
  @Column({ length: 255 })
  storageId: string;

  @ApiProperty({ description: 'Tipo MIME del archivo', example: 'application/pdf' })
  @Column({ length: 100 })
  mimeType: string;

  @ApiProperty({ description: 'Tamaño en bytes', example: 102400 })
  @Column('int')
  tamañoBytes: number;

  @ApiProperty({ description: 'Usuario que subió el documento' })
  @ManyToOne(() => User)
  @JoinColumn({ name: 'autorId' })
  autor: User;

  @ApiProperty({ description: 'Fecha de creación' })
  @CreateDateColumn()
  creadoEn: Date;
}
