import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { ContratistasService } from './contratistas.service';
import { CONTRATISTAS_PATTERNS } from '../common/constants';

/**
 * Controller de Contratistas — Microservicio TCP
 */
@Controller()
export class ContratistasController {
  constructor(private readonly contratistasService: ContratistasService) {}

  @MessagePattern(CONTRATISTAS_PATTERNS.CREATE)
  async create(@Payload() createDto: any) {
    return this.contratistasService.create(createDto);
  }

  @MessagePattern(CONTRATISTAS_PATTERNS.FIND_ALL)
  async findAll(@Payload() data: { page: number; limit: number }) {
    return this.contratistasService.findAll(data.page, data.limit);
  }

  @MessagePattern(CONTRATISTAS_PATTERNS.FIND_ONE)
  async findOne(@Payload() data: { id: number }) {
    return this.contratistasService.findOne(data.id);
  }

  @MessagePattern(CONTRATISTAS_PATTERNS.UPDATE)
  async update(@Payload() data: { id: number; dto: any }) {
    return this.contratistasService.update(data.id, data.dto);
  }

  @MessagePattern(CONTRATISTAS_PATTERNS.REMOVE)
  async remove(@Payload() data: { id: number }) {
    return this.contratistasService.remove(data.id);
  }

  @MessagePattern(CONTRATISTAS_PATTERNS.STATS)
  async getStats() {
    return this.contratistasService.getStats();
  }
}
