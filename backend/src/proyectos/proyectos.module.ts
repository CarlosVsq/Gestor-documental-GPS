import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Proyecto } from './proyecto.entity';
import { ProyectosController } from './proyectos.controller';
import { ProyectosService } from './proyectos.service';
import { AreasModule } from '../areas/areas.module';

@Module({
    imports: [
        TypeOrmModule.forFeature([Proyecto]),
        AreasModule,
    ],
    controllers: [ProyectosController],
    providers: [ProyectosService],
    exports: [ProyectosService, TypeOrmModule],
})
export class ProyectosModule { }
