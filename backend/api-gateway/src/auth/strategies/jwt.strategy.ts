import { Injectable, UnauthorizedException, Logger } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';

/**
 * Estrategia JWT para el API Gateway — HU-25/HU-17/HU-10
 * Valida el token JWT localmente (sin consultar ms-auth).
 * El payload del JWT contiene sub, email, rol, permissions, jti.
 * 
 * HU-17: Ahora inyecta permissions[] en request.user para que
 * PermissionsGuard pueda verificar permisos granulares.
 */
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  private readonly logger = new Logger(JwtStrategy.name);
  private readonly jwtSecret = process.env.JWT_SECRET || 'sgd-dev-secret-key-2026';

  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        ExtractJwt.fromAuthHeaderAsBearerToken(),
        (req) => {
          if (req && req.query && req.query.token) {
            return req.query.token as string;
          }
          return null;
        }
      ]),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET || 'sgd-dev-secret-key-2026',
    });
  }

  /**
   * Valida el payload del JWT y retorna los datos del usuario.
   * Este objeto se inyecta en request.user
   * 
   * HU-17: Incluye permissions[] y nombre.
   * HU-10: Incluye jti para futura revocación.
   */
  async validate(payload: {
    sub: number;
    email: string;
    nombre?: string;
    rol: string;
    permissions?: string[];
    contratistaId?: number;
    jti?: string;
  }) {
    if (!payload || !payload.sub) {
      this.logger.warn('JWT payload inválido: falta sub');
      throw new UnauthorizedException('JWT inválido');
    }

    return {
      id: payload.sub,
      email: payload.email,
      nombre: payload.nombre || null,
      rol: payload.rol,
      permissions: payload.permissions || [],
      contratistaId: payload.contratistaId || null,
      jti: payload.jti || null,
    };
  }
}
