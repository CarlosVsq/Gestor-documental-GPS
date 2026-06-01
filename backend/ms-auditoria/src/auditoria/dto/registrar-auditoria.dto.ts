import {
  IsEnum,
  IsInt,
  IsObject,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';
import { AccionAuditoria } from '../../common/constants';

export class RegistrarAuditoriaDto {
  @IsEnum(AccionAuditoria)
  accion: AccionAuditoria;

  @IsString()
  @MaxLength(60)
  entidad: string;

  @IsOptional()
  @IsInt()
  entidadId?: number;

  @IsOptional()
  @IsInt()
  requerimientoId?: number;

  @IsOptional()
  @IsInt()
  usuarioId?: number;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  usuarioEmail?: string;

  @IsOptional()
  @IsString()
  @MaxLength(40)
  usuarioRol?: string;

  @IsOptional()
  @IsString()
  @MaxLength(10)
  metodoHttp?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  ruta?: string;

  @IsOptional()
  @IsInt()
  statusCode?: number;

  @IsOptional()
  @IsString()
  @MaxLength(60)
  ip?: string;

  @IsOptional()
  @IsString()
  @MaxLength(512)
  userAgent?: string;

  @IsOptional()
  @IsObject()
  datosAntes?: Record<string, any>;

  @IsOptional()
  @IsObject()
  datosDespues?: Record<string, any>;
}
