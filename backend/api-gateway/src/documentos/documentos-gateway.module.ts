import { Module } from '@nestjs/common';
import { DocumentosGatewayController } from './documentos-gateway.controller';

@Module({
  controllers: [DocumentosGatewayController],
})
export class DocumentosGatewayModule {}
