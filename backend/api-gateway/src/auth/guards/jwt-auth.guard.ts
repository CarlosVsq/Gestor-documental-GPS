import {
  Injectable,
  UnauthorizedException,
  Logger,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

/**
 * Guard de autenticación JWT — HU-25
 * Protege endpoints que requieren un token JWT válido.
 * Reemplaza errores genéricos por mensajes claros según best practices.
 */
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  private readonly logger = new Logger(JwtAuthGuard.name);

  handleRequest(err: any, user: any, info: any, context: any) {
    if (err || !user) {
      let message = 'Token de autenticación requerido';

      if (info?.name === 'TokenExpiredError') {
        message = 'Token expirado';
      } else if (info?.name === 'JsonWebTokenError') {
        message = 'Token inválido';
      } else if (info?.message?.includes('No auth token')) {
        message = 'Token de autenticación requerido';
      }

      this.logger.warn(`[JWT] Auth failed: ${message} - ${info?.message}`);
      throw new UnauthorizedException(message);
    }

    return user;
  }
}
