import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CacheModule } from '@nestjs/cache-manager';
import { AppController } from './app.controller';
import { createClient } from 'redis';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '5432', 10),
      username: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASSWORD || 'postgres',
      database: process.env.DB_NAME || 'gps_db',
      autoLoadEntities: true,
      synchronize: true, // SOLO PARA DESARROLLO (MVP)
    }),
    CacheModule.register({
      url: process.env.REDIS_URL || 'redis://localhost:6379',
      isGlobal: true,
    }),
  ],
  controllers: [AppController],
})
export class AppModule {}
