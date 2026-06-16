import { Module } from '@nestjs/common';
import { AlmacenamientoGatewayController } from './almacenamiento-gateway.controller';

@Module({
  controllers: [AlmacenamientoGatewayController],
})
export class AlmacenamientoGatewayModule {}
