import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Proyecto } from './proyecto.entity';

/**
 * Módulo de Proyectos - STUB para HU-03
 *
 * Este módulo actualmente solo registra la entidad Proyecto en TypeORM.
 * La persona que implemente HU-03 debe:
 *   1. Crear ProyectosService con CRUD completo
 *   2. Crear ProyectosController con endpoints REST
 *   3. Crear DTOs (CreateProyectoDto, UpdateProyectoDto) con campos:
 *      - nombre, codigo (único), fecha_inicio, fecha_fin, area_id
 *   4. Validar la cadena Proyecto → Área → Contratista (RF1.2)
 *   5. Importar AreasModule para validar que el área exista
 */
@Module({
    imports: [TypeOrmModule.forFeature([Proyecto])],
    exports: [TypeOrmModule],
})
export class ProyectosModule { }
