import { IsString, IsOptional, IsNumber, Length, Matches } from 'class-validator';

export class CreateAreaDto {
    @IsString()
    @Length(2, 255)
    nombre: string;

    @IsString()
    @Length(1, 10)
    @Matches(/^[A-Z0-9]{1,10}$/, {
        message: 'El código debe ser alfanumérico en mayúsculas (ej: CIVIL, ELEC)'
    })
    codigoArea: string;

    @IsOptional()
    @IsString()
    descripcion?: string;

    @IsNumber({}, { message: 'El contratistaId debe ser un número' })
    contratistaId: number;
}
