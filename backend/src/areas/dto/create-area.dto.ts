import { IsString, IsOptional, IsNumber, Length } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateAreaDto {
    @ApiProperty({
        description: 'Nombre del área',
        example: 'Área de Ingeniería',
        minLength: 2,
        maxLength: 255,
    })
    @IsString()
    @Length(2, 255)
    nombre: string;

    @ApiProperty({
        description: 'Descripción del área',
        example: 'Área encargada de los proyectos de ingeniería',
        required: false,
    })
    @IsOptional()
    @IsString()
    descripcion?: string;

    @ApiProperty({
        description: 'ID del contratista al que pertenece el área',
        example: 1,
    })
    @IsNumber({}, { message: 'El contratistaId debe ser un número' })
    contratistaId: number;
}
