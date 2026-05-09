import { IsEnum, IsOptional, IsString } from 'class-validator';
import { EstadoRequerimiento } from '../requerimiento.entity';

export class UpdateEstadoDto {
    @IsEnum(EstadoRequerimiento, { message: 'Estado inválido' })
    estado: EstadoRequerimiento;

    @IsOptional()
    @IsString()
    motivoRechazo?: string;
}
