import { IsString, IsOptional, IsNumber, Length, IsEnum, IsDateString } from 'class-validator';
import { PrioridadRequerimiento } from '../requerimiento.entity';

export class CreateRequerimientoDto {
    @IsString()
    @Length(2, 255)
    titulo: string;

    @IsOptional()
    @IsString()
    descripcion?: string;

    @IsNumber({}, { message: 'Debe especificar el Proyecto' })
    proyectoId: number;

    @IsNumber({}, { message: 'Debe especificar el Área' })
    areaId: number;

    @IsNumber({}, { message: 'Debe especificar el Contratista' })
    contratistaId: number;

    @IsNumber({}, { message: 'Debe especificar la Categoría' })
    categoriaId: number;

    @IsNumber({}, { message: 'Debe especificar el Subtipo' })
    subtipoId: number;

    @IsOptional()
    @IsEnum(PrioridadRequerimiento)
    prioridad?: PrioridadRequerimiento;

    @IsOptional()
    @IsDateString()
    fechaVencimiento?: string;

    @IsOptional()
    @IsNumber()
    usuarioCreadorId?: number;
}
