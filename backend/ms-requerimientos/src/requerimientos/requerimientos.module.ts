import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { RequerimientosService } from './requerimientos.service';
import { RequerimientosController } from './requerimientos.controller';
import { Requerimiento } from './requerimiento.entity';
import { ALMACENAMIENTO_CLIENT } from '../common/constants';

@Module({
  imports: [
    TypeOrmModule.forFeature([Requerimiento]),
    ClientsModule.register([
      {
        name: ALMACENAMIENTO_CLIENT,
        transport: Transport.TCP,
        options: {
          host: process.env.ALMACENAMIENTO_SERVICE_HOST || 'ms-almacenamiento',
          port: parseInt(process.env.ALMACENAMIENTO_SERVICE_PORT || '3003', 10),
        },
      },
    ]),
  ],
  controllers: [RequerimientosController],
  providers: [RequerimientosService],
  exports: [RequerimientosService],
})
export class RequerimientosModule {}
