import { IsString, IsOptional, Length } from 'class-validator';

export class CreateCategoriaDto {
    @IsString()
    @Length(2, 255)
    nombre: string;

    @IsOptional()
    @IsString()
    descripcion?: string;
}
