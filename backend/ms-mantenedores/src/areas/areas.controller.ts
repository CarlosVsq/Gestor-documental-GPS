import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { AreasService } from './areas.service';
import { AREAS_PATTERNS } from '../common/constants';

/**
 * Controller de Áreas — Microservicio TCP
 */
@Controller()
export class AreasController {
    constructor(private readonly areasService: AreasService) { }

    @MessagePattern(AREAS_PATTERNS.CREATE)
    async create(@Payload() createDto: any) {
        return this.areasService.create(createDto);
    }

    @MessagePattern(AREAS_PATTERNS.FIND_ALL)
    async findAll(@Payload() data: { page: number; limit: number }) {
        return this.areasService.findAll(data.page, data.limit);
    }

    @MessagePattern(AREAS_PATTERNS.FIND_ONE)
    async findOne(@Payload() data: { id: number }) {
        return this.areasService.findOne(data.id);
    }

    @MessagePattern(AREAS_PATTERNS.UPDATE)
    async update(@Payload() data: { id: number; dto: any }) {
        return this.areasService.update(data.id, data.dto);
    }

    @MessagePattern(AREAS_PATTERNS.REMOVE)
    async remove(@Payload() data: { id: number }) {
        return this.areasService.remove(data.id);
    }

    @MessagePattern(AREAS_PATTERNS.STATS)
    async getStats() {
        return this.areasService.getStats();
    }
}
