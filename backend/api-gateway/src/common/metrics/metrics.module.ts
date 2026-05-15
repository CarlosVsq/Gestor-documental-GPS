import { Global, Module } from '@nestjs/common';
import {
  PrometheusModule,
  makeCounterProvider,
  makeHistogramProvider,
} from '@willsoto/nestjs-prometheus';

const HTTP_DURATION = makeHistogramProvider({
  name: 'http_request_duration_seconds',
  help: 'Duración de requests HTTP atendidas por el API Gateway (segundos)',
  labelNames: ['method', 'route', 'status_code'],
  buckets: [0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10],
});

const HTTP_TOTAL = makeCounterProvider({
  name: 'http_requests_total',
  help: 'Total de requests HTTP atendidas por el API Gateway',
  labelNames: ['method', 'route', 'status_code'],
});

const TCP_DURATION = makeHistogramProvider({
  name: 'tcp_request_duration_seconds',
  help: 'Duración de llamadas TCP del Gateway hacia los microservicios (segundos)',
  labelNames: ['service', 'pattern'],
  buckets: [0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5],
});

const TCP_TOTAL = makeCounterProvider({
  name: 'tcp_requests_total',
  help: 'Total de llamadas TCP del Gateway hacia los microservicios',
  labelNames: ['service', 'pattern', 'result'],
});

@Global()
@Module({
  imports: [
    PrometheusModule.register({
      defaultMetrics: { enabled: true },
      defaultLabels: { app: 'api-gateway' },
    }),
  ],
  providers: [HTTP_DURATION, HTTP_TOTAL, TCP_DURATION, TCP_TOTAL],
  exports: [HTTP_DURATION, HTTP_TOTAL, TCP_DURATION, TCP_TOTAL],
})
export class MetricsModule {}
