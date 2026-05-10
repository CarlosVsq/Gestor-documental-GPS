import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AreasController } from './areas.controller';
import { AreasService } from './areas.service';
import { Area } from './area.entity';
import { Proyecto } from '../proyectos/proyecto.entity';
import { ContratistasModule } from '../contratistas/contratistas.module';

@Module({
    imports: [
        TypeOrmModule.forFeature([Area, Proyecto]),
        ContratistasModule,
    ],
    controllers: [AreasController],
    providers: [AreasService],
    exports: [AreasService],
})
export class AreasModule { }
