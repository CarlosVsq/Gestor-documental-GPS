import { IsString, IsOptional, IsNumber, Length } from 'class-validator';

export class CreateAreaDto {
    @IsString()
    @Length(2, 255)
    nombre: string;

    @IsOptional()
    @IsString()
    descripcion?: string;

    @IsNumber({}, { message: 'El contratistaId debe ser un número' })
    contratistaId: number;
}
