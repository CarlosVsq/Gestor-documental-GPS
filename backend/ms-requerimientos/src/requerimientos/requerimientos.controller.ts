import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { RequerimientosService } from './requerimientos.service';
import { REQUERIMIENTOS_PATTERNS } from '../common/constants';
import { CreateRequerimientoDto } from './dto/create-requerimiento.dto';
import { UpdateEstadoDto } from './dto/update-estado.dto';

@Controller()
export class RequerimientosController {
  constructor(private readonly requerimientosService: RequerimientosService) {}

  @MessagePattern(REQUERIMIENTOS_PATTERNS.CREATE)
  create(@Payload() createDto: CreateRequerimientoDto) {
    return this.requerimientosService.create(createDto);
  }

  @MessagePattern(REQUERIMIENTOS_PATTERNS.FIND_ALL)
  findAll(@Payload() payload: { 
      page?: number; 
      limit?: number; 
      filtros?: any;
  }) {
    return this.requerimientosService.findAll(payload?.page, payload?.limit, payload?.filtros);
  }

  @MessagePattern(REQUERIMIENTOS_PATTERNS.FIND_ONE)
  findOne(@Payload() id: number) {
    return this.requerimientosService.findOne(id);
  }

  @MessagePattern(REQUERIMIENTOS_PATTERNS.UPDATE_STATE)
  updateState(@Payload() payload: { id: number; updateDto: UpdateEstadoDto }) {
    return this.requerimientosService.updateState(payload.id, payload.updateDto);
  }
}
