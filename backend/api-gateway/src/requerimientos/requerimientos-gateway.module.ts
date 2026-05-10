import { Module } from '@nestjs/common';
import { RequerimientosGatewayController } from './requerimientos-gateway.controller';
import { TcpClientsModule } from '../common/tcp-clients.module';

@Module({
  imports: [TcpClientsModule],
  controllers: [RequerimientosGatewayController]
})
export class RequerimientosGatewayModule {}
