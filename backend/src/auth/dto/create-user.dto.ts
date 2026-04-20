import { IsEmail, IsNotEmpty, IsString, MinLength, IsOptional, IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Role } from '../enums/role.enum';

/**
 * DTO para crear un usuario — HU-19
 */
export class CreateUserDto {
  @ApiProperty({ description: 'Nombre completo', example: 'Juan Pérez' })
  @IsNotEmpty({ message: 'El nombre es requerido' })
  @IsString()
  nombre: string;

  @ApiProperty({ description: 'Email único', example: 'juan@sgd.cl' })
  @IsNotEmpty({ message: 'El email es requerido' })
  @IsEmail({}, { message: 'Email no válido' })
  email: string;

  @ApiProperty({ description: 'Contraseña (min 6 caracteres)', example: 'pass123' })
  @IsNotEmpty({ message: 'La contraseña es requerida' })
  @MinLength(6, { message: 'La contraseña debe tener al menos 6 caracteres' })
  password: string;

  @ApiProperty({ description: 'Rol del usuario', enum: Role, example: Role.ADMIN })
  @IsOptional()
  @IsEnum(Role, { message: 'Rol no válido' })
  rol?: Role;
}
