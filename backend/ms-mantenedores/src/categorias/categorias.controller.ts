import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { CategoriasService } from './categorias.service';
import { CATEGORIAS_PATTERNS } from '../common/constants';
import { CreateCategoriaDto } from './dto/create-categoria.dto';
import { UpdateCategoriaDto } from './dto/update-categoria.dto';

@Controller()
export class CategoriasController {
  constructor(private readonly categoriasService: CategoriasService) {}

  @MessagePattern(CATEGORIAS_PATTERNS.CREATE)
  create(@Payload() createDto: CreateCategoriaDto) {
    return this.categoriasService.create(createDto);
  }

  @MessagePattern(CATEGORIAS_PATTERNS.FIND_ALL)
  findAll(@Payload() payload: { page?: number; limit?: number }) {
    return this.categoriasService.findAll(payload?.page, payload?.limit);
  }

  @MessagePattern(CATEGORIAS_PATTERNS.FIND_ONE)
  findOne(@Payload() id: number) {
    return this.categoriasService.findOne(id);
  }

  @MessagePattern(CATEGORIAS_PATTERNS.UPDATE)
  update(@Payload() payload: { id: number; updateDto: UpdateCategoriaDto }) {
    return this.categoriasService.update(payload.id, payload.updateDto);
  }

  @MessagePattern(CATEGORIAS_PATTERNS.TOGGLE)
  toggle(@Payload() id: number) {
    return this.categoriasService.toggle(id);
  }
}
