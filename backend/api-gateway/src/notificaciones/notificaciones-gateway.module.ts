import { Module } from '@nestjs/common';
import { NotificacionesGatewayController } from './notificaciones-gateway.controller';
import { NotificacionesDispatchService } from './notificaciones-dispatch.service';

@Module({
  controllers: [NotificacionesGatewayController],
  providers: [NotificacionesDispatchService],
  // Exportado para que AuditoriaInterceptor (APP_INTERCEPTOR) pueda inyectarlo.
  exports: [NotificacionesDispatchService],
})
export class NotificacionesGatewayModule {}
