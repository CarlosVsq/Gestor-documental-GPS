import { IsEmail, IsString, MinLength, IsOptional, IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Role } from '../enums/role.enum';

/**
 * DTO para actualizar un usuario — HU-19
 * Todos los campos son opcionales.
 */
export class UpdateUserDto {
  @ApiProperty({ description: 'Nombre completo', example: 'Juan Pérez', required: false })
  @IsOptional()
  @IsString()
  nombre?: string;

  @ApiProperty({ description: 'Email único', example: 'juan@sgd.cl', required: false })
  @IsOptional()
  @IsEmail({}, { message: 'Email no válido' })
  email?: string;

  @ApiProperty({ description: 'Nueva contraseña (min 6)', required: false })
  @IsOptional()
  @MinLength(6, { message: 'La contraseña debe tener al menos 6 caracteres' })
  password?: string;

  @ApiProperty({ description: 'Rol del usuario', enum: Role, required: false })
  @IsOptional()
  @IsEnum(Role, { message: 'Rol no válido' })
  rol?: Role;
}
