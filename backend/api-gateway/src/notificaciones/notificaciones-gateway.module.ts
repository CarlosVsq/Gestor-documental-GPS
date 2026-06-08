import { Module } from '@nestjs/common';
import { NotificacionesGatewayController } from './notificaciones-gateway.controller';

@Module({
  controllers: [NotificacionesGatewayController],
})
export class NotificacionesGatewayModule {}
