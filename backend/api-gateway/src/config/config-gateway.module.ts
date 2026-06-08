import { Module } from '@nestjs/common';
import { ConfigGatewayController } from './config-gateway.controller';

@Module({
  controllers: [ConfigGatewayController],
})
export class ConfigGatewayModule {}
