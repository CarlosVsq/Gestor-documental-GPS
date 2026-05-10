import { Module } from '@nestjs/common';
import { AreasGatewayController } from './areas-gateway.controller';

@Module({
  controllers: [AreasGatewayController],
})
export class AreasGatewayModule {}
