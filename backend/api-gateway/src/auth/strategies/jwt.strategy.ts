import { Injectable, UnauthorizedException, Logger } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';

/**
 * Estrategia JWT para el API Gateway — HU-25
 * Valida el token JWT localmente (sin consultar ms-auth).
 * El payload del JWT contiene sub, email y rol.
 */
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  private readonly logger = new Logger(JwtStrategy.name);
  private readonly jwtSecret = process.env.JWT_SECRET || 'sgd-dev-secret-key-2026';

  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET || 'sgd-dev-secret-key-2026',
    });
  }

  /**
   * Valida el payload del JWT y retorna los datos del usuario.
   * Este objeto se inyecta en request.user
   */
  async validate(payload: { sub: number; email: string; rol: string; contratistaId?: number }) {
    if (!payload || !payload.sub) {
      this.logger.warn('JWT payload inválido: falta sub');
      throw new UnauthorizedException('JWT inválido');
    }

    return {
      id: payload.sub,
      email: payload.email,
      rol: payload.rol,
      contratistaId: payload.contratistaId || null,
    };
  }
}
