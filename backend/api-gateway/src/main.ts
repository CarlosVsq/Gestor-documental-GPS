import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Habilitar CORS para el frontend
  app.enableCors({
    origin: ['http://localhost:5173', 'http://localhost:3000'],
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true,
  });

  // Prefijo global de la API
  app.setGlobalPrefix('api');

  // Validación global de DTOs
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // Configuración de Swagger — centralizado en el Gateway
  const config = new DocumentBuilder()
    .setTitle('SGD - Sistema de Gestión Documental')
    .setDescription(
      'API REST del Sistema de Gestión Documental (Arquitectura de Microservicios). ' +
      'Proyecto desarrollado para la asignatura Gestión de Proyectos de Software - UBB.',
    )
    .setVersion('2.0')
    .addTag('auth', 'Autenticación y Sesión (HU-25)')
    .addTag('contratistas', 'Gestión de Contratistas (HU-01)')
    .addTag('areas', 'Gestión de Áreas (HU-02)')
    .addTag('proyectos', 'Gestión de Proyectos (HU-03)')
    .addTag('documentos', 'Gestión Documental (HU-07)')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  const port = process.env.PORT || 3000;
  await app.listen(port);
  console.log(`🚀 API Gateway corriendo en: http://localhost:${port}`);
  console.log(`📖 Swagger disponible en: http://localhost:${port}/api/docs`);
}
bootstrap();
