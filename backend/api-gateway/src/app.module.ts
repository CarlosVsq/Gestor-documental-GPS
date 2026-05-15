import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { CacheModule } from '@nestjs/cache-manager';

// Métricas Prometheus
import { MetricsModule } from './common/metrics/metrics.module';
import { HttpMetricsMiddleware } from './common/metrics/http-metrics.middleware';

// Módulos del Gateway (proxy controllers)
import { AuthGatewayModule } from './auth/auth-gateway.module';
import { ContratistasGatewayModule } from './contratistas/contratistas-gateway.module';
import { AreasGatewayModule } from './areas/areas-gateway.module';
import { ProyectosGatewayModule } from './proyectos/proyectos-gateway.module';
import { DocumentosGatewayModule } from './documentos/documentos-gateway.module';

import { TcpClientsModule } from './common/tcp-clients.module';
import { CategoriasGatewayModule } from './categorias/categorias-gateway.module';
import { SubtiposGatewayModule } from './subtipos/subtipos-gateway.module';
import { RequerimientosGatewayModule } from './requerimientos/requerimientos-gateway.module';

@Module({
  imports: [
    // Métricas Prometheus (Global, expone /metrics y declara contadores/histogramas)
    MetricsModule,

    // Conexiones TCP a los microservicios (Global, ya instrumentadas)
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
    DocumentosGatewayModule,
    CategoriasGatewayModule,
    SubtiposGatewayModule,
    RequerimientosGatewayModule,
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    // Mide TODAS las requests (incluidas 401/403 rechazadas por Guards),
    // excepto el scrape de Prometheus al propio /metrics.
    consumer
      .apply(HttpMetricsMiddleware)
      .exclude('metrics')
      .forRoutes('*');
  }
}
