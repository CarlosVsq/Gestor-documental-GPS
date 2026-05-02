import { Module } from '@nestjs/common';
import { ContratistasGatewayController } from './contratistas-gateway.controller';

@Module({
  controllers: [ContratistasGatewayController],
})
export class ContratistasGatewayModule {}
