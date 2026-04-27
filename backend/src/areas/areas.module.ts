import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AreasController } from './areas.contoller';
import { AreasService } from './areas.service';
import { Area } from './area.entity';
import { Proyecto } from '../proyectos/proyecto.entity';
import { ContratistasModule } from '../contratistas/contratistas.module';

@Module({
    imports: [
        TypeOrmModule.forFeature([Area, Proyecto]),
        ContratistasModule, // Para validar que el contratista exista
    ],
    controllers: [AreasController],
    providers: [AreasService],
    exports: [AreasService], // Exportar para uso futuro del módulo de Proyectos
})
export class AreasModule { }
