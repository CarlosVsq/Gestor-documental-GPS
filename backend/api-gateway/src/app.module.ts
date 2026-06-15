import { Module } from '@nestjs/common';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { CacheModule } from '@nestjs/cache-manager';
import { SERVICE_NAMES } from './common/constants';

// Módulos del Gateway (proxy controllers)
import { AuthGatewayModule } from './auth/auth-gateway.module';
import { ContratistasGatewayModule } from './contratistas/contratistas-gateway.module';
import { AreasGatewayModule } from './areas/areas-gateway.module';
import { ProyectosGatewayModule } from './proyectos/proyectos-gateway.module';
import { AlmacenamientoGatewayModule } from './almacenamiento/almacenamiento-gateway.module';

import { TcpClientsModule } from './common/tcp-clients.module';
import { CategoriasGatewayModule } from './categorias/categorias-gateway.module';
import { SubtiposGatewayModule } from './subtipos/subtipos-gateway.module';
import { RequerimientosGatewayModule } from './requerimientos/requerimientos-gateway.module';
import { AuditoriaGatewayModule } from './auditoria/auditoria-gateway.module';
import { AuditoriaInterceptor } from './common/interceptors/auditoria.interceptor';

// HU-27: Configuración de sesión
import { ConfigGatewayModule } from './config/config-gateway.module';
// HU-34/HU-35: Notificaciones
import { NotificacionesGatewayModule } from './notificaciones/notificaciones-gateway.module';

@Module({
  imports: [
    // Conexiones TCP a los microservicios (Global)
    TcpClientsModule,

    // JWT para validación local de tokens en el Gateway
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'sgd-dev-secret-key-2026',
      signOptions: {
        expiresIn: (process.env.JWT_EXPIRES_IN || '8h') as any,
      },
    }),

    // Caché
    CacheModule.register({
      isGlobal: true,
      ttl: 60000,
    }),

    // Módulos proxy
    AuthGatewayModule,
    ContratistasGatewayModule,
    AreasGatewayModule,
    ProyectosGatewayModule,
    CategoriasGatewayModule,
    SubtiposGatewayModule,
    RequerimientosGatewayModule,
    AlmacenamientoGatewayModule,
    AuditoriaGatewayModule,
    // Nuevos módulos
    ConfigGatewayModule,
    NotificacionesGatewayModule,
  ],
  providers: [
    { provide: APP_INTERCEPTOR, useClass: AuditoriaInterceptor },
  ],
})
export class AppModule {}
