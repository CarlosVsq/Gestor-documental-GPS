import { IsString, IsNumber, IsOptional, IsEnum, Min, IsObject } from 'class-validator';
import { EstadoDocumento } from '../../common/constants';

export class CreateDocumentoDto {
  @IsString()
  nombreOriginal: string;

  @IsString()
  mimeType: string;

  @IsNumber()
  @Min(1)
  tamañoBytes: number;

  @IsNumber()
  @Min(1)
  requerimientoId: number;

  @IsNumber()
  @Min(1)
  autorId: number;

  @IsString()
  creadoPor: string;

  // Buffer serializado como base64 string (TCP no soporta Buffer directamente)
  @IsString()
  fileBase64: string;

  @IsOptional()
  @IsObject()
  metadataAudit?: {
    ip?: string;
    userAgent?: string;
    lat?: number;
    lng?: number;
  };
}

export class BulkUploadDto {
  files: CreateDocumentoDto[];
}

export class SearchDocumentosDto {
  @IsOptional()
  @IsNumber()
  requerimientoId?: number;

  @IsOptional()
  @IsNumber()
  contratistaId?: number;

  @IsOptional()
  @IsNumber()
  proyectoId?: number;

  @IsOptional()
  @IsNumber()
  areaId?: number;

  @IsOptional()
  @IsNumber()
  categoriaId?: number;

  @IsOptional()
  @IsEnum(EstadoDocumento)
  estadoDocumento?: EstadoDocumento;

  @IsOptional()
  @IsString()
  mimeType?: string;

  @IsOptional()
  @IsNumber()
  autorId?: number;

  @IsOptional()
  @IsString()
  q?: string;

  @IsOptional()
  @IsNumber()
  @Min(1)
  page?: number;

  @IsOptional()
  @IsNumber()
  @Min(1)
  limit?: number;
}
