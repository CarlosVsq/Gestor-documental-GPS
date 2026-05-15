import { Module } from '@nestjs/common';
import { PdfController } from './pdf.controller';
import { PdfService } from './pdf.service';
import { SeaweedFsModule } from '../seaweedfs/seaweedfs.module';
import { DocumentosModule } from '../documentos/documentos.module';

@Module({
  imports: [SeaweedFsModule, DocumentosModule],
  controllers: [PdfController],
  providers: [PdfService],
})
export class PdfModule {}
