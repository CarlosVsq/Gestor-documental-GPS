import { IsString, IsOptional, IsNumber, Length } from 'class-validator';

export class CreateSubtipoDto {
    @IsString()
    @Length(2, 255)
    nombre: string;

    @IsOptional()
    @IsString()
    descripcion?: string;

    @IsNumber({}, { message: 'El categoriaId debe ser un número' })
    categoriaId: number;
}
