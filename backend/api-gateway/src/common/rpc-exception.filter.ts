import { ExceptionFilter, Catch, ArgumentsHost, HttpException, HttpStatus, Logger } from '@nestjs/common';
import { Response } from 'express';
import { TimeoutError } from 'rxjs';

/**
 * RpcExceptionFilter — Convierte errores de microservicios TCP en respuestas HTTP.
 *
 * Precedencia:
 *   1. HttpException (guards, pipes) → devuelve su propio statusCode/message.
 *   2. TimeoutError   → 503 Service Unavailable.
 *   3. RpcException payload { statusCode, message } → respeta el código del servicio.
 *   4. Cualquier otro error → 500.
 *
 * Se registra globalmente en main.ts con app.useGlobalFilters().
 * Los endpoints que usen @UseFilters() local (ej. AuthExceptionFilter) siguen
 * teniendo prioridad sobre este filtro global.
 */
@Catch()
export class RpcExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(RpcExceptionFilter.name);

  catch(exception: any, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    if (exception instanceof HttpException) {
      return response.status(exception.getStatus()).json(exception.getResponse());
    }

    if (exception instanceof TimeoutError || exception?.name === 'TimeoutError') {
      return response.status(HttpStatus.SERVICE_UNAVAILABLE).json({
        statusCode: HttpStatus.SERVICE_UNAVAILABLE,
        message: 'El servicio no responde. Intenta de nuevo en unos segundos.',
      });
    }

    const statusCode: number = exception?.statusCode || HttpStatus.INTERNAL_SERVER_ERROR;
    const message: string = exception?.message || 'Error interno del servidor';

    if (statusCode >= 500) {
      this.logger.error(`RPC ${statusCode}: ${message}`);
    }

    return response.status(statusCode).json({ statusCode, message });
  }
}
