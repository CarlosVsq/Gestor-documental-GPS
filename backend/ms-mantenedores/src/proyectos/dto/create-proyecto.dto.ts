import { IsString, IsNumber, IsDateString, Length } from 'class-validator';

export class CreateProyectoDto {
    @IsString()
    @Length(2, 255)
    nombre: string;

    @IsDateString({}, { message: 'fechaInicio debe ser una fecha válida (YYYY-MM-DD)' })
    fechaInicio: string;

    @IsDateString({}, { message: 'fechaFin debe ser una fecha válida (YYYY-MM-DD)' })
    fechaFin: string;

    @IsNumber({}, { message: 'El areaId debe ser un número' })
    areaId: number;
}
