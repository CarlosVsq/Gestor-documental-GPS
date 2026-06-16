import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Documento } from './entities/documento.entity';
import { DocumentosController } from './documentos.controller';
import { DocumentosService } from './documentos.service';
import { DocumentosRepository } from './documentos.repository';
import { SeaweedFsModule } from '../seaweedfs/seaweedfs.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Documento]),
    SeaweedFsModule,
  ],
  controllers: [DocumentosController],
  providers: [DocumentosService, DocumentosRepository],
  exports: [DocumentosService],
})
export class DocumentosModule {}
