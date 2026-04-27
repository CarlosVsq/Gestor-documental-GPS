import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AuthService } from './auth/auth.service';

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

  // Configuración de Swagger
  const config = new DocumentBuilder()
    .setTitle('SGD - Sistema de Gestión Documental')
    .setDescription(
      'API REST del Sistema de Gestión Documental. ' +
      'Proyecto desarrollado para la asignatura Gestión de Proyectos de Software - UBB.',
    )
    .setVersion('1.0')
    .addTag('auth', 'Autenticación y Sesión (HU-25)')
    .addTag('contratistas', 'Gestión de Contratistas (HU-01)')
    .addTag('areas', 'Gestión de Áreas (HU-02)')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  // Seed: crear usuario admin por defecto si no existe
  const authService = app.get(AuthService);
  await authService.seedAdmin();

  const port = process.env.PORT || 3000;
  await app.listen(port);
  console.log(`🚀 SGD Backend corriendo en: http://localhost:${port}`);
  console.log(`📖 Swagger disponible en: http://localhost:${port}/api/docs`);
}
bootstrap();
