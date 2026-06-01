import { Module } from '@nestjs/common';
import { AuditoriaGatewayController } from './auditoria-gateway.controller';
import { TcpClientsModule } from '../common/tcp-clients.module';

@Module({
  imports: [TcpClientsModule],
  controllers: [AuditoriaGatewayController],
})
export class AuditoriaGatewayModule {}
