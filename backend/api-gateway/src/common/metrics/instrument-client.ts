import { ClientProxy } from '@nestjs/microservices';
import { Counter, Histogram } from 'prom-client';
import { Observable, tap } from 'rxjs';

/**
 * Monkey-patcha `client.send` para emitir métricas Prometheus por cada
 * llamada TCP downstream. Mantiene la firma de `ClientProxy` intacta para
 * los controllers que ya inyectan `ClientProxy`.
 */
export function instrumentClient(
  client: ClientProxy,
  serviceName: string,
  duration: Histogram<string>,
  counter: Counter<string>,
): ClientProxy {
  const originalSend: ClientProxy['send'] = client.send.bind(client);

  client.send = function instrumentedSend<TResult = unknown, TInput = unknown>(
    pattern: unknown,
    data: TInput,
  ): Observable<TResult> {
    const start = process.hrtime.bigint();
    const labels = { service: serviceName, pattern: String(pattern) };

    const observe = (result: 'ok' | 'error') => {
      const elapsedSeconds = Number(process.hrtime.bigint() - start) / 1e9;
      duration.observe(labels, elapsedSeconds);
      counter.inc({ ...labels, result });
    };

    return originalSend<TResult, TInput>(pattern, data).pipe(
      tap({
        next: () => observe('ok'),
        error: () => observe('error'),
      }),
    );
  };

  return client;
}
