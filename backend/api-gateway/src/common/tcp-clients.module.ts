import { Global, Module, Provider } from '@nestjs/common';
import { ClientProxyFactory, Transport } from '@nestjs/microservices';
import { getToken } from '@willsoto/nestjs-prometheus';
import { Counter, Histogram } from 'prom-client';
import { SERVICE_NAMES } from './constants';
import { instrumentClient } from './metrics/instrument-client';

interface MsConfig {
  token: string;
  serviceName: string;
  envHost: string;
  envPort: string;
  defaultHost: string;
  defaultPort: number;
}

const MS_SERVICES: MsConfig[] = [
  {
    token: SERVICE_NAMES.AUTH,
    serviceName: 'AUTH_SERVICE',
    envHost: 'AUTH_SERVICE_HOST',
    envPort: 'AUTH_SERVICE_PORT',
    defaultHost: 'ms-auth',
    defaultPort: 3001,
  },
  {
    token: SERVICE_NAMES.MANTENEDORES,
    serviceName: 'MANTENEDORES_SERVICE',
    envHost: 'MANTENEDORES_SERVICE_HOST',
    envPort: 'MANTENEDORES_SERVICE_PORT',
    defaultHost: 'ms-mantenedores',
    defaultPort: 3002,
  },
  {
    token: SERVICE_NAMES.DOCUMENTOS,
    serviceName: 'DOCUMENTOS_SERVICE',
    envHost: 'DOCUMENTOS_SERVICE_HOST',
    envPort: 'DOCUMENTOS_SERVICE_PORT',
    defaultHost: 'ms-documentos',
    defaultPort: 3003,
  },
  {
    token: SERVICE_NAMES.REQUERIMIENTOS,
    serviceName: 'REQUERIMIENTOS_SERVICE',
    envHost: 'REQUERIMIENTOS_SERVICE_HOST',
    envPort: 'REQUERIMIENTOS_SERVICE_PORT',
    defaultHost: 'ms-requerimientos',
    defaultPort: 3004,
  },
];

const clientProviders: Provider[] = MS_SERVICES.map((s) => ({
  provide: s.token,
  useFactory: (duration: Histogram<string>, counter: Counter<string>) => {
    const client = ClientProxyFactory.create({
      transport: Transport.TCP,
      options: {
        host: process.env[s.envHost] || s.defaultHost,
        port: parseInt(process.env[s.envPort] || '', 10) || s.defaultPort,
      },
    });
    return instrumentClient(client, s.serviceName, duration, counter);
  },
  inject: [
    getToken('tcp_request_duration_seconds'),
    getToken('tcp_requests_total'),
  ],
}));

@Global()
@Module({
  providers: clientProviders,
  exports: MS_SERVICES.map((s) => s.token),
})
export class TcpClientsModule {}
