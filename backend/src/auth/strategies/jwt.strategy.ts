import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../entities/user.entity';

/**
 * Estrategia JWT para Passport — HU-25
 * Extrae y valida el token JWT del header Authorization.
 */
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET || 'sgd-dev-secret-key-2026',
    });
  }

  /**
   * Valida el payload del JWT y retorna el usuario.
   * Este objeto se inyecta en request.user
   */
  async validate(payload: { sub: number; email: string; rol: string }) {
    const user = await this.userRepository.findOne({
      where: { id: payload.sub, activo: true },
    });

    if (!user) {
      throw new UnauthorizedException('Usuario no encontrado o inactivo');
    }

    return {
      id: user.id,
      email: user.email,
      nombre: user.nombre,
      rol: user.rol,
    };
  }
}
