import { Module } from '@nestjs/common';
import { SubtiposGatewayController } from './subtipos-gateway.controller';
import { TcpClientsModule } from '../common/tcp-clients.module';

@Module({
  imports: [TcpClientsModule],
  controllers: [SubtiposGatewayController]
})
export class SubtiposGatewayModule {}
