import { IsString, IsEmail, IsOptional, Length, Matches } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

/**
 * DTO para crear un nuevo contratista (HU-01, CA-1)
 */
export class CreateContratistaDto {
  @ApiProperty({
    description: 'Nombre o razón social del contratista',
    example: 'Constructora Sur SpA',
    minLength: 2,
    maxLength: 255,
  })
  @IsString()
  @Length(2, 255)
  nombre: string;

  @ApiProperty({
    description: 'RUT del contratista (formato: XX.XXX.XXX-X)',
    example: '76.123.456-7',
  })
  @IsString()
  @Matches(/^\d{1,2}\.\d{3}\.\d{3}-[\dkK]$/, {
    message: 'El RUT debe tener el formato XX.XXX.XXX-X',
  })
  rut: string;

  @ApiProperty({
    description: 'Email de contacto',
    example: 'contacto@constructorasur.cl',
  })
  @IsEmail({}, { message: 'El email debe ser válido' })
  email: string;

  @ApiProperty({
    description: 'Teléfono de contacto',
    example: '+56912345678',
    required: false,
  })
  @IsOptional()
  @IsString()
  telefono?: string;
}
