import { NestFactory } from '@nestjs/core';
import { Transport, MicroserviceOptions } from '@nestjs/microservices';
import { AppModule } from './app.module';
import { Logger } from '@nestjs/common';

async function bootstrap() {
  const logger = new Logger('ms-auditoria');

  const app = await NestFactory.createMicroservice<MicroserviceOptions>(
    AppModule,
    {
      transport: Transport.TCP,
      options: {
        host: '0.0.0.0',
        port: parseInt(process.env.MS_AUDITORIA_PORT, 10) || 3005,
      },
    },
  );

  await app.listen();
  logger.log('ms-auditoria escuchando en TCP :3005');
}
bootstrap();
