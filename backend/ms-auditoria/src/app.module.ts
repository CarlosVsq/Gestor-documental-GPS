import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuditoriaModule } from './auditoria/auditoria.module';

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
    AuditoriaModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
