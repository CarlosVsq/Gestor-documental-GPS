import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CategoriasService } from './categorias.service';
import { CategoriasController } from './categorias.controller';
import { Categoria } from './categoria.entity';
import { Subtipo } from '../subtipos/subtipo.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Categoria, Subtipo])],
  controllers: [CategoriasController],
  providers: [CategoriasService],
  exports: [CategoriasService],
})
export class CategoriasModule {}
