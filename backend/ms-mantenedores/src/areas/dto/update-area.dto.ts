import { IsString, IsOptional, IsNumber, Length } from 'class-validator';

export class UpdateAreaDto {
    @IsOptional()
    @IsString()
    @Length(2, 255)
    nombre?: string;

    @IsOptional()
    @IsString()
    descripcion?: string;

    @IsOptional()
    @IsNumber({}, { message: 'El contratistaId debe ser un número' })
    contratistaId?: number;
}
