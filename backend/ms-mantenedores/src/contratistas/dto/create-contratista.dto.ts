import { IsString, IsEmail, IsOptional, Length, Matches, IsEnum } from 'class-validator';

/**
 * DTO para crear un nuevo contratista (HU-01, CA-1)
 */
export class CreateContratistaDto {
  @IsString()
  @Length(2, 255)
  nombre: string;

  @IsString()
  @Matches(/^\d{1,2}\.\d{3}\.\d{3}-[\dkK]$/, {
    message: 'El RUT debe tener el formato XX.XXX.XXX-X',
  })
  rut: string;

  @IsEmail({}, { message: 'El email debe ser válido' })
  email: string;

  @IsOptional()
  @IsString()
  telefono?: string;

  @IsOptional()
  @IsEnum(['read', 'write', 'read_write', 'admin'])
  permisosObjectFS?: 'read' | 'write' | 'read_write' | 'admin';

  @IsOptional()
  @IsString()
  creadoPor?: string;
}
