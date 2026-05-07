import { Module } from '@nestjs/common';
import { CategoriasGatewayController } from './categorias-gateway.controller';
import { TcpClientsModule } from '../common/tcp-clients.module';

@Module({
  imports: [TcpClientsModule],
  controllers: [CategoriasGatewayController]
})
export class CategoriasGatewayModule {}
