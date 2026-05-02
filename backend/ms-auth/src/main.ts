import { NestFactory } from '@nestjs/core';
import { Transport, MicroserviceOptions } from '@nestjs/microservices';
import { AppModule } from './app.module';
import { Logger } from '@nestjs/common';
import { AuthService } from './auth.service';

async function bootstrap() {
  const logger = new Logger('ms-auth');

  const app = await NestFactory.createMicroservice<MicroserviceOptions>(
    AppModule,
    {
      transport: Transport.TCP,
      options: {
        host: '0.0.0.0',
        port: 3001,
      },
    },
  );

  // Seed: crear usuario admin por defecto si no existe
  const authService = app.get(AuthService);
  await authService.seedAdmin();

  await app.listen();
  logger.log('🔐 ms-auth escuchando en TCP :3001');
}
bootstrap();
