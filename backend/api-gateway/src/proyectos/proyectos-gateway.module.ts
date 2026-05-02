import { Module } from '@nestjs/common';
import { ProyectosGatewayController } from './proyectos-gateway.controller';

@Module({
  controllers: [ProyectosGatewayController],
})
export class ProyectosGatewayModule {}
