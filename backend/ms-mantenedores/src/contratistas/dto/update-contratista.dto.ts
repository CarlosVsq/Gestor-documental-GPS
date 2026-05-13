import { IsString, IsEmail, IsOptional, Length, Matches, IsEnum } from 'class-validator';

/**
 * DTO para actualizar un contratista (HU-01, CA-3)
 * Todos los campos son opcionales.
 */
export class UpdateContratistaDto {
  @IsOptional()
  @IsString()
  @Length(2, 255)
  nombre?: string;

  @IsOptional()
  @IsString()
  @Matches(/^\d{1,2}\.\d{3}\.\d{3}-[\dkK]$/, {
    message: 'El RUT debe tener el formato XX.XXX.XXX-X',
  })
  rut?: string;

  @IsOptional()
  @IsEmail({}, { message: 'El email debe ser válido' })
  email?: string;

  @IsOptional()
  @IsString()
  telefono?: string;

  @IsOptional()
  @IsEnum(['read', 'write', 'read_write', 'admin'])
  permisosObjectFS?: 'read' | 'write' | 'read_write' | 'admin';
}
