import { IsString, IsOptional, IsNumber, IsDateString, Length } from 'class-validator';

export class UpdateProyectoDto {
    @IsOptional()
    @IsString()
    @Length(2, 255)
    nombre?: string;

    @IsOptional()
    @IsDateString({}, { message: 'fechaInicio debe ser una fecha válida (YYYY-MM-DD)' })
    fechaInicio?: string;

    @IsOptional()
    @IsDateString({}, { message: 'fechaFin debe ser una fecha válida (YYYY-MM-DD)' })
    fechaFin?: string;

    @IsOptional()
    @IsNumber({}, { message: 'El areaId debe ser un número' })
    areaId?: number;
}
