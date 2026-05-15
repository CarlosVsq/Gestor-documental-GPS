import { Global, Module } from '@nestjs/common';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { SERVICE_NAMES } from './constants';

// NOTA: ms-documentos está DEPRECADO. El servicio de almacenamiento ahora es
// ms-almacenamiento (TCP :3003). El cliente DOCUMENTOS_SERVICE permanece por
// compatibilidad pero no debe usarse en nuevo código.

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
        // @deprecated — apunta al mismo host que ms-almacenamiento para no romper imports existentes
        name: SERVICE_NAMES.DOCUMENTOS,
        transport: Transport.TCP,
        options: {
          host: process.env.ALMACENAMIENTO_SERVICE_HOST || 'ms-almacenamiento',
          port: parseInt(process.env.ALMACENAMIENTO_SERVICE_PORT, 10) || 3003,
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
      {
        name: SERVICE_NAMES.ALMACENAMIENTO,
        transport: Transport.TCP,
        options: {
          host: process.env.ALMACENAMIENTO_SERVICE_HOST || 'ms-almacenamiento',
          port: parseInt(process.env.ALMACENAMIENTO_SERVICE_PORT, 10) || 3003,
        },
      },
    ]),
  ],
  exports: [ClientsModule],
})
export class TcpClientsModule { }
