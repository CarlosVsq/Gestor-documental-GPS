import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { AuthService } from './auth.service';
import { AUTH_PATTERNS, Role } from './common/constants';

interface CreateUserPayload {
  nombre: string;
  email: string;
  password: string;
  rol?: Role;
  contratistaId?: number;
}

interface UpdateUserPayload {
  nombre?: string;
  email?: string;
  password?: string;
  rol?: Role;
  contratistaId?: number;
}

/**
 * Controller de Auth — Microservicio TCP
 * HU-25/HU-17/HU-10
 * 
 * Reemplaza los decoradores HTTP (@Get, @Post) por @MessagePattern
 * para comunicación TCP con el API Gateway.
 */
@Controller()
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @MessagePattern(AUTH_PATTERNS.LOGIN)
  async login(@Payload() loginDto: { email: string; password: string }) {
    return this.authService.login(loginDto);
  }

  @MessagePattern(AUTH_PATTERNS.PROFILE)
  async getProfile(@Payload() data: { userId: number }) {
    return this.authService.getProfile(data.userId);
  }

  @MessagePattern(AUTH_PATTERNS.FIND_ALL_USERS)
  async findAll() {
    return this.authService.findAll();
  }

  @MessagePattern(AUTH_PATTERNS.FIND_ONE_USER)
  async findOne(@Payload() data: { id: number }) {
    return this.authService.findOne(data.id);
  }

  @MessagePattern(AUTH_PATTERNS.CREATE_USER)
  async createUser(@Payload() dto: CreateUserPayload) {
    return this.authService.createUser(dto);
  }

  @MessagePattern(AUTH_PATTERNS.UPDATE_USER)
  async updateUser(@Payload() data: { id: number; dto: UpdateUserPayload }) {
    return this.authService.updateUser(data.id, data.dto);
  }

  @MessagePattern(AUTH_PATTERNS.TOGGLE_USER)
  async toggleActive(@Payload() data: { id: number }) {
    return this.authService.toggleActive(data.id);
  }

  @MessagePattern(AUTH_PATTERNS.VALIDATE_USER)
  async validateUser(@Payload() data: { userId: number }) {
    return this.authService.getProfile(data.userId);
  }

  // ============================================================
  // HU-10: Verificación JWT centralizada
  // ============================================================

  @MessagePattern(AUTH_PATTERNS.VERIFY_JWT)
  async verifyJwt(@Payload() data: { token: string }) {
    return this.authService.verifyJwt(data.token);
  }

  // ============================================================
  // HU-17: Roles y Permisos
  // ============================================================

  @MessagePattern(AUTH_PATTERNS.GET_ROLE_PERMISSIONS)
  async getRolePermissions(@Payload() data: { roleName: string }) {
    return this.authService.getPermissionsForRole(data.roleName as Role);
  }

  @MessagePattern(AUTH_PATTERNS.FIND_ALL_ROLES)
  async findAllRoles() {
    return this.authService.findAllRoles();
  }

  @MessagePattern(AUTH_PATTERNS.SEED_ADMIN)
  async seedAdmin() {
    return this.authService.seedAdmin();
  }
}
