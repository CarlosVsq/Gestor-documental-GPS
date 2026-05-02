import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { ProyectosService } from './proyectos.service';
import { PROYECTOS_PATTERNS } from '../common/constants';

/**
 * Controller de Proyectos — Microservicio TCP
 */
@Controller()
export class ProyectosController {
    constructor(private readonly proyectosService: ProyectosService) { }

    @MessagePattern(PROYECTOS_PATTERNS.CREATE)
    async create(@Payload() createDto: any) {
        return this.proyectosService.create(createDto);
    }

    @MessagePattern(PROYECTOS_PATTERNS.FIND_ALL)
    async findAll(@Payload() data: { page: number; limit: number }) {
        return this.proyectosService.findAll(data.page, data.limit);
    }

    @MessagePattern(PROYECTOS_PATTERNS.FIND_ONE)
    async findOne(@Payload() data: { id: number }) {
        return this.proyectosService.findOne(data.id);
    }

    @MessagePattern(PROYECTOS_PATTERNS.UPDATE)
    async update(@Payload() data: { id: number; dto: any }) {
        return this.proyectosService.update(data.id, data.dto);
    }

    @MessagePattern(PROYECTOS_PATTERNS.REMOVE)
    async remove(@Payload() data: { id: number }) {
        return this.proyectosService.remove(data.id);
    }

    @MessagePattern(PROYECTOS_PATTERNS.STATS)
    async getStats() {
        return this.proyectosService.getStats();
    }
}
