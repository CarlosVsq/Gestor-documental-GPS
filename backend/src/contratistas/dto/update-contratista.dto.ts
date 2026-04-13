import { PartialType } from '@nestjs/swagger';
import { CreateContratistaDto } from './create-contratista.dto';

/**
 * DTO para actualizar un contratista (HU-01, CA-3)
 * Todos los campos son opcionales gracias a PartialType.
 */
export class UpdateContratistaDto extends PartialType(CreateContratistaDto) {}
