import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';

/**
 * Estrategia JWT para el API Gateway — HU-25
 * Valida el token JWT localmente (sin consultar ms-auth).
 * El payload del JWT contiene sub, email y rol.
 */
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
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
  async validate(payload: { sub: number; email: string; rol: string }) {
    return {
      id: payload.sub,
      email: payload.email,
      rol: payload.rol,
    };
  }
}
