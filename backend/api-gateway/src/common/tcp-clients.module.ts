import { Global, Module } from '@nestjs/common';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { SERVICE_NAMES } from './constants';

@Global()
@Module({
  imports: [
    ClientsModule.register([
      {
        name: SERVICE_NAMES.AUTH,
        transport: Transport.TCP,
        options: {
          host: process.env.AUTH_SERVICE_HOST || 'ms-auth',
          port: parseInt(process.env.AUTH_SERVICE_PORT, 10) || 3001,
        },
      },
      {
        name: SERVICE_NAMES.MANTENEDORES,
        transport: Transport.TCP,
        options: {
          host: process.env.MANTENEDORES_SERVICE_HOST || 'ms-mantenedores',
          port: parseInt(process.env.MANTENEDORES_SERVICE_PORT, 10) || 3002,
        },
      },
      {
        name: SERVICE_NAMES.DOCUMENTOS,
        transport: Transport.TCP,
        options: {
          host: process.env.DOCUMENTOS_SERVICE_HOST || 'ms-documentos',
          port: parseInt(process.env.DOCUMENTOS_SERVICE_PORT, 10) || 3003,
        },
      },
      {
        name: SERVICE_NAMES.REQUERIMIENTOS,
        transport: Transport.TCP,
        options: {
          host: process.env.REQUERIMIENTOS_SERVICE_HOST || 'ms-requerimientos',
          port: parseInt(process.env.REQUERIMIENTOS_SERVICE_PORT, 10) || 3004,
        },
      },
    ]),
  ],
  exports: [ClientsModule],
})
export class TcpClientsModule { }
