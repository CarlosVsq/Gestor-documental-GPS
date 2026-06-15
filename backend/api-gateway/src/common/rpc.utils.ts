import { HttpStatus } from '@nestjs/common';
import { firstValueFrom, Observable, TimeoutError } from 'rxjs';
import { timeout, catchError } from 'rxjs/operators';

const TCP_TIMEOUT_MS = 5000;

/**
 * Llama a un microservicio via TCP con timeout de 5 s.
 * Reemplaza el patrón try/catch + firstValueFrom que se repetía en cada controller.
 * Los errores se propagan al RpcExceptionFilter global.
 */
export function callService<T>(observable: Observable<T>): Promise<T> {
  return firstValueFrom(
    observable.pipe(
      timeout(TCP_TIMEOUT_MS),
      catchError((err) => {
        if (err instanceof TimeoutError) {
          throw { statusCode: HttpStatus.SERVICE_UNAVAILABLE, message: 'El servicio no responde (timeout)' };
        }
        throw err;
      }),
    ),
  );
}
