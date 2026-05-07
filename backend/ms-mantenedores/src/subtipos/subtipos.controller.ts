import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { SubtiposService } from './subtipos.service';
import { SUBTIPOS_PATTERNS } from '../common/constants';
import { CreateSubtipoDto } from './dto/create-subtipo.dto';
import { UpdateSubtipoDto } from './dto/update-subtipo.dto';

@Controller()
export class SubtiposController {
  constructor(private readonly subtiposService: SubtiposService) {}

  @MessagePattern(SUBTIPOS_PATTERNS.CREATE)
  create(@Payload() createDto: CreateSubtipoDto) {
    return this.subtiposService.create(createDto);
  }

  @MessagePattern(SUBTIPOS_PATTERNS.FIND_ALL)
  findAll(@Payload() payload: { page?: number; limit?: number; categoriaId?: number }) {
    return this.subtiposService.findAll(payload?.page, payload?.limit, payload?.categoriaId);
  }

  @MessagePattern(SUBTIPOS_PATTERNS.FIND_ONE)
  findOne(@Payload() id: number) {
    return this.subtiposService.findOne(id);
  }

  @MessagePattern(SUBTIPOS_PATTERNS.UPDATE)
  update(@Payload() payload: { id: number; updateDto: UpdateSubtipoDto }) {
    return this.subtiposService.update(payload.id, payload.updateDto);
  }

  @MessagePattern(SUBTIPOS_PATTERNS.TOGGLE)
  toggle(@Payload() id: number) {
    return this.subtiposService.toggle(id);
  }
}
