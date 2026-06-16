import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Response } from 'express';

/**
 * AuthExceptionFilter — Maneja errores de autenticación
 * Convierte errores de Passport en respuestas HTTP claras
 * Aplicar con @UseFilters(AuthExceptionFilter) en controladores que requieren JWT
 */
@Catch()
export class AuthExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(AuthExceptionFilter.name);

  catch(exception: any, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest();

    // Errores de Passport/JWT
    if (exception.name === 'UnauthorizedException') {
      this.logger.warn(
        `[AUTH] 401 Unauthorized: ${exception.message} - ${request.path}`,
      );
      return response.status(HttpStatus.UNAUTHORIZED).json({
        statusCode: HttpStatus.UNAUTHORIZED,
        message: exception.message || 'Unauthorized',
        path: request.path,
      });
    }

    // JWT expirado
    if (exception.name === 'TokenExpiredError') {
      this.logger.warn(`[AUTH] Token expirado - ${request.path}`);
      return response.status(HttpStatus.UNAUTHORIZED).json({
        statusCode: HttpStatus.UNAUTHORIZED,
        message: 'Token expirado',
        path: request.path,
      });
    }

    // JWT inválido
    if (exception.name === 'JsonWebTokenError') {
      this.logger.warn(
        `[AUTH] JWT inválido: ${exception.message} - ${request.path}`,
      );
      return response.status(HttpStatus.UNAUTHORIZED).json({
        statusCode: HttpStatus.UNAUTHORIZED,
        message: 'Token inválido',
        path: request.path,
      });
    }

    // Falta Authorization header
    if (exception.message?.includes('No auth token')) {
      this.logger.warn(`[AUTH] Missing JWT token - ${request.path}`);
      return response.status(HttpStatus.UNAUTHORIZED).json({
        statusCode: HttpStatus.UNAUTHORIZED,
        message: 'Token de autenticación requerido',
        path: request.path,
      });
    }

    // Por defecto, errores genéricos
    const status = exception.statusCode || HttpStatus.INTERNAL_SERVER_ERROR;
    const message = exception.message || 'Error interno del servidor';

    this.logger.error(`[ERROR] ${status}: ${message} - ${request.path}`);

    return response.status(status).json({
      statusCode: status,
      message,
      path: request.path,
    });
  }
}
