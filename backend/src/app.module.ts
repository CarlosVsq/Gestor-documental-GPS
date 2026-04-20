import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CacheModule } from '@nestjs/cache-manager';
import { ContratistasModule } from './contratistas/contratistas.module';
import { AreasModule } from './areas/areas.module';
import { AuthModule } from './auth/auth.module';
import { DocumentosModule } from './documentos/documentos.module';

// Detectar si estamos en Docker (con PostgreSQL) o en desarrollo local (SQLite)
const isProduction = !!process.env.DB_HOST;

@Module({
  imports: [
    // En Docker/producción usa PostgreSQL, en desarrollo local usa SQLite
    TypeOrmModule.forRoot(
      isProduction
        ? {
            type: 'postgres',
            host: process.env.DB_HOST,
            port: parseInt(process.env.DB_PORT, 10) || 5432,
            username: process.env.DB_USERNAME || 'sgd_user',
            password: process.env.DB_PASSWORD || 'sgd_password',
            database: process.env.DB_DATABASE || 'sgd_db',
            autoLoadEntities: true,
            synchronize: true,
          }
        : {
            type: 'better-sqlite3',
            database: 'sgd_dev.db',
            autoLoadEntities: true,
            synchronize: true,
          },
    ),

    // Configuración de Caché (memoria en desarrollo)
    CacheModule.register({
      isGlobal: true,
      ttl: 60000, // 60 segundos de cache por defecto
    }),

    // Módulos del sistema
    AuthModule,
    ContratistasModule,
    AreasModule,
    DocumentosModule,
  ],
})
export class AppModule {}
