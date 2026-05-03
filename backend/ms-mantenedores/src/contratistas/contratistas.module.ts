import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ContratistasController } from './contratistas.controller';
import { ContratistasService } from './contratistas.service';
import { Contratista } from './contratista.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Contratista])],
  controllers: [ContratistasController],
  providers: [ContratistasService],
  exports: [ContratistasService],
})
export class ContratistasModule {}
