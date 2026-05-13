import { IsString, IsNumber, IsDateString, Length, IsOptional, IsEnum, Min } from 'class-validator';

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

    @IsOptional()
    @IsString()
    @Length(1, 255)
    ubicacion?: string;

    @IsOptional()
    @IsNumber({ maxDecimalPlaces: 2 })
    @Min(0, { message: 'Presupuesto no puede ser negativo' })
    presupuestoEstimado?: number;

    @IsOptional()
    @IsNumber({ allowInfinity: false, allowNaN: false })
    @Min(0, { message: 'Horas hombre no pueden ser negativas' })
    horasHombre?: number;

    @IsEnum(['En Licitación', 'Ejecución', 'Finalizado', 'Suspendido'], {
        message: 'Estado debe ser: En Licitación, Ejecución, Finalizado o Suspendido'
    })
    estadoProyecto: 'En Licitación' | 'Ejecución' | 'Finalizado' | 'Suspendido';
}
