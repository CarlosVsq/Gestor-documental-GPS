import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ContratistasModule } from './contratistas/contratistas.module';
import { AreasModule } from './areas/areas.module';
import { ProyectosModule } from './proyectos/proyectos.module';

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
    ContratistasModule,
    AreasModule,
    ProyectosModule,
  ],
})
export class AppModule {}
