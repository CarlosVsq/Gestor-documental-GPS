import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Documento } from './documentos/entities/documento.entity';
import { DocumentosModule } from './documentos/documentos.module';
import { ExpedientesModule } from './expedientes/expedientes.module';
import { SeaweedFsModule } from './seaweedfs/seaweedfs.module';
import { PdfModule } from './pdf/pdf.module';

const isProduction = !!process.env.DB_HOST;

@Module({
  imports: [
    TypeOrmModule.forRoot(
      isProduction
        ? {
          type: 'postgres',
          host: process.env.DB_HOST,
          port: parseInt(process.env.DB_PORT, 10) || 5432,
          username: process.env.DB_USERNAME || 'sgd_user',
          password: process.env.DB_PASSWORD || 'sgd_password',
          database: process.env.DB_DATABASE || 'sgd_db',
          entities: [Documento],
          synchronize: true,
        }
        : {
          type: 'better-sqlite3' as any,
          database: 'sgd_almacenamiento_dev.db',
          entities: [Documento],
          synchronize: true,
        },
    ),
    SeaweedFsModule,
    DocumentosModule,
    ExpedientesModule,
    PdfModule,
  ],
})
export class AppModule {}
