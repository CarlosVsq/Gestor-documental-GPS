import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

/**
 * Guard de autenticación JWT — HU-25
 * Protege endpoints que requieren un token JWT válido.
 */
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {}
