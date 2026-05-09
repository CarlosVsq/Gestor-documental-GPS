import { PartialType } from '@nestjs/mapped-types';
import { CreateCategoriaDto } from './create-categoria.dto';
import { IsBoolean, IsOptional, IsString } from 'class-validator';

export class UpdateCategoriaDto {
    @IsOptional()
    @IsString()
    nombre?: string;

    @IsOptional()
    @IsString()
    descripcion?: string;

    @IsOptional()
    @IsBoolean()
    activo?: boolean;
}
