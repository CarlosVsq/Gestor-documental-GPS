import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SubtiposService } from './subtipos.service';
import { SubtiposController } from './subtipos.controller';
import { Subtipo } from './subtipo.entity';
import { Categoria } from '../categorias/categoria.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Subtipo, Categoria])],
  controllers: [SubtiposController],
  providers: [SubtiposService],
  exports: [SubtiposService],
})
export class SubtiposModule {}
