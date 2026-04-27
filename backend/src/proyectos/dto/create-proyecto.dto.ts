import { IsString, IsOptional, IsNumber, IsDateString, Length, Matches } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateProyectoDto {
    @ApiProperty({
        description: 'Nombre del proyecto',
        example: 'Proyecto Puente Norte',
        minLength: 2,
        maxLength: 255,
    })
    @IsString()
    @Length(2, 255)
    nombre: string;

    @ApiProperty({
        description: 'Fecha de inicio (formato YYYY-MM-DD)',
        example: '2026-05-01',
    })
    @IsDateString({}, { message: 'fechaInicio debe ser una fecha válida (YYYY-MM-DD)' })
    fechaInicio: string;

    @ApiProperty({
        description: 'Fecha de fin (formato YYYY-MM-DD)',
        example: '2026-12-31',
    })
    @IsDateString({}, { message: 'fechaFin debe ser una fecha válida (YYYY-MM-DD)' })
    fechaFin: string;

    @ApiProperty({
        description: 'ID del área a la que pertenece el proyecto',
        example: 1,
    })
    @IsNumber({}, { message: 'El areaId debe ser un número' })
    areaId: number;
}
