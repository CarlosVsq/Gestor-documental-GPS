import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsOptional, IsNumber } from 'class-validator';

export class CreateAreaDto {
  @ApiProperty({ description: 'Nombre del área', example: 'Recursos Humanos' })
  @IsNotEmpty()
  @IsString()
  nombre: string;

  @ApiProperty({ description: 'Descripción detallada', example: 'Área encargada de personal', required: false })
  @IsOptional()
  @IsString()
  descripcion?: string;

  @ApiProperty({ description: 'ID del contratista al que pertenece este área', example: 1 })
  @IsNotEmpty()
  @IsNumber()
  contratista_id: number;
}
