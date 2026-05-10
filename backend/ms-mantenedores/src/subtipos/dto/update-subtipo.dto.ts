import { PartialType } from '@nestjs/mapped-types';
import { CreateSubtipoDto } from './create-subtipo.dto';
import { IsBoolean, IsOptional, IsString, IsInt } from 'class-validator';

export class UpdateSubtipoDto {
    @IsOptional()
    @IsString()
    nombre?: string;

    @IsOptional()
    @IsString()
    descripcion?: string;

    @IsOptional()
    @IsInt()
    categoriaId?: number;

    @IsOptional()
    @IsBoolean()
    activo?: boolean;
}
