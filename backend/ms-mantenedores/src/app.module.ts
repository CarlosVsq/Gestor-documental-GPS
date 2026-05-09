import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ContratistasModule } from './contratistas/contratistas.module';
import { AreasModule } from './areas/areas.module';
import { ProyectosModule } from './proyectos/proyectos.module';
import { CategoriasModule } from './categorias/categorias.module';
import { SubtiposModule } from './subtipos/subtipos.module';
import { SeedService } from './common/seed.service';
import { Categoria } from './categorias/categoria.entity';
import { Subtipo } from './subtipos/subtipo.entity';

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
    TypeOrmModule.forFeature([Categoria, Subtipo]),
    ContratistasModule,
    AreasModule,
    ProyectosModule,
    CategoriasModule,
    SubtiposModule,
  ],
  providers: [SeedService],
})
export class AppModule {}
